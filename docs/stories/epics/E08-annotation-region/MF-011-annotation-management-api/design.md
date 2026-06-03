# Design

## Domain Model

`Annotation` identifies a rectangular review marker on a manga page.

Fields:

- `pageId`
- `createdBy`
- `targetType`: MVP-fixed to `PAGE`
- `targetId`: defaults to `pageId`
- `regionId?`
- `type`: MVP-fixed to `RECTANGLE`
- `x`, `y`, `width`, `height`: normalized numbers from `0` to `1`
- `comment?`
- `status`: `OPEN | RESOLVED`

Business rules:

- Coordinates must stay within page bounds.
- `targetType` is `PAGE` for this slice.
- `targetId` must match the route `pageId`.
- `regionId`, when supplied, must point to a Region on the same page.
- Create access is allowed to Admin, Mangaka owners/co-mangakas, and assigned
  Editors.
- Update/delete access is allowed to Admin, assigned Editors, or the annotation
  creator.

## Application Flow

Commands:

- Create annotation for a page.
- Update annotation coordinates/comment/status.
- Delete annotation.

Queries:

- List annotations by page.
- Get annotation by id.

Authorization flow:

1. Resolve Page.
2. Resolve Chapter from Page.
3. Resolve caller internal user from verified Clerk auth.
4. Allow Admin globally.
5. Otherwise check caller series membership against the Chapter `seriesId`.

## Interface Contract

Routes:

- `GET /api/pages/:pageId/annotations`
- `POST /api/pages/:pageId/annotations`
- `GET /api/annotations/:annotationId`
- `PATCH /api/annotations/:annotationId`
- `DELETE /api/annotations/:annotationId`

Response uses the standard MangaFlow API envelope.

Out-of-scope route:

- `POST /api/annotations/:annotationId/comment`

## Data Model

Mongo collection:

- `annotations`

Indexes:

- `{ pageId: 1, createdAt: -1 }`
- `{ createdBy: 1 }`
- `{ status: 1 }`
- `{ regionId: 1 }` sparse

No migration is required because Annotation records do not exist yet.

## UI / Platform Impact

No UI change in this slice. The API prepares Page Workspace annotation panels
and editor review flows for a future story.

## Observability

Uses normal API response errors for authorization and validation failures.
Audit log is deferred until the broader audit module exists.

## Alternatives Considered

1. Build Annotation and Comment lifecycle together. Rejected because comment
   workflow has a separate state machine and role-specific transitions.
2. Allow Task/Submission annotations immediately. Rejected because those target
   modules are not implemented enough for durable scope validation.
