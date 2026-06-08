# Production Team Contract

## Scope

Manage SeriesMember team.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor, Assistant

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Adding Assistant to team only makes them eligible for assignment.
- It does not grant full chapter access.
- Assistant SeriesMember must use `role=ASSISTANT`, `status=ACTIVE`, and
  `accessScope=TASK_ONLY`.
- Actual workspace access comes from `Task.assignedTo`, not membership alone.

## API surface

`GET /api/series/:seriesId/members`
`POST /api/series/:seriesId/members`

## Acceptance criteria

- Assistant appears in task dropdown.
- Assistant cannot view all pages.
- Inactive or non-Assistant users cannot be added as assignable Assistants.
- Team membership alone does not authorize page workspace access.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
