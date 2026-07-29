"""Convert MS92 per-book balloon masks into a local YOLO segmentation dataset."""

import argparse
import hashlib
import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from pycocotools import mask as mask_utils


BUBBLE_CATEGORY_ID = 5
SPLITS = ("train", "validation", "test")


def _label_row(annotation: dict[str, object], width: int, height: int) -> str:
    mask = mask_utils.decode(annotation["segmentation"])
    if mask.ndim == 3:
        mask = np.any(mask, axis=2)
    mask = np.asarray(mask, dtype=np.uint8)
    if not mask.any():
        raise ValueError("bubble mask is empty")

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError("bubble mask has no contour")
    contour = max(contours, key=cv2.contourArea).reshape(-1, 2)
    if len(contour) < 3:
        raise ValueError("bubble contour has fewer than 3 points")

    points = [(x / width, y / height) for x, y in contour]
    if any(not 0 <= coordinate <= 1 for point in points for coordinate in point):
        raise ValueError("bubble contour coordinate is outside [0, 1]")
    return "0 " + " ".join(f"{coordinate:.6f}" for point in points for coordinate in point)


def iter_book_pages(annotation_root: Path, image_root: Path):
    """Yield each MS92 page with its balloon-only COCO annotations."""
    for annotation_path in sorted(annotation_root.glob("*.json")):
        book = annotation_path.stem
        coco = json.loads(annotation_path.read_text(encoding="utf-8"))
        annotations_by_image: dict[object, list[dict[str, object]]] = {}
        for annotation in coco["annotations"]:
            if annotation["category_id"] == BUBBLE_CATEGORY_ID:
                annotations_by_image.setdefault(annotation["image_id"], []).append(annotation)
        for image in coco["images"]:
            relative_path = Path(image["file_name"])
            yield book, relative_path, image_root / relative_path, image, annotations_by_image.get(image["id"], [])


def split_for_book(book: str) -> str:
    """Return the deterministic YOLO split for an MS92 book."""
    return SPLITS[int.from_bytes(hashlib.sha256(book.encode()).digest()) % len(SPLITS)]


def prepare_dataset(annotation_root: Path, image_root: Path, output_root: Path) -> Path:
    """Write a YOLO segmentation dataset from MS92 per-book annotations."""
    annotation_root = Path(annotation_root)
    image_root = Path(image_root)
    output_root = Path(output_root)
    manifest: dict[str, object] = {"counts": {}, "missing_paths": [], "checksums": {}}

    usable = dict.fromkeys(SPLITS, 0)
    for book, relative_path, source, image, annotations in iter_book_pages(annotation_root, image_root):
        split = split_for_book(book)
        manifest_path = f"{split}/{relative_path.as_posix()}"
        if not source.is_file():
            manifest["missing_paths"].append(manifest_path)
            continue
        if cv2.imread(str(source)) is None:
            raise ValueError(f"unreadable image: {source}")

        destination = output_root / "images" / split / relative_path
        label_path = output_root / "labels" / split / relative_path.with_suffix(".txt")
        destination.parent.mkdir(parents=True, exist_ok=True)
        label_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        rows = [_label_row(annotation, image["width"], image["height"]) for annotation in annotations]
        label_path.write_text("\n".join(rows), encoding="utf-8")
        manifest["checksums"][manifest_path] = hashlib.sha256(source.read_bytes()).hexdigest()
        usable[split] += 1

    for split, count in usable.items():
        if not count:
            raise ValueError(f"{split} split has no usable images")
    manifest["counts"] = usable

    output_root.mkdir(parents=True, exist_ok=True)
    (output_root / "dataset.yaml").write_text(
        "train: images/train\nval: images/validation\ntest: images/test\nnames: [balloon]\n",
        encoding="utf-8",
    )
    (output_root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return output_root


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("annotation_root", type=Path)
    parser.add_argument("image_root", type=Path)
    parser.add_argument("output_root", type=Path)
    args = parser.parse_args()
    print(prepare_dataset(args.annotation_root, args.image_root, args.output_root))


if __name__ == "__main__":
    main()
