# Manga bubble training pipeline design

## Goal

Provide a reproducible Google Colab pipeline that trains a YOLO11 instance-segmentation model with one `balloon` class and exports `best.pt` for `ai-service`.

The target is functional and metric equivalence with the checked-in checkpoint, not byte-identical weights. The original checkpoint records its training arguments but not its exact converted dataset, split manifest, or source revision.

## Inputs and licensing

- Images: user-owned Manga109-s release, mounted from Google Drive at `/content/drive/MyDrive/Manga109s/images`.
- Segmentation annotations: gated `MS92/MangaSegmentation` on Hugging Face. The notebook reads `HF_TOKEN` from Colab Secrets; it never saves the token to Drive, source control, or output logs.
- The pipeline retains only derived YOLO labels and manifests in Colab scratch storage. It does not redistribute Manga109-s images.
- Only images whose relative paths appear in both sources are admitted. Missing files are recorded and skipped.

## Dataset preparation

1. Download the MS92 annotation package to `/content/manga-training/source`.
2. Read the supplied COCO train/validation/test files and retain category ID `3` (`bubble`).
3. Decode each COCO RLE mask, polygonize it, normalise points by image width/height, and write YOLO segmentation rows as `0 x1 y1 x2 y2 ...`.
4. Preserve MS92's book-disjoint train/validation/test assignments; never random-split individual pages.
5. Link or copy eligible images and labels into `/content/manga-training/yolo/{images,labels}/{train,val,test}`. Write `dataset.yaml`, `manifest.json`, and checksum/count reports.
6. Fail before training when any split has zero images, a referenced image is unreadable, a mask is empty, or a label contains coordinates outside `[0, 1]`.

## Training and evaluation

The run mirrors the checkpoint metadata:

- Base model: `yolo11n-seg.pt`; task: `segment`; class: `balloon`.
- Ultralytics: `8.3.227`; `imgsz=1600`, `batch=8`, `epochs=100`, `patience=10`, `seed=0`, deterministic mode, AMP enabled, workers 8.
- Optimizer `auto`, pretrained weights, `lr0=0.01`, `weight_decay=0.0005`, `mosaic=1.0`, `fliplr=0.5`, `scale=0.5`, `translate=0.1`, HSV augmentation, and `erasing=0.4`.
- Evaluate `best.pt` on the untouched test split and persist Ultralytics metrics plus prediction overlays.

The acceptance report compares mask mAP50-95 with the current checkpoint reference of `0.94776`; it reports the observed metric rather than treating that number as a guaranteed threshold.

## Outputs and service handoff

The notebook copies only these artifacts to `Google Drive/Manga109s/training-runs/<run-id>/`:

- `weights/best.pt`, `results.csv`, test metrics, `dataset.yaml`, manifest, and selected prediction overlays.

It verifies locally that `YOLO(best.pt).names == {0: "balloon"}`. The user can then copy the approved artifact to `ai-service/models/best.pt`; no service API changes are required.

## Repository deliverables

- `ai-service/training/download_annotations.py`
- `ai-service/training/prepare_dataset.py`
- `ai-service/training/train.py`
- `ai-service/training/evaluate.py`
- `ai-service/training/requirements.txt`
- `ai-service/training/colab_train.ipynb`
- `ai-service/training/README.md`

Scripts use the standard library, `pycocotools`, OpenCV, and the existing Ultralytics dependency; no custom training framework or database is added.

## Validation

- Unit-test RLE-to-polygon conversion, split preservation, and invalid-label failure with tiny synthetic COCO fixtures.
- Run a preparation dry run against a bounded page count in Colab before the full dataset.
- Run an optional one-epoch smoke train before the full run.
- Verify the exported checkpoint loads through the same `ultralytics.YOLO` API used by `ai-service/app/model_loader.py`.
