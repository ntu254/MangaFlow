# Manga Bubble AI Service

Python FastAPI service xử lý ảnh manga: detect bubble → refine mask → xoá chữ.

## Cấu trúc

```
ai-service/
│
├── app/
│   ├── main.py           ← FastAPI app + 3 endpoints
│   ├── bubble_service.py ← YOLO11 + OpenCV pipeline
│   └── model_loader.py   ← Load model 1 lần
│
├── models/
│   └── best.pt           ← YOLO11 checkpoint
│
├── uploads/              ← Ảnh input (tạm thời)
├── outputs/              ← Ảnh output đã xử lý
├── requirements.txt
└── Dockerfile
```

## Cài đặt

```bash
pip install -r requirements.txt
```

## Lấy model

```bash
# Dùng huggingface_hub CLI
pip install huggingface_hub
```

## Chạy

```bash
# Đứng trong thư mục ai-service
uvicorn app.main:app --reload --host localhost --port 8000
```

Mở Swagger UI: **http://localhost:8000/docs**

## API Endpoints

### `GET /health`

Health check.

---

### `POST /bubble/detect`

Detect bubble — trả về JSON danh sách bounding box.

```bash
curl -X POST http://localhost:8000/bubble/detect \
  -F "file=@page.jpg"
```

Response:

```json
{
  "bubble_count": 6,
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

---

### `POST /bubble/whiten`

Xoá chữ trong bubble — trả về file ảnh PNG.

```bash
curl -X POST http://localhost:8000/bubble/whiten \
  -F "file=@page.jpg" \
  --output page_whitened.png
```

---

### `POST /bubble/process`

Full pipeline — trả về JSON gồm ảnh base64 + bubble metadata.

```bash
curl -X POST http://localhost:8000/bubble/process \
  -F "file=@page.jpg" \
  -o response.json
```

Response JSON:

```json
{
  "image_mime_type": "image/png",
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "bubble_count": 6,
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

Image decode example:

```javascript
const response = await fetch("http://localhost:8000/bubble/process", {
  method: "POST",
  body: formData,
});

const data = await response.json();
const imageUrl = `data:${data.image_mime_type};base64,${data.image_base64}`;
setResultImage(imageUrl);
```

---

## Gọi từ React

```javascript
// POST /bubble/whiten
const formData = new FormData();
formData.append("file", imageFile);

const response = await fetch("http://localhost:8000/bubble/whiten", {
  method: "POST",
  body: formData,
});

const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);
setResultImage(imageUrl);
```

```javascript
// POST /bubble/process — lấy cả ảnh lẫn bubble info
const response = await fetch("http://localhost:8000/bubble/process", {
  method: "POST",
  body: formData,
});

const data = await response.json();
const bubbles = data.bubbles;
const imageUrl = `data:${data.image_mime_type};base64,${data.image_base64}`;
```

## Gọi từ Node.js (Express backend)

```javascript
// Node.js forward ảnh từ React sang AI service
const FormData = require("form-data");
const axios = require("axios");
const fs = require("fs");

app.post("/api/process-page", upload.single("file"), async (req, res) => {
  const form = new FormData();
  form.append("file", fs.createReadStream(req.file.path));

  const aiResponse = await axios.post(
    "http://ai-service:8000/bubble/whiten",
    form,
    {
      headers: form.getHeaders(),
      responseType: "arraybuffer",
    },
  );

  res.set("Content-Type", "image/png");
  res.send(aiResponse.data);
});
```

Tài liệu API chi tiết: [docs/api.md](docs/api.md)

## Docker

```bash
# Build
docker build -t manga-ai-service .

# Chạy
docker run -p 8000:8000 manga-ai-service

# Mount model local (không cần download lại)
docker run -p 8000:8000 -v $(pwd)/models:/app/models manga-ai-service
```

## Pipeline chi tiết

```
Ảnh manga input
      │
      ▼ YOLO11 Instance Segmentation
      │  model: manga109-segmentation-bubble
      │  → N bubble masks (polygon + binary)
      │
      ▼ OpenCV Refinement
      │  MORPH_CLOSE  → đóng lỗ hổng trong mask
      │  MORPH_OPEN   → xoá noise ngoài mask
      │  dilate       → mở rộng cover edge
      │  erode        → giữ nguyên viền bubble
      │
      ▼ Bubble Whitening
      │  img[inner_mask > 0] = [255, 255, 255]
      │
      ▼ Ảnh output (bubble trắng, giữ nguyên viền)
```
