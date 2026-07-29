# Material Management

## Description
Materials are versioned file attachments scoped to PROPOSAL, SERIES, CHAPTER, or PAGE.
They support scoped CRUD and immutable version history. Admin has no Material access.

## Flowchart

```mermaid
graph TD
    A[Mangaka/Editor creates material<br/>POST /api/materials] --> B[Material created<br/>status: DRAFT<br/>scope: PROPOSAL/SERIES/CHAPTER/PAGE]
    B --> C[Optional: attach file via presigned upload]
    
    C --> D[Mangaka/Editor patches material<br/>PATCH /api/materials/:id]
    D --> E[Material updated]
    
    E --> F[Add new version<br/>POST /api/materials/:id/versions]
    F --> G[Version appended to versions[]<br/>currentVersion incremented]
    
    G --> H[Delete material<br/>DELETE /api/materials/:id]
    H --> I[Material removed]

```

## Material Status Values (from `backend/src/db/models.ts:1063-1067`)

| Status | Description |
|--------|-------------|
| `DRAFT` | Initial state |
| `ACTIVE` | Active material (usable for review) |
| `IN_REVIEW` | Under review |
| `APPROVED` | Accepted by the chapter-readiness guard |
| `ARCHIVED` | Archived |

## Material Readiness for Chapter Review
A material is usable when sending a Chapter to Tantou review if: status is `ACTIVE`
or `APPROVED`, it has an accessible file (`fileKey`/`url`), and it is scoped to the
chapter or one of its pages. Enforced in `sendChapterToEditorReview`
(`chapter-review.service.ts`, error `REVIEW_MATERIAL_NOT_ACTIVE`). See
[04-chapter-workflow.md](04-chapter-workflow.md).

Material status is a first-class field. Normal `PATCH /api/materials/:id` accepts
the canonical status values, but workflow transitions are actor-guarded:

| Transition | Authorized actor |
|---|---|
| `DRAFT -> ACTIVE` | owning Mangaka or assigned Tantou |
| `ACTIVE -> IN_REVIEW` | owning Mangaka or assigned Tantou |
| `IN_REVIEW -> ACTIVE` | owning Mangaka or assigned Tantou (revision) |
| `ACTIVE`/`IN_REVIEW -> APPROVED` | assigned Tantou only |
| any non-archived status -> `ARCHIVED` | owning Mangaka or assigned Tantou |

`DRAFT -> APPROVED` is rejected with `409 INVALID_TRANSITION`. A Mangaka or an
unassigned Editor receives `403 TANTOU_ASSIGNMENT_REQUIRED` when attempting
approval. An approved Material is immutable: `POST /api/materials/:id/versions`
returns `409 APPROVED_MATERIAL_IMMUTABLE`; replacement work starts as a new
`DRAFT` Material so the approved record remains auditable. Deleting an approved
Material is also rejected with the same `409 APPROVED_MATERIAL_IMMUTABLE` code.
The web library hides both **Replace** and **Delete** for approved records.

## Verified frontend lifecycle

The live E2E contract covers the complete production path:

1. Owning Mangaka creates a `DRAFT` Material with a real uploaded file and Chapter scope.
2. Mangaka appends version 2, then advances `DRAFT -> ACTIVE -> IN_REVIEW`.
3. Assigned Tantou advances `IN_REVIEW -> APPROVED`.
4. The approved record exposes neither Replace nor Delete in the UI.
5. A direct delete attempt is rejected with `409 APPROVED_MATERIAL_IMMUTABLE`, and
   the approved record remains visible.

### Material `APPROVED` reachability (Resolved)
- The Material model supports `APPROVED` (`db/models.ts`).
- The Chapter readiness guard accepts `ACTIVE` **or** `APPROVED`
  (`workflow.service.ts:1471-1490`).
- `assertCanTransitionMaterialToApproved` requires the assigned Tantou, while
  generic mutation remains owner/assignment scoped (`authorization.service.ts`).
- The canonical patch endpoint enforces the transition matrix and returns
  `TANTOU_ASSIGNMENT_REQUIRED`/`INVALID_TRANSITION` for the guarded cases.
- The web material library reads the first-class API status and exposes the full
  canonical status set.
- `migrate:material-status --dry-run` promotes legacy `metadata.status` safely;
  invalid values stop the migration and a second run is idempotent.

## Material Scope
`PROPOSAL`, `SERIES`, `CHAPTER`, `PAGE` � controls ownership and visibility.

## Role Access

| Action | Allowed Roles | Guard |
|--------|--------------|-------|
| Create, Patch, Add version, Delete | EDITOR, MANGAKA | Scoped guard; approved records cannot be versioned or deleted |
| List | All (scoped by authorization) | `material.routes.ts:7` |

## Key Files
- `backend/src/controllers/material.controller.ts` — scoped CRUD handlers
- `backend/src/routes/material.routes.ts` � route registration
- `backend/src/db/models.ts:999-1076` � MaterialRecord, MaterialVersion, materialSchema
- `backend/src/validators/material.schema.ts` � Zod validation schemas
