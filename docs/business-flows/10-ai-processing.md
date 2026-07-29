# AI Processing

## Description
AI features include bubble detection (speech bubble detection in manga pages)
and bubble whitening (removing text from detected bubbles). The AI service is
an external Python service that the backend proxies to.

## Flowchart

```mermaid
graph TD
    A[User triggers AI action] --> B{Which action?}

    B -- File-based detect --> C[POST /api/ai/bubbles/detect<br/>multipart file upload]
    C --> D[Proxy to aiServiceUrl/bubble/detect]
    D --> E[AiProcessing record created<br/>action: bubble.detect]
    E --> F[Return bubble regions array]

    B -- File-based process --> G[POST /api/ai/bubbles/process<br/>multipart file upload]
    G --> H[Proxy to aiServiceUrl/bubble/process]
    H --> I[AiProcessing record created<br/>action: bubble.process]
    I --> J[Return processed result]

    B -- Page detect --> K[POST /api/studio/pages/:pageId/ai/detect-bubbles]
    K --> L{assertCanRunPageAi}
    L -- No page fileKey --> M[HTTP 400 PAGE_FILE_MISSING]
    L -- Pass --> N[Read page file from storage]
    N --> O[Proxy to aiServiceUrl/bubble/detect]
    O --> P[AiProcessing record created<br/>action: studio.page.bubble.detect]
    P --> Q[Delete old AI-detected regions for page]
    Q --> R[Create StudioRegion records<br/>status: DETECTED<br/>metadata.source: ai]
    R --> S[Return pageId, processingId, regions]

    B -- Page whiten --> T[POST /api/studio/pages/:pageId/ai/whiten-bubbles]
    T --> U{assertLatestAiDetection}
    U -- Stale detection --> V[HTTP 409 AI_RESULT_STALE]
    U -- Pass --> W[Read page file from storage]
    W --> X[Proxy to aiServiceUrl/bubble/whiten]
    X --> Y[AiProcessing record created<br/>action: studio.page.bubble.whiten]
    Y --> Z[Persist whitened image to storage<br/>key: ai/pages/pageId/file-whitened.png]
    Z --> AA[Update page metadata.aiWhitened]
    AA --> AB[Return fileKey, fileUrl]
    Z -- Persist fails --> AC[Delete stored object, throw error]
```

## AI Processing Actions
- `bubble.detect` — Detect bubbles in uploaded file
- `bubble.process` — Process bubbles in uploaded file
- `studio.page.bubble.detect` — Detect bubbles in a stored page
- `studio.page.bubble.whiten` — Whiten bubbles in a stored page

## Role Access

| Action | Allowed Roles |
|--------|--------------|
| Health | All authenticated users |
| Detect/process an uploaded standalone file | EDITOR, MANGAKA |
| Detect/whiten a stored Page | Owning MANGAKA only |

## Staleness Guard
Before whitening, `assertLatestAiDetection(pageId, expectedProcessingId)` checks that
the most recent AI detection for this page matches the `expectedProcessingId`. If stale,
returns HTTP 409 `AI_RESULT_STALE`.

## Key Files
- `backend/src/controllers/ai.controller.ts` — AI route handlers
- `backend/src/routes/ai.routes.ts` — AI route registration
- `backend/src/services/studio-access.service.ts` — `assertCanRunPageAi()`
- `backend/src/services/file-access.service.ts` — storage read/write
- `backend/src/db/models.ts:1489-1513` — AiProcessingRecord
