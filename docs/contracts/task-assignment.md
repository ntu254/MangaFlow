# Task Assignment Contract

## Scope

Assign page/region task to Assistant.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor, Assistant

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Series must be `APPROVED`, `ONGOING`, or `AT_RISK`.
- Assigner must be Owner Mangaka, permitted Co-Mangaka, or Tantou Editor for
  the Series.
- Assistant must be active SeriesMember.
- Assistant must have system role `ASSISTANT`.
- TaskType must be active.
- Page must belong to the selected Chapter/Series.
- Region, when supplied, must belong to the selected Page.
- Context pages are read-only.
- Due date cannot be in the past.
- Base rate must be non-negative and is stored as a task snapshot.
- Active SeriesMember eligibility does not grant page/file/workspace access outside `Task.assignedTo` and explicit context scope.

## API surface

`POST /api/tasks`
`POST /api/regions/:regionId/tasks`

## Acceptance criteria

- Task created for valid assistant.
- Invalid assistant blocked.
- Assistant receives notification.
- Assistant is authorized only for the assigned Task Workspace.
- Assistant cannot create tasks.
- Assistant cannot use Series membership alone to access non-task files or pages.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
