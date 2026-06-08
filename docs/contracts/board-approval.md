# Board Approval Contract

## Scope

Editorial Board votes on Series approval.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Board, Board Chair

## Business rules

- Status names and transitions must follow `docs/contracts/workflow-status.md`.
- Board only votes on Series in `BOARD_REVIEW`.
- Vote options are `APPROVE`, `REJECT`, and `NEEDS_REVISION`.
- Minimum valid votes: at least 3 active Board members, or all active Board
  members when a seeded/dev environment has fewer than 3.
- Board Chair votes normally as a Board member.
- Board Chair tie-break is a separate action only after normal votes produce
  `TIE_BREAK_REQUIRED`.
- Three-option majority uses plurality: the option with strictly more votes
  than every other option wins. A tie for highest count requires Chair
  tie-break.
- Decision can finalize when all eligible votes are submitted or the vote
  deadline passes.
- Admin cannot override Board.

## API surface

`POST /api/board/series/:seriesId/votes`
`POST /api/board/series/:seriesId/decisions/finalize`
`POST /api/board/series/:seriesId/decisions/tie-break`

## Acceptance criteria

- Vote summary works.
- Approved series can create Chapter.
- Rejected series cannot.
- Needs-revision result returns Series to `REVISION_REQUESTED`.
- Tie result requires Board Chair tie-break.
- Admin override attempt is blocked.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
