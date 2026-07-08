# AI Model Files

Model files are excluded from git due to large sizes. Download separately.

---

## YOLO11 Instance Segmentation — Detection + Segmentation (1 model, 1 step)

**Model**: `manga109-segmentation-bubble` (HuggingFace)
**Architecture**: YOLO11 fine-tuned on Manga109 dataset
**Output**: Bounding boxes + Segmentation masks in one inference pass

### Why this model?

```
Old approach (3 models):         New approach (1 model):
─────────────────────────         ─────────────────────────
YOLOv8 → bbox                    YOLO11 instance seg
    ↓                                ↓
SAM2 → mask               →      bbox + polygon mask ✅
    ↓
OpenCV → whiten                  OpenCV → whiten
```

### Loading Options

**Option A — HuggingFace Hub (auto-download, recommended for dev)**

```python
from ultralytics import YOLO
# Downloads ~50 MB on first run, cached in ~/.cache/ultralytics
model = YOLO("hf://manga109-segmentation-bubble")
```

Set in `.env`: `AI_MOCK_MODE=false` (model will auto-download)

**Option B — Manual download (recommended for production/offline)**

```bash
mkdir -p models/yolo11

# Using huggingface_hub CLI
pip install huggingface_hub
    --local-dir models/yolo11

# Or using wget (direct link to best.pt)
    -O models/yolo11/best.pt
```

Set in `.env`: `YOLO_MODEL_PATH=models/yolo11/best.pt`

### Testing the Model (Python)

```python
from ultralytics import YOLO
import cv2

model = YOLO("hf://manga109-segmentation-bubble")
results = model("page.jpg")

for i, result in enumerate(results):
    # Bounding boxes
    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = float(box.conf[0])
        print(f"Bubble {i}: conf={conf:.2f}, bbox=({x1:.0f},{y1:.0f},{x2:.0f},{y2:.0f})")

    # Segmentation masks (polygon points)
    if result.masks:
        for j, mask in enumerate(result.masks.xy):
            print(f"  Bubble {j} polygon: {len(mask)} points")

# Save visualized result
results[0].save("page_annotated.jpg")
```

### Published Metrics (from HuggingFace model card)

| Metric    | Value |
| --------- | ----- |
| Precision | —     |
| Recall    | —     |
| mAP50     | —     |
| Mask mAP  | —     |

> **Note**: Re-evaluate on your own test split from Manga109.
> This answers "what is my AI contribution?" for the thesis committee.

---

## OCR — PaddleOCR

No model file needed. PaddleOCR downloads language models automatically.

**Install**: `pip install paddlepaddle paddleocr`
**Language**: `japan` (set `OCR_LANGUAGE=japan` in `.env`)

```python
from paddleocr import PaddleOCR
ocr = PaddleOCR(lang='japan', use_angle_cls=True)
result = ocr.ocr("bubble_crop.jpg", cls=True)
```

---

## Dev Without Models

Set `AI_MOCK_MODE=true` in `.env` (default).
All services return realistic stub data — no downloads needed.
