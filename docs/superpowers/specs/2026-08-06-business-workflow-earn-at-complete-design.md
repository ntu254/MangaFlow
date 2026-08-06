# Business Workflow Reconciliation — Earn at COMPLETE Design

**Date:** 2026-08-06
**Status:** Approved design; awaiting spec review
**Scope:** Backend task/chapter contract, web editor review UI, business-flow docs, E2E tests, P2 cleanups.

## Problem

The production workflow (page assign → task → submission → chapter → earning) has
two competing business models living side by side:

- **Code today:** earning is recorded at task `COMPLETE`, page release waits for
  `COMPLETED`, and a two-step editorial gate (`MANGAKA_APPROVED → EDITOR_APPROVED →
  COMPLETED`) exists in the API.
- **Docs/UI/E2E today:** earning is recorded at `MANGAKA_APPROVED`; `MANGAKA_APPROVED`
  is treated as "done".

The gap produces unreachable earnings in the real happy path: no web or mobile
surface calls task-level `EDITOR_APPROVE`/`COMPLETE`, so the earning step is
unreachable and pages can never be released through the intended flow.

## Decision

**Option A — earning stays at task `COMPLETE`.** Lock the two-step editorial gate
in the contract, wire the editor UI, loosen the chapter send-to-review gate, and
re-sync all docs, E2E tests, and status-drift surfaces to this model.

Earnings are **tracking-only records**, not payments. `EARNED` means "recorded
for tracking"; there is no payroll/payout pipeline and none is added.

## In scope

1. Backend contract: RBAC, COMPLETE transition, chapter gate, comments, status drift.
2. Web editor UI: per-task `EDITOR_APPROVE`/`COMPLETE` actions in the chapter review page.
3. Docs and E2E sync to the earn-at-COMPLETE model.
4. P2 cleanups: page reject status, comment drift, status query drift.

## Out of scope

- No mobile task actions (mobile keeps read-only status display; chapter
  `EDITOR_APPROVE` on mobile is unchanged).
- No earning call-site change (`recordTaskEarning` stays at COMPLETE).
- No data migration: existing `MANGAKA_APPROVED` tasks are completed through the
  new editor UI; existing `EARNED` records are untouched.
- No payment/payroll pipeline.
- No change to submission lifecycle (`submissionDecision`).

## 1. Backend contract

### 1.1 RBAC: Tantou editor owns task editorial actions (P1-2)

`backend/src/services/task-submission.service.ts` — `assertTaskActionAllowed`
(approx. line 143) becomes async and resolves the task's series (reusing the
pattern in `assertTaskSeriesActive`). For `EDITOR_APPROVE` and `COMPLETE`:

