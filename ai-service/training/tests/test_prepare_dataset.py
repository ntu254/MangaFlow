import hashlib
import importlib
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import pytest
from pycocotools import mask as mask_utils


def _prepare_dataset():
    try:
        return importlib.import_module("training.prepare_dataset").prepare_dataset
    except ModuleNotFoundError:
        pytest.fail("training.prepare_dataset is not implemented")


def _write_image(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    assert cv2.imwrite(str(path), np.full((10, 10, 3), 255, dtype=np.uint8))


def _compressed_rle() -> dict[str, object]:
    bitmap = np.zeros((10, 10), dtype=np.uint8)
    bitmap[2:8, 2:8] = 1
    encoded = mask_utils.encode(np.asfortranarray(bitmap))
    return {"size": encoded["size"], "counts": encoded["counts"].decode("ascii")}


def _write_book(path: Path, images: list[dict[str, object]], annotations: list[dict[str, object]]) -> None:
    path.write_text(
        json.dumps(
            {
                "images": images,
                "annotations": annotations,
                "categories": [{"id": 1, "name": "frame"}, {"id": 5, "name": "balloon"}],
            }
        ),
        encoding="utf-8",
    )


def test_prepare_dataset_reads_a_per_book_balloon_mask(tmp_path: Path) -> None:
    """Fails if MS92's jsons/<book>.json layout is treated as split COCO files."""
    annotations = tmp_path / "annotations" / "jsons"
    images = tmp_path / "images"
    output = tmp_path / "dataset"
    book = "Alpha"
    page = "000.jpg"
    image = images / book / page
    _write_image(image)
    annotations.mkdir(parents=True)
    _write_book(
        annotations / f"{book}.json",
        [{"id": 1, "file_name": f"{book}/{page}", "width": 10, "height": 10}],
        [
            {"id": 11, "image_id": 1, "category_id": 5, "segmentation": _compressed_rle()},
            {"id": 12, "image_id": 1, "category_id": 1, "segmentation": _compressed_rle()},
        ],
    )
    for other_book in ("Gamma", "ARMS"):
        other_image = images / other_book / page
        _write_image(other_image)
        _write_book(
            annotations / f"{other_book}.json",
            [{"id": 1, "file_name": f"{other_book}/{page}", "width": 10, "height": 10}],
            [{"id": 1, "image_id": 1, "category_id": 5, "segmentation": _compressed_rle()}],
        )

    assert _prepare_dataset()(annotations, images, output) == output

    assert (output / "images" / "train" / book / page).read_bytes() == image.read_bytes()
    train_rows = (output / "labels" / "train" / book / "000.txt").read_text(encoding="utf-8").splitlines()
    assert len(train_rows) == 1
    assert train_rows[0].startswith("0 ")

    manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["counts"] == {"train": 1, "validation": 1, "test": 1}
    assert manifest["missing_paths"] == []
    assert manifest["checksums"][f"train/{book}/{page}"] == hashlib.sha256(image.read_bytes()).hexdigest()
    yaml_text = (output / "dataset.yaml").read_text(encoding="utf-8")
    assert "train: images/train" in yaml_text
    assert "val: images/validation" in yaml_text
    assert "test: images/test" in yaml_text
    assert "names: [balloon]" in yaml_text


def test_prepare_dataset_keeps_all_pages_of_a_book_in_its_hash_split(tmp_path: Path) -> None:
    """Fails if a page from one book is routed to a different split."""
    annotations = tmp_path / "annotations" / "jsons"
    images = tmp_path / "images"
    output = tmp_path / "dataset"
    annotations.mkdir(parents=True)
    for book, pages in {"Alpha": ["000.jpg"], "Gamma": ["000.jpg"], "ARMS": ["000.jpg", "001.jpg"]}.items():
        for page in pages:
            _write_image(images / book / page)
        _write_book(
            annotations / f"{book}.json",
            [
                {"id": index, "file_name": f"{book}/{page}", "width": 10, "height": 10}
                for index, page in enumerate(pages, start=1)
            ],
            [
                {"id": index, "image_id": index, "category_id": 5, "segmentation": _compressed_rle()}
                for index, _page in enumerate(pages, start=1)
            ],
        )

    _prepare_dataset()(annotations, images, output)

    assert sorted(path.name for path in (output / "images" / "test" / "ARMS").iterdir()) == ["000.jpg", "001.jpg"]
    assert not (output / "images" / "train" / "ARMS").exists()
    assert not (output / "images" / "validation" / "ARMS").exists()


def test_prepare_dataset_rejects_an_empty_hash_split(tmp_path: Path) -> None:
    """Fails if a hash split has no usable images."""
    annotations = tmp_path / "annotations" / "jsons"
    images = tmp_path / "images"
    annotations.mkdir(parents=True)
    for book in ("Alpha", "Gamma"):
        _write_image(images / book / "000.jpg")
        _write_book(
            annotations / f"{book}.json",
            [{"id": 1, "file_name": f"{book}/000.jpg", "width": 10, "height": 10}],
            [{"id": 1, "image_id": 1, "category_id": 5, "segmentation": _compressed_rle()}],
        )

    with pytest.raises(ValueError, match="test split has no usable images"):
        _prepare_dataset()(annotations, images, tmp_path / "dataset")


def test_prepare_dataset_cli_forwards_colab_paths(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Fails if the Colab notebook cannot invoke the dataset-preparation module."""
    module = importlib.import_module("training.prepare_dataset")
    paths = [tmp_path / name for name in ("annotations", "images", "dataset")]
    monkeypatch.setattr(sys, "argv", ["prepare_dataset.py", *(str(path) for path in paths)])
    monkeypatch.setattr(module, "prepare_dataset", lambda *args: paths[-1])

    module.main()
