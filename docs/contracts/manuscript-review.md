# Manuscript Review Contract

## Scope

Tantou Editor reviews the initial Series proposal/manuscript before Board
review.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Mangaka, Editor

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- This is Editor proposal review, not production final approval.
- Editor can request revision, reject, or forward to Board.
- New manuscript versions must not overwrite old files.
- Forwarding to Board sets Series to `BOARD_REVIEW` and Manuscript to
  `APPROVED_TO_BOARD`.

## API surface

`POST /api/manuscripts/:id/request-revision`
`POST /api/manuscripts/:id/forward-to-board`
`POST /api/manuscripts/:id/reject`

## Acceptance criteria

- Revision returns to Mangaka.
- Forward-to-Board sets Series `BOARD_REVIEW`.
- Reject sets Series REJECTED.
- Production final approval remains in `submission-review.md`.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
