# Board governance bounded-context extraction — 2026-07-27

## Outcome

The first safe decomposition seam from the release-hardening roadmap is now
implemented. Pure Board governance primitives were moved out of the workflow
monolith into
`backend/src/services/board-governance.service.ts`:

- canonical Board roster, quorum, and tie-break weight;
- vote normalization for current and legacy voter field aliases;
- tally evaluation for approval, rejection, tie-break, and pending states.

`workflow.service.ts` remains the owner of proposal actions, VotingSession
persistence, authorization, and transaction boundaries. Controllers and tests
now import Board primitives from the dedicated service. No route, payload,
status transition, authorization rule, or persistence behavior was changed.

## Verification

- Backend lint: PASS.
- Backend build: PASS.
- Focused Board, voting-cancellation, and production-completion tests: PASS,
  15 tests.
- Backend aggregate Vitest: PASS, exit 0, sequential run completed in
  approximately 247 seconds.
- `npm run audit:architecture`: PASS with no boundary violation lines.
- `git diff --check`: PASS; only existing CRLF normalization warnings were
  reported.

## Follow-up

The next safe seam is the side-effecting Proposal lifecycle/finalization
service, but it should be extracted only with focused transition and
transaction tests. The current patch intentionally does not move that
orchestration or infer the unresolved Admin-scope decision `FLOW-GAP-04 / CT-11`.
