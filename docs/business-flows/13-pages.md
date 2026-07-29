# Pages

## Description
Pages are embedded sub-documents within a Chapter. Each page has a status,
image/file references, and metadata. Pages are production evidence owned by
the Series Mangaka. Only the owning Mangaka may create, update, delete, detect,
or whiten a stored Page. The assigned Tantou reviews a frozen snapshot without
modifying that evidence.

## Flowchart

```mermaid
graph TD
    A[Chapter exists] --> B[Create page<br/>POST /api/chapters/:chapterId/pages]
    B --> C{Has file asset?}
    C -- fileKey/fileUrl/imageUrl --> D[Page status: UPLOADED]
    C -- No file --> E[Page status: PENDING_UPLOAD]
    
    D --> F[Page attached to chapter.pages[]]
    E --> F

    F --> G[Update page<br/>PATCH /api/pages/:pageId]
    G --> H[Page fields updated]

    F --> V[Reorder all pages<br/>PATCH /api/chapters/:chapterId/pages/reorder]
    V --> W[Atomic order persisted<br/>index/pageNumber renumbered 1..N]

    F --> I[Delete page<br/>DELETE /api/pages/:pageId]
    I --> J[Page removed and remaining pages<br/>renumbered 1..N]

    F --> K{AI processing}
    K -- Detect bubbles --> L[StudioRegion records created<br/>status: DETECTED<br/>metadata.source: ai]
    K -- Whiten bubbles --> M[Whitened image stored<br/>metadata.aiWhitened attached]

    F --> N[Send chapter to review]
    N --> O{pageHasUploadedAsset?}
    O -- No --> P[HTTP 409 PAGE_IMAGE_REQUIRED]
    O -- Yes --> Q[Pages status: TANTOU_REVIEW]

    Q --> R{Editor approves chapter}
    R --> S[Pages status: FINALIZED]

    Q --> T{Editor requests revision}
    T --> U[Pages status: REVISION_REQUIRED]
```

## Page Status Values (from `backend/src/types.ts:146-155`)

| Status | Description |
|--------|-------------|
| `PENDING_UPLOAD` | Page created without file |
| `UPLOADED` | File uploaded |
| `REGIONING` | Regions being defined |
| `IN_PRODUCTION` | Work in progress |
| `MANGAKA_REVIEW` | Under Mangaka review |
| `REVISION_REQUIRED` | Changes needed |
| `TANTOU_REVIEW` | Under Editor (Tantou) review |
| `FINALIZED` | Editor approved, final |

## Page Asset Check (`chapter-readiness.service.ts`)
`pageHasUploadedAsset(page)` returns true if:
- `fileKey` exists and is non-empty, OR
- `fileUrl`/`imageUrl` exists and is not a placeholder/metadata URL
AND page status is not `PENDING_UPLOAD` or `REVISION_REQUIRED`

## Role Access

| Action | Allowed Roles |
|--------|--------------|
| Create page | Owning MANGAKA |
| Update page | Owning MANGAKA |
| Reorder pages | Owning MANGAKA |
| Delete page | Owning MANGAKA |

## Ordering Contract

- `PATCH /api/chapters/:chapterId/pages/reorder` accepts
  `orderedPageIds: string[]`.
- The array must be an exact permutation of every current Page ID: no missing,
  unknown, or duplicate IDs. Invalid input returns `400 INVALID_PAGE_ORDER`.
- Reorder writes the embedded Page array atomically and normalizes both `index`
  and `pageNumber` to contiguous values `1..N`.
- Delete is also atomic: the target Page is removed and every remaining Page is
  renumbered in the same Chapter update.
- Reorder and delete use the same Chapter-content ownership guard as create and
  update. Reviewers see persisted order but cannot mutate production evidence.

## Key Files
- `backend/src/controllers/series.controller.ts:763-829` — page CRUD handlers
- `backend/src/routes/series.routes.ts:84-99` — page routes
- `backend/src/services/chapter-readiness.service.ts` — `pageHasUploadedAsset()`
- `backend/src/db/models.ts:492-507` — ChapterPage type
- `src/shared/constants/status-constants.ts:111-133` — Page status constants
