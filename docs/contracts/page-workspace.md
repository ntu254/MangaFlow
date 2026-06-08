# Page Workspace Contract

## Scope

Workspace aggregate for page production.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor, Assistant

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Workspace is an aggregate view, not a required database model.
- Assistant cannot open page workspace directly.
- Assistant opens task workspace only.
- Assistant task workspace access is granted only when
  `Task.assignedTo === currentUser._id`.
- Assistant can see assigned page/region and explicit read-only
  `contextPageIds` only.
- Assistant cannot see full chapter by default.

## API surface

`GET /api/pages/:pageId/workspace`
`GET /api/tasks/:taskId/workspace`

## Acceptance criteria

- Mangaka/Editor page workspace works.
- Assistant direct page workspace returns 403.
- Assistant cannot open another assistant's task workspace.
- Assistant task workspace omits pages outside assigned scope and
  `contextPageIds`.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
