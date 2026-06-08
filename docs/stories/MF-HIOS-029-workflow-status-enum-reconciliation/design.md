# Design

## Domain Model

The canonical workflow status source of truth will live in
`docs/contracts/workflow-status.md`. Feature contracts may repeat critical
rules, but should point back to this file for enum names and allowed
transitions.

## Application Flow

This story defines contracts only. Future backend stories should implement:

- Status transition guards in services.
- Board vote resolution in a Board service.
- Assistant access checks in workspace/task services.
- Publication readiness checks in `PublicationReadinessService`.
- Payroll calculations in a payroll service.

## Interface Contract

Action-style state transitions use `POST` endpoints. Examples:

- `POST /api/series/:seriesId/submit`
- `POST /api/manuscripts/:manuscriptId/request-revision`
- `POST /api/board/series/:seriesId/votes`
- `POST /api/submissions/:submissionId/mangaka-approve`
- `POST /api/comments/:commentId/mark-fixed`
- `POST /api/payroll/tasks/:taskId/calculate`

REST create/update/read endpoints remain unchanged where they are not action
commands.

## Data Model

No schema changes are made in this story. Database docs will state that each
workflow collection stores status values from the canonical contract and that
unsupported status strings are invalid implementation behavior.

## UI / Platform Impact

No new UI surfaces are added. Existing presentation-only status display values
may be aligned to the canonical enum to avoid immediate frontend/backend drift.
Existing presentation-only status badges should be treated as display
affordances until backend status contracts are implemented.

## Observability

Future backend stories should audit critical transitions:

- Board decision finalized.
- Assistant workspace access denied.
- Publication readiness passed or blocked.
- Payroll earning calculated.

## Alternatives Considered

1. Keep status enums inside each feature contract. Rejected because it invites
   drift.
2. Implement backend enums immediately. Rejected because the user asked to lock
   docs/contracts before deeper backend implementation.
