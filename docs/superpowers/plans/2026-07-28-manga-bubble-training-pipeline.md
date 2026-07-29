# Manga Bubble Training Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Google Colab-runnable, reproducible pipeline that converts gated MS92 bubble masks plus locally mounted Manga109-s images into a YOLO11 segmentation dataset, trains it, evaluates it, and exports service-compatible `best.pt`.

**Architecture:** The training package is independent of FastAPI. `download_annotations.py` fetches only gated annotations using a caller-provided token; `prepare_dataset.py` is the deterministic boundary that intersects image paths, converts category-3 COCO RLE masks to YOLO polygons, and validates artifacts. Training and evaluation are thin wrappers around Ultralytics and persist a small manifest/report beside the checkpoint.

**Tech Stack:** Python 3.11, Ultralytics 8.3.227, pycocotools, OpenCV, Google Colab, Google Drive, Hugging Face Hub.

## Global Constraints

- Never commit, upload, or redistribute Manga109-s images or `HF_TOKEN`.
- Read `HF_TOKEN` only from an environment variable or Colab Secret; never print it.
- Use only category ID `3` (`bubble`) from MS92.
- Retain the upstream book-disjoint train/validation/test split; do not random-split pages.
- Skip only missing local images and list them in `manifest.json`; fail for empty splits, unreadable images, empty masks, or normalized coordinates outside `[0, 1]`.
- Use the recorded checkpoint configuration: `yolo11n-seg.pt`, `imgsz=1600`, `batch=8`, `epochs=100`, `patience=10`, `seed=0`, Ultralytics `8.3.227`.
- Exported checkpoint must load with `YOLO(path)` and expose `{0: "balloon"}`.

---

### Task 1: Create training package and gated annotation downloader

**Files:**
- Create: `ai-service/training/__init__.py`
- Create: `ai-service/training/download_annotations.py`
- Create: `ai-service/training/requirements.txt`
- Test: `ai-service/training/tests/test_download_annotations.py`

**Interfaces:** Produces `download_annotations(repo_id: str, destination: Path, token: str) -> Path`, returning the directory containing the MS92 files. It must never receive or write image data.

- [ ] **Step 1: Write the failing download-command test**

```python
from pathlib import Path
from training.download_annotations import build_snapshot_kwargs

def test_build_snapshot_kwargs_scopes_to_annotations(tmp_path: Path):
    kwargs = build_snapshot_kwargs("MS92/MangaSegmentation", tmp_path, "secret")
    assert kwargs["repo_id"] == "MS92/MangaSegmentation"
    assert kwargs["allow_patterns"] == ["annotations/**", "license.txt"]
    assert kwargs["token"] == "secret"
```

- [ ] **Step 2: Run the test to verify failure**

Run: `cd ai-service && python -m pytest training/tests/test_download_annotations.py -v`

Expected: FAIL because `training.download_annotations` does not exist.

- [ ] **Step 3: Implement the minimal downloader**

```python
def build_snapshot_kwargs(repo_id: str, destination: Path, token: str) -> dict:
    return {
        "repo_id": repo_id,
        "repo_type": "dataset",
        "local_dir": destination,
        "allow_patterns": ["annotations/**", "license.txt"],
        "token": token,
    }

def download_annotations(repo_id: str, destination: Path, token: str) -> Path:
    if not token:
        raise ValueError("HF_TOKEN is required")
    snapshot_download(**build_snapshot_kwargs(repo_id, destination, token))
    return destination
```

Add an `argparse` entry point requiring `--destination`; use `HF_TOKEN` from `os.environ` unless `--token-env` selects another environment-variable name. Pin `ultralytics==8.3.227`, add `pycocotools`, `huggingface-hub`, `opencv-python-headless`, and `pytest`.

- [ ] **Step 4: Run the focused test**

Run: `cd ai-service && python -m pytest training/tests/test_download_annotations.py -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ai-service/training/__init__.py ai-service/training/download_annotations.py ai-service/training/requirements.txt ai-service/training/tests/test_download_annotations.py
git commit -m "feat: add gated manga annotation downloader"
```

### Task 2: Convert and validate MS92 bubbles as YOLO segmentation

**Files:**
- Create: `ai-service/training/prepare_dataset.py`
- Create: `ai-service/training/tests/test_prepare_dataset.py`

