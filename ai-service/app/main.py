"""
app/main.py
-----------
FastAPI entry point cho Manga Bubble AI Service.

Endpoints:
  GET  /                  → health check
  POST /bubble/detect     → trả về danh sách bubble (bbox + confidence)
  POST /bubble/whiten     → trả về ảnh PNG đã xoá chữ
    POST /bubble/process    → trả về ảnh base64 + metadata bubble

Chạy:
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
import base64
import os
import shutil
import uuid

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask

from app.bubble_service import (
    detect_bubbles_info,
    process_and_get_info,
    process_bubble_whitening,
)
from app.model_loader import model

# =============================================================================
# App setup
# =============================================================================

app = FastAPI(
    title="Manga Bubble AI Service",
    description=(
        "AI service cho Manga Localization System.\n\n"
        "Pipeline: YOLO11 Instance Segmentation → OpenCV Refinement → "
        "Bubble Whitening\n\n"
        "Model: [manga109-segmentation-bubble]"
    ),
    version="1.0.0",
)

backend_origin = os.getenv("BACKEND_ORIGIN", "http://localhost:3001")
allow_origins = [backend_origin]
if os.getenv("ENV", "development") != "production":
    allow_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


# =============================================================================
# Helpers
# =============================================================================


def _cleanup_paths(*paths: str | None) -> None:
    for path in paths:
        if path and os.path.exists(path):
            os.remove(path)


def _save_upload(file: UploadFile) -> tuple[str, str]:
    """Lưu file upload, trả về (file_id, input_path)."""
    ext = os.path.splitext(file.filename or "image.jpg")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Định dạng không hỗ trợ: {ext}. Dùng: jpg, jpeg, png, webp"
        )
    file_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_id, input_path


# =============================================================================
# Routes
# =============================================================================

@app.get("/", tags=["Health"])
def root():
    """Service health check."""
    return {
        "message": "Manga Bubble AI Service is running",
        "model": "YOLO11 manga109-segmentation-bubble",
        "endpoints": ["/bubble/detect", "/bubble/whiten", "/bubble/process"],
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "model_loaded": model is not None}


# POST /bubble/detect

@app.post(
    "/bubble/detect",
    tags=["Bubble"],
    summary="Detect speech bubbles",
    description=(
        "Trả về danh sách bounding box + confidence cho từng bubble. "
        "Không lưu ảnh."
    ),
)
async def detect_bubble(
    file: UploadFile = File(..., description="Ảnh manga (jpg/png/webp)"),
    conf: float = 0.25,
):
    """
    Detect speech bubbles — trả về JSON danh sách bubble.

    ```json
    {
      "bubble_count": 6,
      "bubbles": [
                {
                    "id": 1,
                    "bbox": {"x": 50, "y": 30, "width": 280, "height": 140},
                    "confidence": 0.97
                },
        ...
      ]
    }
    ```
    """
    try:
        file_id, input_path = _save_upload(file)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    try:
        bubbles = detect_bubbles_info(
            image_path=input_path,
            model=model,
            conf=conf,
        )
        return {"bubble_count": len(bubbles), "bubbles": bubbles}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        _cleanup_paths(input_path)


# POST /bubble/whiten

@app.post(
    "/bubble/whiten",
    tags=["Bubble"],
    summary="Whiten speech bubbles (remove text)",
    description=(
        "Chạy YOLO11 → OpenCV refinement → xoá chữ trong bubble.\n"
        "Trả về file ảnh PNG đã xử lý."
    ),
)
async def whiten_bubble(
    file: UploadFile = File(..., description="Ảnh manga (jpg/png/webp)"),
    conf: float = 0.25,
):
    """
    Xoá chữ trong bubble — trả về file ảnh PNG.

    Response: `image/png` (binary)
    """
    try:
        file_id, input_path = _save_upload(file)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    output_path = os.path.join(OUTPUT_DIR, f"{file_id}_whitened.png")
    cleanup = BackgroundTask(_cleanup_paths, input_path, output_path)

    try:
        process_bubble_whitening(
            image_path=input_path,
            model=model,
            output_path=output_path,
            conf=conf,
        )
        return FileResponse(
            output_path,
            media_type="image/png",
            filename="manga_bubble_whitened.png",
            background=cleanup,
        )
    except Exception as e:
        _cleanup_paths(input_path, output_path)
        return JSONResponse(status_code=500, content={"error": str(e)})


# POST /bubble/process

@app.post(
    "/bubble/process",
    tags=["Bubble"],
    summary="Full process: detect + whiten + info",
    description=(
        "Chạy toàn bộ pipeline và trả về ảnh PNG dạng base64 + metadata.\n"
        "Metadata không còn nằm trong headers."
    ),
)
async def process_bubble(
    file: UploadFile = File(..., description="Ảnh manga (jpg/png/webp)"),
    conf: float = 0.25,
):
    """
    Full pipeline — trả về ảnh PNG base64 + bubble metadata trong JSON.
    """
    try:
        file_id, input_path = _save_upload(file)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    output_path = os.path.join(OUTPUT_DIR, f"{file_id}_processed.png")
    cleanup = BackgroundTask(_cleanup_paths, input_path, output_path)

    try:
        out_path, bubbles = process_and_get_info(
            image_path=input_path,
            model=model,
            output_path=output_path,
            conf=conf,
        )

        with open(out_path, "rb") as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode("ascii")

        return JSONResponse(
            content={
                "image_mime_type": "image/png",
                "image_base64": image_base64,
                "bubble_count": len(bubbles),
                "bubbles": bubbles,
            },
            background=cleanup,
        )
    except Exception as e:
        _cleanup_paths(input_path, output_path)
        return JSONResponse(status_code=500, content={"error": str(e)})
