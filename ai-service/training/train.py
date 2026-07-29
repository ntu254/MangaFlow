"""Train the YOLO bubble-segmentation baseline."""

import argparse
from pathlib import Path


def training_kwargs(
    dataset_yaml: Path,
    run_dir: Path,
    device: str | None,
    epochs: int | None = None,
    run_name: str | None = None,
) -> dict[str, object]:
    """Return the fixed, reproducible training configuration."""
    kwargs: dict[str, object] = {
        "model": "yolo11n-seg.pt",
        "data": str(dataset_yaml),
        "imgsz": 1600,
        "batch": 8,
        "epochs": 100,
        "patience": 10,
        "seed": 0,
        "deterministic": True,
        "amp": True,
        "optimizer": "auto",
        "lr0": 0.01,
        "weight_decay": 0.0005,
        "mosaic": 1.0,
        "fliplr": 0.5,
        "scale": 0.5,
        "translate": 0.1,
        "hsv_h": 0.015,
        "hsv_s": 0.7,
        "hsv_v": 0.4,
        "erasing": 0.4,
        "project": run_dir.parent,
        "name": run_name or run_dir.name,
        "exist_ok": True,
        "device": device,
    }
    if epochs is not None:
        kwargs["epochs"] = epochs
    return kwargs


def train(
    dataset_yaml: Path,
    run_dir: Path,
    device: str | None,
    epochs: int | None = None,
    run_name: str | None = None,
) -> Path:
    """Train a YOLO11 segmentation model and return its best checkpoint path."""
    from ultralytics import YOLO

    YOLO("yolo11n-seg.pt").train(
        **training_kwargs(dataset_yaml, run_dir, device, epochs=epochs, run_name=run_name)
    )
    return run_dir.parent / (run_name or run_dir.name) / "weights" / "best.pt"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dataset_yaml", type=Path)
    parser.add_argument("run_dir", type=Path)
    parser.add_argument("--device")
    parser.add_argument("--epochs", type=int)
    parser.add_argument("--run-name")
    args = parser.parse_args()
    print(train(args.dataset_yaml, args.run_dir, args.device, epochs=args.epochs, run_name=args.run_name))


if __name__ == "__main__":
    main()
