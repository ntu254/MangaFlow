"""
app/model_loader.py
-------------------
Load YOLO11 model một lần duy nhất khi service khởi động.

Priority:
  1. Local file: models/best.pt (nếu đã download)
  2. HuggingFace Hub: manga109-segmentation-bubble
"""
from pathlib import Path

from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent.parent
LOCAL_MODEL_PATH = BASE_DIR / "models" / "best.pt"
HF_MODEL_ID = "manga109-segmentation-bubble"


def _load_model() -> YOLO:
    if LOCAL_MODEL_PATH.exists():
        print(f"[ModelLoader] Loading from local: {LOCAL_MODEL_PATH}")
        return YOLO(str(LOCAL_MODEL_PATH))

    print(
        "[ModelLoader] Local model not found. Loading from HuggingFace: "
        f"hf://{HF_MODEL_ID}"
    )
    print("[ModelLoader] First run will download ~50 MB — cached afterwards.")
    return YOLO(f"hf://{HF_MODEL_ID}")


# Singleton — được import bởi main.py và bubble_service.py
model = _load_model()