**Interfaces:** Produces `prepare_dataset(annotation_root: Path, image_root: Path, output_root: Path) -> Path`. It writes `dataset.yaml`, `manifest.json`, and the YOLO `images/` and `labels/` split trees; it returns `output_root`.

- [ ] **Step 1: Write failing synthetic-COCO tests**

```python
def test_prepare_dataset_keeps_only_bubbles_and_preserves_split(tmp_path):
    annotation_root, image_root = synthetic_coco_with_one_bubble(tmp_path)
    output = prepare_dataset(annotation_root, image_root, tmp_path / "yolo")
    assert (output / "labels/train/book/000.txt").read_text().startswith("0 ")
    assert not (output / "labels/train/book/001.txt").exists()

def test_prepare_dataset_rejects_empty_train_split(tmp_path):
    with pytest.raises(ValueError, match="train split has no usable images"):
        prepare_dataset(tmp_path / "annotations", tmp_path / "images", tmp_path / "yolo")
```

The fixture must include COCO category ID 3 with a compressed RLE mask, a non-bubble category, and a missing image case.

- [ ] **Step 2: Run the converter tests to verify failure**

Run: `cd ai-service && python -m pytest training/tests/test_prepare_dataset.py -v`

Expected: FAIL because `prepare_dataset` does not exist.

- [ ] **Step 3: Implement deterministic preparation**

```python
def mask_to_polygon(mask: np.ndarray) -> list[float]:
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour = max(contours, key=cv2.contourArea)
    return contour.reshape(-1, 2).astype(float).ravel().tolist()

def yolo_row(points: list[float], width: int, height: int) -> str:
    normalized = [points[i] / (width if i % 2 == 0 else height) for i in range(len(points))]
    if len(normalized) < 6 or any(point < 0 or point > 1 for point in normalized):
        raise ValueError("invalid normalized bubble polygon")
    return "0 " + " ".join(f"{point:.6f}" for point in normalized)
```

Load `train.coco.json`, `validation.coco.json`, and `test.coco.json`; locate each image beneath `image_root` using the COCO `file_name`; preserve nested paths to avoid book/page collisions. Decode each RLE with `pycocotools.mask.decode`, emit one row per usable bubble, copy images with `shutil.copy2`, and record counts/missing files/checksums in `manifest.json`. Write YAML paths relative to the output root and `names: [balloon]`.

- [ ] **Step 4: Run preparation validation**

Run: `cd ai-service && python -m pytest training/tests/test_prepare_dataset.py -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ai-service/training/prepare_dataset.py ai-service/training/tests/test_prepare_dataset.py
git commit -m "feat: prepare manga bubble segmentation dataset"
```

### Task 3: Train, evaluate, and verify the exported checkpoint

**Files:**
- Create: `ai-service/training/train.py`
- Create: `ai-service/training/evaluate.py`
- Create: `ai-service/training/tests/test_train_config.py`

**Interfaces:** Produces `train(dataset_yaml: Path, run_dir: Path, device: str | None) -> Path`, returning `run_dir / "weights" / "best.pt"`; and `evaluate(weights: Path, dataset_yaml: Path, output_dir: Path) -> dict[str, float]`.

- [ ] **Step 1: Write failing configuration and checkpoint tests**

```python
from training.train import training_kwargs

def test_training_kwargs_match_checkpoint_metadata(tmp_path):
    kwargs = training_kwargs(tmp_path / "dataset.yaml", tmp_path / "run", None)
    assert kwargs["model"] == "yolo11n-seg.pt"
    assert kwargs["imgsz"] == 1600
    assert kwargs["batch"] == 8
    assert kwargs["epochs"] == 100
    assert kwargs["patience"] == 10
    assert kwargs["seed"] == 0
```

Mock `ultralytics.YOLO` in evaluation tests and assert that a checkpoint with names other than `{0: "balloon"}` raises `ValueError`.

- [ ] **Step 2: Run the test to verify failure**

Run: `cd ai-service && python -m pytest training/tests/test_train_config.py -v`

Expected: FAIL because training modules do not exist.

- [ ] **Step 3: Implement thin Ultralytics wrappers**

