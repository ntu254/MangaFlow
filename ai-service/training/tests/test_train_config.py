import importlib
import json
from pathlib import Path

import pytest


def _train_module():
    try:
        return importlib.import_module("training.train")
    except ModuleNotFoundError:
        pytest.fail("training.train is not implemented")


def _evaluate_module():
    try:
        return importlib.import_module("training.evaluate")
    except ModuleNotFoundError:
        pytest.fail("training.evaluate is not implemented")


def test_training_kwargs_use_the_bubble_segmentation_baseline(tmp_path: Path) -> None:
    """Fails if the prescribed training baseline silently changes."""
    kwargs = _train_module().training_kwargs(tmp_path / "dataset.yaml", tmp_path / "runs" / "bubble", None)

    assert kwargs == {
        "model": "yolo11n-seg.pt",
        "data": str(tmp_path / "dataset.yaml"),
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
        "project": tmp_path / "runs",
        "name": "bubble",
        "exist_ok": True,
        "device": None,
    }


def test_training_kwargs_accept_colab_smoke_overrides(tmp_path: Path) -> None:
    """Fails if the Colab smoke run cannot override epochs and its run name."""
    kwargs = _train_module().training_kwargs(
        tmp_path / "dataset.yaml", tmp_path / "runs" / "full", None, epochs=1, run_name="smoke"
    )

    assert kwargs["epochs"] == 1
    assert kwargs["name"] == "smoke"


def test_train_uses_the_segmentation_checkpoint(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Fails if training switches models or returns a nonstandard checkpoint path."""
    import ultralytics

    trained_with: dict[str, object] = {}

    class Model:
        def __init__(self, model: str) -> None:
            assert model == "yolo11n-seg.pt"

        def train(self, **kwargs: object) -> None:
            trained_with.update(kwargs)

    monkeypatch.setattr(ultralytics, "YOLO", Model)
    run_dir = tmp_path / "runs" / "bubble"

    assert _train_module().train(
        tmp_path / "dataset.yaml", run_dir, "cpu", epochs=1, run_name="smoke"
    ) == run_dir.parent / "smoke" / "weights" / "best.pt"
    assert trained_with["device"] == "cpu"
    assert trained_with["epochs"] == 1
    assert trained_with["name"] == "smoke"


def test_evaluate_writes_scalar_metrics_and_limits_prediction_overlays(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Fails if evaluation exports non-scalars or unbounded validation images."""
    import ultralytics

    save_dir = tmp_path / "output" / "validation"
    save_dir.mkdir(parents=True)
    for index in range(12):
        (save_dir / f"val_batch{index}_pred.jpg").write_bytes(b"prediction")

    metrics = type(
        "Metrics",
        (),
        {"results_dict": {"metrics/mAP50(B)": 0.8, "fitness": 0.7, "ignored": "not-a-scalar"}},
    )

    class Model:
        names = {0: "balloon"}

        def __init__(self, weights: Path) -> None:
            assert weights == tmp_path / "weights.pt"

        def val(self, **kwargs: object) -> object:
            assert kwargs == {
                "data": str(tmp_path / "dataset.yaml"),
                "split": "test",
                "project": tmp_path / "output",
                "name": "validation",
                "exist_ok": True,
            }
            return metrics()

    monkeypatch.setattr(ultralytics, "YOLO", Model)

    metrics = _evaluate_module().evaluate(tmp_path / "weights.pt", tmp_path / "dataset.yaml", tmp_path / "output")

    assert metrics == {"metrics/mAP50(B)": 0.8, "fitness": 0.7}
    assert json.loads((tmp_path / "output" / "test-metrics.json").read_text(encoding="utf-8")) == metrics
    assert len(list((tmp_path / "output" / "predictions").glob("*_pred.jpg"))) == 10


def test_evaluate_resolves_relative_output_dir_before_validation(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Fails if relative output paths make Ultralytics and overlay copying disagree."""
    import ultralytics

    monkeypatch.chdir(tmp_path)
    validation_dir = (tmp_path / "results" / "validation").resolve()
    validation_dir.mkdir(parents=True)
    (validation_dir / "val_batch0_pred.jpg").write_bytes(b"prediction")

    class Model:
        names = {0: "balloon"}

        def __init__(self, weights: Path) -> None:
            pass

        def val(self, **kwargs: object) -> object:
            assert kwargs["project"] == validation_dir.parent
            assert kwargs["name"] == "validation"
            return type("Metrics", (), {"results_dict": {}})()

    monkeypatch.setattr(ultralytics, "YOLO", Model)

    _evaluate_module().evaluate(Path("weights.pt"), Path("dataset.yaml"), Path("results"))

    assert (tmp_path / "results" / "predictions" / "val_batch0_pred.jpg").exists()


def test_evaluate_rejects_checkpoint_with_wrong_class_names(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Fails if a non-balloon checkpoint can be accepted as a bubble model."""
    import ultralytics

    class Model:
        names = {0: "panel"}

        def __init__(self, weights: Path) -> None:
            pass

        def val(self, **kwargs: object) -> object:
            return type("Metrics", (), {"results_dict": {}})()

    monkeypatch.setattr(ultralytics, "YOLO", Model)

    with pytest.raises(ValueError, match="balloon"):
        _evaluate_module().evaluate(tmp_path / "weights.pt", tmp_path / "dataset.yaml", tmp_path / "output")
