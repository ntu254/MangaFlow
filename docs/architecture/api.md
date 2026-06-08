# API Architecture

The API supports the production-only internal MVP. It exposes production,
review, board, ranking, payroll, AI, notification, and dashboard routes; it
does not expose public catalog, library, reader, or reading-progress routes.

Base URL:

```txt
/api
```

## Core groups

- `/auth`
- `/admin/users`
- `/task-types`
- `/series`
- `/series/:seriesId/members`
- `/manuscripts`
- `/chapters`
- `/pages`
- `/files`
- `/regions`
- `/tasks`
- `/submissions`
- `/comments`
- `/board`
- `/publications`
- `/rankings`
- `/payroll`
- `/ai`
- `/notifications`
- `/dashboard`

## Workflow action endpoint convention

State-changing workflow actions use `POST` endpoints with explicit action
names. Do not model workflow decisions as generic `PATCH status` calls.

Examples:

```txt
POST /api/series/:seriesId/submit
POST /api/manuscripts/:manuscriptId/request-revision
POST /api/manuscripts/:manuscriptId/forward-to-board
POST /api/board/series/:seriesId/votes
POST /api/board/series/:seriesId/decisions/finalize
POST /api/board/series/:seriesId/decisions/tie-break
POST /api/tasks/:taskId/submissions
POST /api/submissions/:submissionId/mangaka-approve
POST /api/submissions/:submissionId/editor-approve
POST /api/comments/:commentId/mark-fixed
POST /api/comments/:commentId/resolve
POST /api/payroll/tasks/:taskId/calculate
```

Resource reads use `GET`. Normal resource creation uses `POST`. Partial
non-workflow data edits may use `PATCH`.

## Backend-owned workflow services

Future backend implementation must keep critical workflow rules in services,
not in controllers or frontend code:

- Board vote resolution service.
- Assistant task workspace access service.
- PublicationReadinessService.
- Payroll calculation service.
- Status transition guards using `docs/contracts/workflow-status.md`.

## Response format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Error format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```
