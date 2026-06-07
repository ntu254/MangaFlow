# Page Workspace Contract

## Scope

Workspace aggregate for page production.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor, Assistant

## Business rules

- Assistant cannot open page workspace directly.
- Assistant opens task workspace only.

## API surface

`GET /api/pages/:pageId/workspace`
`GET /api/tasks/:taskId/workspace`

## Acceptance criteria

- Mangaka/Editor page workspace works.
- Assistant direct page workspace returns 403.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
