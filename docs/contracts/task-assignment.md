# Task Assignment Contract

## Scope

Assign page/region task to Assistant.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor, Assistant

## Business rules

- Assistant must be active SeriesMember.
- TaskType must be active.
- Context pages are read-only.

## API surface

`POST /api/tasks`
`POST /api/regions/:regionId/create-task`

## Acceptance criteria

- Task created for valid assistant.
- Invalid assistant blocked.
- Assistant receives notification.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
