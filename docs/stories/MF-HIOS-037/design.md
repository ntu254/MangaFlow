# Design

## Domain Model

- `Manuscript.status`: canonical ManuscriptStatus from workflow-status contract.
- `Series.status`: canonical SeriesStatus.

## Application Flow

1. Editor hits action endpoint.
2. Middleware enforces auth + `EDITOR` role.
3. Service loads manuscript and linked Series.
4. Service requires both records in `EDITOR_REVIEW`.
5. Service applies mapped statuses:
   - request revision -> Manuscript `REVISION_REQUESTED`, Series `REVISION_REQUESTED`
   - forward to Board -> Manuscript `APPROVED_TO_BOARD`, Series `BOARD_REVIEW`
   - reject -> Manuscript `REJECTED`, Series `REJECTED`

## Interface Contract

- `POST /api/manuscripts/:id/request-revision`
- `POST /api/manuscripts/:id/forward-to-board`
- `POST /api/manuscripts/:id/reject`

Response envelope:

```json
{
  "success": true,
  "message": "Manuscript forwarded to Board",
  "data": {
    "manuscript": {},
    "series": {}
  }
}
```

Errors:

- 403 if not Editor.
- 404 if manuscript missing.
- 409 if manuscript/Series not in `EDITOR_REVIEW`.

## Data Model

Add `status` to existing Manuscript schema with default `DRAFT`. No migration included.

## UI / Platform Impact

No frontend changes in this story.

## Observability

Audit logging remains future scope.

## Alternatives Considered

1. Generic PATCH status endpoint: rejected because workflow decisions require explicit action endpoints.
2. Collapse proposal review with production final approval: rejected by workflow-status contract.
3. Let Admin override: rejected by product invariant.
