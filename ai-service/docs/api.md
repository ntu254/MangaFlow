# API Documentation

Tài liệu này mô tả contract hiện tại của service. Cấu trúc response đã đổi để dễ dùng từ frontend và tránh giới hạn của headers.

## Base URL

```text
http://localhost:8000
```

## Authentication

Chưa có authentication. Service đang giả định chạy trong mạng nội bộ hoặc sau API gateway.

## Endpoints

### `GET /`

Health/info endpoint.

Response:

```json
{
  "message": "Manga Bubble AI Service is running",
  "model": "YOLO11 manga109-segmentation-bubble",
  "endpoints": ["/bubble/detect", "/bubble/whiten", "/bubble/process"],
  "docs": "/docs"
}
```

### `GET /health`

Health check cho monitoring.

Response:

```json
{
  "status": "ok",
  "model_loaded": true
}
```

### `POST /bubble/detect`

Detect bubble và trả về metadata bounding box.

Request:

```bash
curl -X POST http://localhost:8000/bubble/detect \
  -F "file=@page.jpg"
```

Form fields:

| Field  | Type  | Required | Description                                |
| ------ | ----- | -------- | ------------------------------------------ |
| `file` | file  | yes      | Ảnh manga `.jpg`, `.jpeg`, `.png`, `.webp` |
| `conf` | float | no       | Confidence threshold, mặc định `0.25`      |

Response:

```json
{
  "bubble_count": 2,
  "bubbles": [
    {
      "id": 1,
      "bbox": { "x": 50.0, "y": 30.0, "width": 280.0, "height": 140.0 },
      "confidence": 0.9712,
      "has_mask": true
    }
  ]
}
```

### `POST /bubble/whiten`

Xóa chữ trong bubble và trả về file ảnh PNG trực tiếp.

Request:

```bash
curl -X POST http://localhost:8000/bubble/whiten \
  -F "file=@page.jpg" \
  --output page_whitened.png
```

Response:

| Field        | Value            |
| ------------ | ---------------- |
| Content-Type | `image/png`      |
| Body         | binary PNG image |

### `POST /bubble/process`

Chạy full pipeline và trả về JSON.

Request:

```bash
curl -X POST http://localhost:8000/bubble/process \
  -F "file=@page.jpg" \
  -o response.json
```

Response:

```json
{
  "image_mime_type": "image/png",
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "bubble_count": 2,
  "bubbles": [
    {
      "id": 1,
      "bbox": { "x": 50.0, "y": 30.0, "width": 280.0, "height": 140.0 },
      "confidence": 0.9712,
      "has_mask": true
    }
  ]
}
```

Fields:

| Field             | Type    | Description                                   |
| ----------------- | ------- | --------------------------------------------- |
| `image_mime_type` | string  | MIME type của ảnh trả về, hiện là `image/png` |
| `image_base64`    | string  | Ảnh output đã encode base64                   |
| `bubble_count`    | integer | Số bubble detect được                         |
| `bubbles`         | array   | Danh sách metadata bubble                     |

## Error format

Khi lỗi, service trả JSON:

```json
{
  "error": "..."
}
```

Các lỗi thường gặp:

| Status | Ý nghĩa                                     |
| ------ | ------------------------------------------- |
| `400`  | File upload không hợp lệ hoặc sai định dạng |
| `500`  | Model lỗi, ảnh lỗi, hoặc pipeline fail      |

## Frontend usage

```javascript
const formData = new FormData();
formData.append("file", imageFile);

const response = await fetch("http://localhost:8000/bubble/process", {
  method: "POST",
  body: formData,
});

const data = await response.json();
const imageUrl = `data:${data.image_mime_type};base64,${data.image_base64}`;
```

```javascript
const detectResponse = await fetch("http://localhost:8000/bubble/detect", {
  method: "POST",
  body: formData,
});

const detectData = await detectResponse.json();
console.log(detectData.bubbles);
```

## Notes

- `POST /bubble/process` không còn trả metadata trong headers.
- File tạm và output được cleanup tự động sau request.
- Model được load từ `models/best.pt` nếu có, nếu không sẽ fallback sang Hugging Face Hub.
