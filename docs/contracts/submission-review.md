# Submission Review Contract

## Scope

Assistant submits immutable work versions, Mangaka performs internal review,
and Tantou Editor performs production final approval.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Assistant, Mangaka, Editor

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Assistant cannot edit submitted version.
- Mangaka review before Editor.
- Editor final approval is production final approval and is separate from
  proposal/manuscript review.
- Editor final approval triggers payroll calculation.
- Revisions create a new Submission version; submitted versions are immutable.

## API surface

`POST /api/tasks/:taskId/submissions`
`POST /api/submissions/:id/mangaka-approve`
`POST /api/submissions/:id/request-revision`
`POST /api/submissions/:id/reject`
`POST /api/submissions/:id/editor-approve`

## Acceptance criteria

- Submit creates version.
- Mangaka approve notifies Editor.
- Editor approve completes task.
- Wrong role cannot skip Mangaka review.
- Editor final approval is the only approval that can trigger payroll.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
