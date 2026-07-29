# Production bounded-context extraction — 2026-07-27

## Result

PASS for the Production chapter-review/readiness and task/submission seams.
The extraction preserves the existing routes, authorization checks, status
transitions, transactions, audit entries, outbox events, idempotency behavior,
and error codes. No new business transition was introduced.

## Ownership after extraction

- `chapter-readiness.service.ts` owns chapter readiness and review-version
  primitives.
- `chapter-review.service.ts` owns blocking-comment lookup and the transactional
  submit/resubmit-to-Editor-review command.
- `task-submission.service.ts` owns task actions, assignee eligibility, task
  detail reads, revision reopen, idempotent task submission, and Mangaka
  submission decisions including earning/outbox side effects.
- `workflow.service.ts` keeps compatibility exports only for callers that still
  import the historical names.

## Verification

- Backend lint: PASS (`npm run lint`).
- Backend build: PASS (`npm run build`).
- Focused workflow regression: PASS (`workflow.test.ts`,
  `p0-workflow-refactor.test.ts`, `validation-guardrails.test.ts`).
- Earlier chapter readiness/review regression: PASS (`chapter-readiness.service.test.ts`
  and workflow review coverage).

## Follow-up

Publication scheduling/publishing and the remaining publication/earnings
cross-cutting policies are the next bounded-context seam. The production
database migration scripts remain supplied but are intentionally not executed
against a deployed database in this workspace.
