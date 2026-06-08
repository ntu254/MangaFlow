# Comment Resolution Contract

## Scope

Manage issue/comment lifecycle for production review.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Assistant, Mangaka, Editor

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Flow: `OPEN -> FIXED_BY_ASSISTANT -> VERIFIED_BY_MANGAKA -> RESOLVED_BY_EDITOR`.
- Editor can reopen from `FIXED_BY_ASSISTANT` or `VERIFIED_BY_MANGAKA` to
  `OPEN` when the fix is insufficient.
- Unresolved comments block publication.
- Publication is blocked unless every blocking comment is
  `RESOLVED_BY_EDITOR`.

## API surface

`POST /api/comments`
`POST /api/comments/:id/mark-fixed`
`POST /api/comments/:id/verify-fixed`
`POST /api/comments/:id/resolve`
`POST /api/comments/:id/reopen`

## Acceptance criteria

- Wrong role cannot skip states.
- Readiness fails with unresolved comment.
- Editor reopen returns comment to `OPEN`.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
