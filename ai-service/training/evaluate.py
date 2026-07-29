"""Evaluate a YOLO bubble-segmentation checkpoint on the test split."""

import argparse
import json
import shutil
from numbers import Real
from pathlib import Path


PREDICTION_OVERLAY_LIMIT = 10


def _scalar_metrics(results: object) -> dict[str, float]:
    return {
        str(name): float(value)
        for name, value in getattr(results, "results_dict", {}).items()
        if isinstance(value, Real) and not isinstance(value, bool)
    }


def _copy_prediction_overlays(source: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for overlay in sorted(source.glob("*_pred.*"))[:PREDICTION_OVERLAY_LIMIT]:
        shutil.copy2(overlay, destination / overlay.name)


def evaluate(weights: Path, dataset_yaml: Path, output_dir: Path) -> dict[str, float]:
    """Run test validation, export scalar metrics, and retain a few overlays."""
    from ultralytics import YOLO

    output_dir = output_dir.resolve()
    validation_dir = output_dir / "validation"
    model = YOLO(weights)
    results = model.val(
        data=str(dataset_yaml),
        split="test",
        project=validation_dir.parent,
        name=validation_dir.name,
        exist_ok=True,
    )
    output_dir.mkdir(parents=True, exist_ok=True)
    metrics = _scalar_metrics(results)
    (output_dir / "test-metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    if model.names != {0: "balloon"}:
        raise ValueError(f"expected balloon checkpoint names, got {model.names!r}")
    _copy_prediction_overlays(validation_dir, output_dir / "predictions")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("weights", type=Path)
    parser.add_argument("dataset_yaml", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    print(json.dumps(evaluate(args.weights, args.dataset_yaml, args.output_dir), indent=2))


if __name__ == "__main__":
    main()