```python
def training_kwargs(dataset_yaml: Path, run_dir: Path, device: str | None) -> dict:
    return {
        "data": str(dataset_yaml), "epochs": 100, "patience": 10, "batch": 8,
        "imgsz": 1600, "seed": 0, "deterministic": True, "amp": True,
        "optimizer": "auto", "lr0": 0.01, "weight_decay": 0.0005,
        "mosaic": 1.0, "fliplr": 0.5, "scale": 0.5, "translate": 0.1,
        "hsv_h": 0.015, "hsv_s": 0.7, "hsv_v": 0.4, "erasing": 0.4,
        "project": str(run_dir.parent), "name": run_dir.name, "exist_ok": True,
        "device": device,
    }

def train(dataset_yaml: Path, run_dir: Path, device: str | None) -> Path:
    YOLO("yolo11n-seg.pt").train(**training_kwargs(dataset_yaml, run_dir, device))
    return run_dir / "weights" / "best.pt"
```

Evaluate with `YOLO(weights).val(data=str(dataset_yaml), split="test")`, save scalar metrics to `test-metrics.json`, then load the checkpoint and reject it unless `model.names == {0: "balloon"}`. Copy a bounded set of prediction overlays to `output_dir / "predictions"`.

- [ ] **Step 4: Run tests and a smoke command**

Run: `cd ai-service && python -m pytest training/tests/test_train_config.py -v`

Expected: PASS.

Run: `cd ai-service && python -m training.train --help && python -m training.evaluate --help`

Expected: both commands print usage without loading a model.

- [ ] **Step 5: Commit**

```bash
git add ai-service/training/train.py ai-service/training/evaluate.py ai-service/training/tests/test_train_config.py
git commit -m "feat: train and evaluate bubble segmentation model"
```

### Task 4: Provide Colab workflow and repository handoff guide

**Files:**
- Create: `ai-service/training/colab_train.ipynb`
- Create: `ai-service/training/README.md`
- Modify: `ai-service/README.md`

**Interfaces:** Notebook accepts a mounted Drive folder and a Colab `HF_TOKEN` secret, produces `/content/drive/MyDrive/Manga109s/training-runs/<run-id>/weights/best.pt`, and names the command that copies the accepted artifact to `ai-service/models/best.pt`.

- [ ] **Step 1: Add notebook contract checks**

```python
def test_colab_notebook_does_not_embed_token():
    notebook = json.loads(Path("training/colab_train.ipynb").read_text())
    rendered = json.dumps(notebook)
    assert "HF_TOKEN" in rendered
    assert "hf_" not in rendered
```

- [ ] **Step 2: Run the check to verify failure**

Run: `cd ai-service && python -m pytest training/tests/test_colab_notebook.py -v`

Expected: FAIL because the notebook does not exist.

- [ ] **Step 3: Create the runnable Colab sequence and guide**

Notebook cells must: install `-r training/requirements.txt`; mount Drive; retrieve `HF_TOKEN` with `google.colab.userdata.get("HF_TOKEN")`; clone or upload the repository code without adding a token; download annotations; run `prepare_dataset.py`; run one epoch with `--epochs 1 --run-name smoke`; run full train; evaluate `best.pt`; copy run outputs to Drive. Use the mounted input path `/content/drive/MyDrive/Manga109s/images` and fail with a clear message when it is absent.

The README must include exact Colab cell order, Drive shortcut prerequisite, Hugging Face gated-access prerequisite, expected disk/GPU use, artifact locations, and the non-redistribution restriction. Update `ai-service/README.md` with one short link to `training/README.md`.

- [ ] **Step 4: Run all training-package tests and static notebook checks**

Run: `cd ai-service && python -m pytest training/tests -v`

Expected: PASS.

Run: `cd ai-service && python -c "import json; json.load(open('training/colab_train.ipynb', encoding='utf-8'))"`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add ai-service/training/colab_train.ipynb ai-service/training/README.md ai-service/training/tests/test_colab_notebook.py ai-service/README.md
git commit -m "docs: add colab manga bubble training workflow"
```

## Plan self-review

- Spec coverage: Tasks 1–2 implement gated annotation intake, split preservation, conversion, and fail-fast validation; Task 3 implements the recorded checkpoint configuration, evaluation, and artifact compatibility; Task 4 implements the Colab/Drive workflow, token safety, and handoff guide.
- Placeholder scan: no deferred implementation steps or unspecified interfaces remain.
- Type consistency: Task 2 produces `dataset.yaml` consumed by Task 3; Task 3 produces `best.pt` consumed by Task 4 and by the existing service.