- **Allowed:** the series' assigned Tantou editor (`actor.role === "EDITOR" &&
  series.editorId === actor.id`) and `ADMIN` (existing pass-through for emergency
  recovery, still recorded in audit).
- **Denied:** owning Mangaka and everyone else, with a new error code
  `TASK_EDITOR_ACTION_FORBIDDEN` and message stating the Tantou editor must
  perform the action.

`assertTaskActionAllowed` is called from `applyTaskAction`, which is already
async; the call site passes the resolved series or re-resolves it inside the
assertion.

### 1.2 COMPLETE requires EDITOR_APPROVED (P1-3)

`applyTaskAction` COMPLETE case (approx. line 449): remove `MANGAKA_APPROVED`
from the accepted source statuses. COMPLETE from `MANGAKA_APPROVED` now throws
`INVALID_TRANSITION` ("Task must be EDITOR_APPROVED before completion."). The
two-step editorial gate becomes mandatory in the contract.

### 1.3 Chapter send-to-review gate loosened (P1-1)

`backend/src/services/chapter-review.service.ts` line 29:

```ts
const APPROVED_TASK_STATUSES = ["MANGAKA_APPROVED", "EDITOR_APPROVED", "COMPLETED"];
```

Submission checks (lines 166–191) are unchanged: task actions never mutate
submission status, so a `MANGAKA_APPROVED` submission remains valid regardless
of the task's editorial step. Task completion may therefore happen before or
after chapter review — no hard ordering.

### 1.4 Earning call site and comments

- No change to `recordTaskEarning` or its COMPLETE call site.
- Fix comment drift in `page-assignment.service.ts` header (lines 6–20):
  `EDITOR_APPROVED` is an intermediate status where earning is **not** yet
  recorded; earning is recorded at `COMPLETE`; `COMPLETED` is the only state
  that releases the assignment.
- Fix the matching comment in `task-submission.service.ts` COMPLETE case to
  state that earning is recorded exactly once here (tracking only, not payment).

### 1.5 Status-drift surfaces (P2-3)

- `backend/src/query_series_status.ts` line 37: count `EDITOR_APPROVED` and
  `COMPLETED` as completed tasks (stop counting `MANGAKA_APPROVED`).
- `backend/src/services/chapter-readiness.service.ts` line 61: accept
  `MANGAKA_APPROVED`, `EDITOR_APPROVED`, `COMPLETED` (same set as the loosened
  chapter gate), keeping `CANCELLED`/`REJECTED` as terminal dead-ends.

## 2. Web editor UI (P0-1)

Location: `frontend/src/features/editor/reviews/components/review-summary-panel.tsx`
(rendered by `chapter-review-page.tsx`), which already receives `tasks` via
`useStudioTasksQuery({ chapterId })`.

- New "Assistant tasks" section in the right-hand panel:
  - Each task shows title, assistant name, and a status chip (reusing
    `studio-types.ts` style mapping).
  - Task in `MANGAKA_APPROVED`: button **"Approve"** → task action
    `EDITOR_APPROVE`.
  - Task in `EDITOR_APPROVED`: button **"Complete"** → task action `COMPLETE`.
  - Tasks in `COMPLETED`/`CANCELLED`/`REJECTED`: chip only, no button.
  - Buttons disabled while any task mutation is pending.
  - Hint text under the section: "Records the assistant's earning (tracking
    only — not a payment)."
  - Success/failure toasts via the existing `mapApiError` helper.
- Reuse `useTaskActionMutation(taskId, chapterId)`
  (`frontend/src/features/series/api/series-queries.ts` line 435); cache
  invalidation already flows through `studioTaskActionInvalidations`.
- Editor-only rendering: the actions only make sense for the assigned Tantou
  editor; the review page is already an editor surface.

## 3. Docs and E2E sync (P0-2)

Docs move to the canonical sequence:

`MANGAKA_APPROVED → EDITOR_APPROVED → COMPLETED (earning recorded, tracking
only) → page assignment released`

- `BUSINESS_FLOW.md`: lines ~291, ~312, Flow E (§9) — earning created at
  COMPLETE by the editor, not at Mangaka approval.
- `BUSINESS_CANONICAL_FLOW.md`: lines ~341, Flow E (§8) and the "tracking, not
  payments" note (line 133 stays).
- `docs/business-flows/05-assistant-submission.md`: "Earning Creation (on
  MANGAKA_APPROVED)" section and mermaid diagram → on COMPLETE.
- `docs/business-flows/08-earnings.md`: mermaid + text; keep tracking-only
  framing.
- `MangaFlow_Master_Document_Updated.md`: "Earning Creation (on
  MANGAKA_APPROVED)" (line ~753) and module notes.
- `docs/DESIGN.md` line 186: `StudioTask ||--o| Earning : "on approval"` →
  `"on completion"`.

E2E:
- `frontend/tests/live/assistant-task-lifecycle.spec.ts` (lines 164–167): the
  flow must run task `EDITOR_APPROVE` → `COMPLETE` (via an editor API session)
  before asserting the earning row on `/app/assistant/earnings`.
- Verify `frontend/tests/live/live-user-flows.spec.ts` line 757 is a chapter
  action (unchanged) and that backend tests
  (`p0-workflow-refactor.test.ts` line 567) already drive COMPLETE before
  asserting `EARNED`.

## 4. P2 cleanups

### 4.1 Page reject → `REJECTED` (P2-1)

`backend/src/services/page-assignment.service.ts`:

- `applyPageAssignmentAction` REJECT branch (line 100–106): page assignment
  status becomes `REJECTED` (with `rejectedReason`) instead of `RELEASED`.
- `assignPage` (line 67): a page is free for reassignment when the current
  assignment is `RELEASED` **or** `REJECTED`; still blocked on `PENDING`/`ACCEPTED`.
- `assertCurrentPageAssignment` (line 146): `RELEASED` and `REJECTED` both mean
  no active assignment.
- Task `assignmentStatus` is already `REJECTED` on assistant reject, so page and
  task statuses now agree.

### 4.2 Comment drift (P2-2)

Covered in §1.4 — no separate work item.

## Validation

Backend:
- `p0-workflow-refactor.test.ts`: COMPLETE from `MANGAKA_APPROVED` rejects with
  `INVALID_TRANSITION`; Mangaka COMPLETE/EDITOR_APPROVE rejects with
  `TASK_EDITOR_ACTION_FORBIDDEN`; Tantou editor COMPLETE records exactly one
  `EARNED` earning (idempotent on repeat); chapter gate accepts tasks in
  `EDITOR_APPROVED`/`COMPLETED`.
- `page-assignment.test.ts`: reject sets page assignment `REJECTED`; reassign
  allowed after `REJECTED`; RELEASE still blocked until terminal task.
- `chapter-review` tests: send-to-review passes with `EDITOR_APPROVED`/
  `COMPLETED` tasks.

Frontend:
- Component test for `ReviewSummaryPanel`: approve/complete buttons per task
  status, disabled while pending, tracking-only hint present.
- E2E `assistant-task-lifecycle.spec.ts` updated as in §3.

Commands: backend test suite (`npm test` in `backend/`), `npm run lint --prefix
frontend`, `npm test --prefix frontend`.

## Documentation changes

Files listed in §3. No new docs; no changes to mobile docs beyond status
vocabulary if already present.
