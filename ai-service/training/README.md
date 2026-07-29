# Manga bubble training in Colab

Use [colab_train.ipynb](colab_train.ipynb) to train without copying Manga109s images or credentials into this repository.

## Prerequisites

1. In Google Drive, create a shortcut named `Manga109s` under `My Drive` so its images are available at `/content/drive/MyDrive/Manga109s/images` after mounting. The notebook stops with a clear error if this path is missing.
2. Obtain approval for the gated MangaSegmentation dataset on Hugging Face, then create a read token with that approval.
3. In Colab, add the token as the `HF_TOKEN` Secret and allow the notebook access to it. Never paste a token into a cell or commit one.
4. Select a GPU runtime before running the notebook. A T4 or better is recommended; training uses Colab's local disk for the prepared dataset and run files, so confirm the runtime has enough free disk before the full run.

## Run order

Open `colab_train.ipynb` in Colab and run the cells in their checked-in order:

1. Clone the published `main` revision and install `training/requirements.txt`. Before this task merges to `main`, the notebook cannot fetch the training package from the public repository; wait for the merge.
2. Mount Drive.
3. Read the `HF_TOKEN` secret.
4. Check the mounted Manga109s image path and define run paths.
5. Download annotations.
6. Prepare the local YOLO dataset.
7. Run the one-epoch smoke command (`--epochs 1 --run-name smoke`).
8. Run the full training command, evaluate `best.pt`, and copy its outputs to Drive.

The full run is written to `/content/drive/MyDrive/Manga109s/training-runs/<run-id>/`. Its checkpoint is `/content/drive/MyDrive/Manga109s/training-runs/<run-id>/weights/best.pt`; evaluation metrics and prediction overlays are in its `evaluation/` directory. The smoke run is local only.

The Drive export contains only `weights/best.pt`, `results.csv`, `dataset.yaml`, `manifest.json`, `evaluation/test-metrics.json`, and the capped evaluation prediction overlays. It does not copy source images or prepared labels.

## Promote an accepted checkpoint

After reviewing a chosen `<run-id>`, run this command. From `/content/storyboard-nexus` in Colab (with Drive still mounted), it puts that checkpoint at the service handoff path:

```bash
cp /content/drive/MyDrive/Manga109s/training-runs/<run-id>/weights/best.pt ai-service/models/best.pt
```

## Data handling

Manga109s images, gated annotations, tokens, and any redistributed dataset copies must not enter source control. Do not redistribute Manga109s images or gated annotations; keep access and use within the dataset terms. The notebook copies only the whitelisted run artifacts and dataset metadata to Drive.

For local checks, run:

```bash
cd ai-service
python -m pytest training/tests -v
python -c "import json; json.load(open('training/colab_train.ipynb', encoding='utf-8'))"
git diff --check
```
