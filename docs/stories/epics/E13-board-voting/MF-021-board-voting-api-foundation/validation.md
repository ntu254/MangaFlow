# Validation

## Proof Strategy
MF-021 is verified when:
1. Mongoose schemas are verified through model initialization tests.
2. Integration tests verify correct validation of duplicate voting, active board status, and role/membership checks.
3. Finalize endpoint behaves correctly under clean majority (APPROVE vs REJECT vs NEEDS_REVISION) and fails on ties.
4. Tie-break endpoint works when initiated by the Board Chair.
5. All backend tests pass and typescript compilation succeeds.
6. The Harness CLI registers story verification.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | - `BoardMember`, `BoardVote`, `BoardDecision` model definitions.<br>- Vote majority calculation (Approve, Reject, Needs Revision wins). |
| Integration | - `POST /api/series/:seriesId/votes` checks active board member role.<br>- Prevent duplicate voting (updates existing vote).<br>- `POST /api/series/:seriesId/decisions/finalize` enforces majority check and tie-breaker errors.<br>- `POST /api/series/:seriesId/decisions/tie-break` restricts action to Board Chair. |
| Platform | Server compiles successfully. |

## Commands
```text
npm run typecheck --workspace server
npm run test --workspace server
.\scripts\bin\harness-cli.exe story verify MF-021
```

## Acceptance Evidence

All unit and integration tests (including the new route tests) passed successfully.

```text
 ✓ src/modules/board/board.service.test.ts (5 tests)
 ✓ src/modules/board/board.routes.test.ts (8 tests)

 Test Files  27 passed (27)
      Tests  113 passed (113)
```

TypeScript type checking compiles cleanly:
```text
> @mangaflow/server@0.0.0 typecheck
> tsc -p tsconfig.json --noEmit --pretty false
```

