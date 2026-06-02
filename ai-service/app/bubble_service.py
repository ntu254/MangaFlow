"""
app/bubble_service.py
---------------------
Core AI pipeline:
  YOLO11 Instance Seg → Mask → OpenCV Refinement → Whitening

Hàm chính: process_bubble_whitening()
"""
import cv2
import numpy as np
from ultralytics import YOLO


# =============================================================================
# Full pipeline: detect + refine + whiten
# =============================================================================

def _predict(image_path: str, model: YOLO, conf: float):
    return model.predict(
        source=image_path,
        conf=conf,
        save=False,
        verbose=False,
    )


def _resize_mask(mask: np.ndarray, width: int, height: int) -> np.ndarray:
    resized = cv2.resize(
        mask,
        (width, height),
        interpolation=cv2.INTER_NEAREST,
    )
    return (resized > 0.5).astype(np.uint8) * 255


def _refine_mask(mask: np.ndarray) -> np.ndarray:
    kernel_small = np.ones((3, 3), np.uint8)
    kernel_medium = np.ones((5, 5), np.uint8)

    refined = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        kernel_medium,
        iterations=2,
    )
    refined = cv2.morphologyEx(
        refined,
        cv2.MORPH_OPEN,
        kernel_small,
        iterations=1,
    )
    refined = cv2.dilate(refined, kernel_small, iterations=1)
    return cv2.erode(refined, kernel_medium, iterations=1)


def _bubble_info_from_result(result) -> list[dict]:
    bubbles = []

    if result.boxes is None:
        return bubbles

    has_mask = result.masks is not None

    for index, box in enumerate(result.boxes):
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        bubbles.append(
            {
                "id": index + 1,
                "bbox": {
                    "x": round(x1, 1),
                    "y": round(y1, 1),
                    "width": round(x2 - x1, 1),
                    "height": round(y2 - y1, 1),
                },
                "confidence": round(float(box.conf[0]), 4),
                "has_mask": has_mask,
            }
        )

    return bubbles


def process_bubble_whitening(
    image_path: str,
    model: YOLO,
    output_path: str,
    conf: float = 0.25,
) -> str:
    """
    Xử lý ảnh manga: detect bubble → refine mask → xoá chữ (whiten).

    Args:
        image_path:  Đường dẫn ảnh gốc (đã lưu vào uploads/)
        model:       YOLO11 instance (từ model_loader.py)
        output_path: Đường dẫn lưu ảnh kết quả (vào outputs/)
        conf:        YOLO confidence threshold (0.0–1.0)

    Returns:
        output_path (để trả về FileResponse)
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Không đọc được ảnh: {image_path}")

    h, w = img.shape[:2]

    results = _predict(image_path, model, conf)
    result = results[0]

    if result.masks is None:
        cv2.imwrite(output_path, img)
        return output_path

    combined_mask = np.zeros((h, w), dtype=np.uint8)
    masks = result.masks.data.cpu().numpy()

    for mask in masks:
        mask_binary = _resize_mask(mask, w, h)
        combined_mask = cv2.bitwise_or(combined_mask, mask_binary)

    inner_mask = _refine_mask(combined_mask)

    whitened = img.copy()
    whitened[inner_mask > 0] = [255, 255, 255]

    cv2.imwrite(output_path, whitened)
    return output_path


# =============================================================================
# Chỉ detect: trả về danh sách bubble info (không whiten)
# =============================================================================


def detect_bubbles_info(
    image_path: str,
    model: YOLO,
    conf: float = 0.25,
) -> list[dict]:
    """
    Detect bubble và trả về thông tin bbox + confidence.
    Không lưu ảnh — dùng cho endpoint /bubble/detect.

    Returns:
        List of dicts:
        [
          {
            "id": 1,
            "bbox": {"x": 50, "y": 30, "width": 280, "height": 140},
            "confidence": 0.97,
            "has_mask": True
          },
          ...
        ]
    """
    results = _predict(image_path, model, conf)
    result = results[0]

    return _bubble_info_from_result(result)


# =============================================================================
# Full process: detect info + whiten ảnh (dùng cho endpoint /bubble/process)
# =============================================================================


def process_and_get_info(
    image_path: str,
    model: YOLO,
    output_path: str,
    conf: float = 0.25,
) -> tuple[str, list[dict]]:
    """
    Chạy toàn bộ pipeline và trả về cả ảnh đã xử lý lẫn thông tin bubble.

    Returns:
        (output_path, list_of_bubble_info)
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Không đọc được ảnh: {image_path}")

    h, w = img.shape[:2]

    results = _predict(image_path, model, conf)
    result = results[0]

    if result.masks is None or result.boxes is None:
        cv2.imwrite(output_path, img)
        return output_path, []

    bubbles = _bubble_info_from_result(result)

    combined_mask = np.zeros((h, w), dtype=np.uint8)
    for mask in result.masks.data.cpu().numpy():
        combined_mask = cv2.bitwise_or(
            combined_mask,
            _resize_mask(mask, w, h),
        )

    inner = _refine_mask(combined_mask)

    whitened = img.copy()
    whitened[inner > 0] = [255, 255, 255]
    cv2.imwrite(output_path, whitened)

    return output_path, bubbles
