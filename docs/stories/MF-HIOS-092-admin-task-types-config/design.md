# Design

## Domain Model

`TaskType` remains the workflow configuration record with:

- `name`
- `description`
- `baseRate`
- `isActive`

Business rules:

- `baseRate` must be non-negative.
- Active TaskType records may be used for new task assignment.
- Used TaskType records must not be hard-deleted.
- Deactivating a TaskType prevents future assignment but preserves existing Task snapshots.

## Application Flow

Admin opens `/app/admin/task-types`.

The page loads all TaskType records from `/api/admin/task-types`, including inactive records. Admin may:

- Create a TaskType.
- Edit description and base rate.
- Activate or deactivate a TaskType.
- Delete an unused TaskType.
- Attempting to delete a used TaskType deactivates it and returns an error message.

## Interface Contract

Admin routes:

```txt
GET /api/admin/task-types
POST /api/admin/task-types
PATCH /api/admin/task-types/:taskTypeId
PATCH /api/admin/task-types/:taskTypeId/status
DELETE /api/admin/task-types/:taskTypeId
```

All routes are protected by:

```txt
requireAuth + requireRole("ADMIN")
```

Response envelope follows `docs/architecture/api.md`.

## Data Model

No schema migration is planned.

`TaskType` indexes remain:

- unique `name`
- indexed `isActive`

## UI / Platform Impact

`/app/admin/task-types` moves from placeholder to real Admin page. The page uses shared Admin UI patterns and must not imply Admin can override task review, publication readiness, Board decisions, or payroll formula.

## Observability

Validation proof is recorded through:

- server unit tests
- server/client lint and build
- Harness story verification

## Alternatives Considered

1. Keep using `/api/tasks/types` for Admin UI. Rejected because Admin workflow configuration should live behind explicit Admin routes.
2. Hard-delete every TaskType. Rejected because used TaskType records are part of existing task/payroll history.

