from pathlib import Path

import pytest

from training.download_annotations import build_snapshot_kwargs, download_annotations


def test_build_snapshot_kwargs_limits_download_to_coco_jsons(tmp_path: Path) -> None:
    """Fails if image files can be included in the dataset snapshot."""
    assert build_snapshot_kwargs("MS92/MangaSegmentation", tmp_path, "secret") == {
        "repo_id": "MS92/MangaSegmentation",
        "repo_type": "dataset",
        "local_dir": tmp_path,
        "allow_patterns": ["jsons/**", "license.txt"],
        "token": "secret",
    }


def test_download_annotations_requires_token(tmp_path: Path) -> None:
    """Fails if unauthenticated annotation downloads become possible."""
    with pytest.raises(ValueError, match="HF_TOKEN is required"):
        download_annotations("MS92/MangaSegmentation", tmp_path, "")


def test_download_annotations_returns_destination_after_snapshot(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Fails if the downloader does not invoke the gated snapshot request."""
    calls: list[dict[str, object]] = []

    def fake_snapshot_download(**kwargs: object) -> str:
        calls.append(kwargs)
        return str(tmp_path)

    monkeypatch.setattr(
        "training.download_annotations.snapshot_download", fake_snapshot_download
    )

    assert download_annotations("MS92/MangaSegmentation", tmp_path, "secret") == tmp_path
    assert calls == [
        {
            "repo_id": "MS92/MangaSegmentation",
            "repo_type": "dataset",
            "local_dir": tmp_path,
            "allow_patterns": ["jsons/**", "license.txt"],
            "token": "secret",
        }
    ]
