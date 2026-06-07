# Board Approval Contract

## Scope

Editorial Board votes on Series approval.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Board, Board Chair

## Business rules

- Majority vote wins.
- Tie is decided by Board Chair.
- Admin cannot override Board.

## API surface

`POST /api/series/:seriesId/votes`
`POST /api/series/:seriesId/decisions/finalize`
`POST /api/series/:seriesId/decisions/tie-break`

## Acceptance criteria

- Vote summary works.
- Approved series can create Chapter.
- Rejected series cannot.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
