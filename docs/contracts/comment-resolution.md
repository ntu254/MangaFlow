# Comment Resolution Contract

## Scope

Manage issue/comment lifecycle.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Assistant, Mangaka, Editor

## Business rules

- Flow: OPEN → FIXED_BY_ASSISTANT → VERIFIED_BY_MANGAKA → RESOLVED_BY_EDITOR.
- Unresolved comments block publication.

## API surface

`POST /api/comments`
`POST /api/comments/:id/mark-fixed`
`POST /api/comments/:id/verify-fixed`
`POST /api/comments/:id/resolve`

## Acceptance criteria

- Wrong role cannot skip states.
- Readiness fails with unresolved comment.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
