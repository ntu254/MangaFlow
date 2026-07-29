# Proposal lifecycle promotion extraction — 2026-07-27

## Outcome

The second bounded-context seam is implemented. Approved-Proposal promotion is
now owned by
`backend/src/services/proposal-lifecycle.service.ts` instead of the workflow
monolith. The service contains:

- canonical publication-type normalization;
- cadence derivation;
- safe series slug generation;
- idempotent `APPROVED` Proposal → `PRE_PRODUCTION` Series promotion;
- optional Mongo session propagation for transaction callers.

`workflow.service.ts` still orchestrates the existing Proposal actions and
Board finalization commands. The extraction keeps all route contracts,
authorization, status transitions, Series uniqueness, and persistence behavior
unchanged.

## Verification

- Proposal lifecycle service, Board, and P0 regression tests: PASS.
- Backend lint/build: PASS.
- Backend aggregate Vitest: PASS, exit 0, sequential run completed in
  approximately 267 seconds.
- Web lint/typecheck/build: PASS.
- `npm run audit:architecture`: PASS with no boundary violation lines.
- `git diff --check`: PASS; only existing CRLF normalization warnings were
  reported.

## Review decision

No blocking findings were identified for this seam. `closeVotingSession()` and
`cancelVotingSession()` remain in `workflow.service.ts` intentionally; moving
those functions safely requires a dedicated review of transaction, audit,
outbox, optimistic concurrency, and multi-proposal edge cases.
