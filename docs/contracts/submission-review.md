# Submission Review Contract

## Scope

Assistant submits and review chain runs.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Assistant, Mangaka, Editor

## Business rules

- Assistant cannot edit submitted version.
- Mangaka review before Editor.
- Editor final approval triggers payroll.

## API surface

`POST /api/tasks/:taskId/submissions`
`POST /api/submissions/:id/mangaka-approve`
`POST /api/submissions/:id/editor-approve`

## Acceptance criteria

- Submit creates version.
- Mangaka approve notifies Editor.
- Editor approve completes task.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
