# AI Bubble service

Local Python service (default `http://localhost:8000`). The browser calls it
directly in Phase 1 — there is no Lovable backend proxy. Configurable in
**Settings → AI bubble service** or the bar at the top of
`/app/ai/bubble`. Stored in `localStorage["mangaflow.ai.baseUrl"]`.

## Endpoints

| Method | Path              | Body               | Returns                                      |
| ------ | ----------------- | ------------------ | -------------------------------------------- |
| POST   | `/bubble/detect`  | `FormData{ file }` | `{ bubbles: Bubble[] }`                      |
| POST   | `/bubble/whiten`  | `FormData{ file }` | PNG image blob                               |
| POST   | `/bubble/process` | `FormData{ file }` | `{ bubbles, image_base64, image_mime_type }` |

```ts
type Bubble = {
  id: number;
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
  has_mask?: boolean;
};
```

Client wrapper: `src/lib/ai-bubble.ts` (`detect`, `whiten`, `process`,
`ping`, `getAiBaseUrl`, `setAiBaseUrl`).

## CORS

Calls go directly from the browser. The Python service MUST allow the
preview origin (e.g. `https://<id>.lovableproject.com`) and `localhost:5173`.
A FastAPI snippet:

```py
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)
```

If `Test` in the studio fails, almost always the cause is CORS or the
service not running.

## Phase-2 plan

Move the call into a server function (`createServerFn`) so the browser never
sees the service URL and we can authenticate. Add a job table to record
runs and surface segmented coordinates on chapter pages.
