from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI

app = FastAPI(title="MangaFlow AI Service", version="0.0.0")


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "success": True,
        "message": "OK",
        "data": {
            "service": "mangaflow-ai-service",
            "status": "healthy",
            "timestamp": datetime.now(UTC).isoformat(),
        },
    }
