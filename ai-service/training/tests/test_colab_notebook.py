import json
from pathlib import Path


NOTEBOOK = Path(__file__).parents[1] / "colab_train.ipynb"


def _source() -> str:
    notebook = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
    return "\n".join(
        "".join(cell["source"])
        for cell in notebook["cells"]
        if cell["cell_type"] == "code"
    )


def test_colab_notebook_keeps_the_training_workflow_and_artifacts_in_drive() -> None:
    """Fails if the checked-in Colab path cannot run the gated training workflow."""
    source = _source()
    required_steps = [
        'TRAINING_REVISION = "main"',
        "git clone --depth 1 --branch {TRAINING_REVISION}",
        "pip install -q -r training/requirements.txt",
        'drive.mount("/content/drive")',
        'userdata.get("HF_TOKEN")',
        "training.download_annotations",
        "training.prepare_dataset",
        "training.train",
        "--epochs\", \"1\", \"--run-name\", \"smoke",
        "training.evaluate",
        "shutil.copytree",
    ]

    positions = [source.index(step) for step in required_steps]
    assert positions == sorted(positions)
    assert "/content/drive/MyDrive/Manga109s/images" in source
    assert "/content/drive/MyDrive/Manga109s/training-runs" in source
    assert "HF_TOKEN" in source
    assert "hf_" not in source
    assert 'shutil.copy2(BEST, DRIVE_RUN / "weights" / "best.pt")' in source
    assert 'RESULTS = RUN_DIR / "results.csv"' in source
    assert "if not RESULTS.is_file()" in source
    assert 'shutil.copy2(RESULTS, DRIVE_RUN / "results.csv")' in source
    assert 'shutil.copy2(DATASET / "dataset.yaml", DRIVE_RUN / "dataset.yaml")' in source
    assert 'shutil.copy2(DATASET / "manifest.json", DRIVE_RUN / "manifest.json")' in source
    assert "shutil.copytree(PREDICTIONS, DRIVE_RUN / \"evaluation\" / \"predictions\", dirs_exist_ok=True)" in source
    assert "shutil.copytree(RUN_DIR, DRIVE_RUN" not in source


def test_training_guide_gives_the_colab_model_promotion_command() -> None:
    """Fails if an accepted Drive checkpoint cannot be promoted to the service."""
    guide = (Path(__file__).parents[1] / "README.md").read_text(encoding="utf-8")

    assert "From `/content/storyboard-nexus` in Colab" in guide
    assert "cp /content/drive/MyDrive/Manga109s/training-runs/<run-id>/weights/best.pt ai-service/models/best.pt" in guide
    assert "`results.csv`" in guide
