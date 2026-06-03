# MF-027 AI Bubble Integration Design

## Architecture

```mermaid
graph TD
    AW[AssistantWorkspace Canvas] -- "POST /api/ai/detect" --> Node_AI[Node.js AI Controller]
    Node_AI -- "POST /bubble/detect" --> FastAPI[FastAPI AI Service:8000]
    AW -- "POST /api/ai/whiten" --> Node_AI
    Node_AI -- "POST /bubble/whiten" --> FastAPI
```

## Details
- Backend mounts `aiRoutes` under `/api/ai`.
- Axios / fetch calls are forwarded to port 8000 using standard FormData structure.
- YOLO11 is used to detect bounding boxes of speech bubbles on manga pages.
