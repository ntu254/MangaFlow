# Manuscript Review Contract

## Scope

Editor reviews initial manuscript.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor

## Business rules

- Editor can request revision, reject, or approve to Board.
- New manuscript versions must not overwrite old files.

## API surface

`POST /api/manuscripts/:id/request-revision`
`POST /api/manuscripts/:id/approve-to-board`
`POST /api/manuscripts/:id/reject`

## Acceptance criteria

- Revision returns to Mangaka.
- Approve sets Series BOARD_REVIEW.
- Reject sets Series REJECTED.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
