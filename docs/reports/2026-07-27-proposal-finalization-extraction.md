# Proposal finalization and VotingSession command extraction — 2026-07-27

## Outcome

Board VotingSession finalization and cancellation now have a dedicated owner:
`backend/src/services/proposal-governance.service.ts`.

The extraction preserves:

- Board Chair authorization;
- optimistic `expectedVersion` checks and frozen Proposal snapshot checks;
- APPROVED, REJECTED, NO_QUORUM, and TIE_BREAK_REQUIRED outcomes;
- transactional Proposal updates and approved-Proposal Series promotion;
- BoardDecision upsert, audit entries, outbox events, and cancellation restore
  to `PENDING_BOARD`.

Shared transaction/audit/outbox/document helpers now live in
`backend/src/services/workflow-support.service.ts`. `workflow.service.ts`
keeps compatibility re-exports, while voting and mobile controllers import the
commands from the Proposal governance owner directly.

No route, request/response payload, authorization rule, or business transition
was changed.

## Verification

- Targeted Board, P0, production-completion, and cancellation tests: PASS.
- Backend lint/build: PASS.
- Backend aggregate Vitest: PASS, exit 0, sequential run completed in
  approximately 256 seconds.
- Web lint/typecheck/build: PASS.
- `npm run audit:architecture`: PASS with no boundary violation lines.
- `git diff --check`: PASS; only existing CRLF normalization warnings were
  reported.

## Review decision

No blocking findings were identified. The transaction boundary remains inside
the extracted command service, and existing workflow callers retain a
compatibility re-export. Admin-scope business decisions and production
migrations remain untouched.
