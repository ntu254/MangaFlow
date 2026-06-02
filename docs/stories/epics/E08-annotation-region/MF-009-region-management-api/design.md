# Design

## Domain Model

`Region` identifies a rectangular work area on a manga page.

Fields:

- `pageId`
- `taskId?`
- `type`: `BACKGROUND | INKING | SCREENTONE | CLEANUP | EFFECT | BUBBLE | OTHER`
- `source`: `MANUAL | AI`
- `shape`: `RECTANGLE`
- `x`, `y`, `width`, `height`: normalized numbers from `0` to `1`
- `confidence?`
- `createdBy`

Business rules:

- `shape` is MVP-fixed to `RECTANGLE`.
- Coordinates are normalized and must stay within the page bounds.
- `source` defaults to `MANUAL`.
- Create/update mutation access is allowed to Admin, Mangaka owners/co-creators,
  and Editors assigned to the series.
- Series members may list/detail regions for pages they can access.

## Application Flow

Commands:

- Create region for a page.
- Update region coordinates/type/source metadata.
- Delete region.

Queries:

- List regions by page.
- Get region by id.

Authorization flow:

1. Resolve the Page.
2. Resolve the Page's Chapter.
3. Resolve the caller's internal user from verified Clerk auth.
4. Allow Admin globally.
5. Otherwise check caller series membership against the Chapter's `seriesId`.

## Interface Contract

Routes:

- `GET /api/pages/:pageId/regions`
- `POST /api/pages/:pageId/regions`
- `GET /api/regions/:regionId`
- `PATCH /api/regions/:regionId`
- `DELETE /api/regions/:regionId`

Response uses the standard MangaFlow envelope.

Out-of-scope route for this slice:

- `POST /api/regions/:regionId/create-task`

## Data Model

Mongo collection:

- `regions`

Indexes:

- `{ pageId: 1, createdAt: -1 }`
- `{ taskId: 1 }` sparse
- `{ createdBy: 1 }`

No data migration is required because Region records do not exist yet.

## UI / Platform Impact

No UI changes in this slice. The backend API prepares the Page Workspace to load
and save manual regions in a future frontend story.

## Observability

Uses normal API response errors for authorization and validation failures.
Audit log is deferred until the broader audit module exists.

## Alternatives Considered

1. Build Region and Annotation together. Rejected for this slice because it
   would couple comment/review behavior to coordinate validation.
2. Store regions inside Page documents. Rejected because future task assignment
   needs region-level ids and independent lifecycle.

