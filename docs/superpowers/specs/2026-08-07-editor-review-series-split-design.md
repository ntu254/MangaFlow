# Editor Review / Series Split Design

Date: 2026-08-07
Status: Approved by user (2026-08-07)

## Problem

`/app/editor/review` (Review Queue) and `/app/editor/series` (Series Monitor) both
surface the same editorial backlog. Both are fed by `buildReviewQueue()`
(`frontend/src/features/editor/model/editor-access.ts:72`), both show pending counts,
deadline risk, and review entry points for the same chapters and proposals. The two
pages duplicate functionality from different angles (item-centric vs. series-centric).

## Goal

Split cleanly by review type:

- `/app/editor/review` — proposal review only (`PROPOSAL_PACKAGE` items).
- `/app/editor/series` — chapter review only (chapters in `TANTOU_REVIEW` +
  assistant submissions awaiting editor decision).

## Decisions

1. `/app/editor/series` keeps the Series Monitor table and adds a second tab:
   **Series** (current content) and **Chapter Reviews**.
2. Assistant submissions move to the Series page's Chapter Reviews tab.
3. The submission review workspace route moves from `/app/editor/review/$submissionId`
   to `/app/editor/series/submission/$submissionId`.
4. Shared UI primitives (`QueuePage`, `QueueTable`, `QueueTabs`, `StatCard`,
   `SearchToolbar`, `DataPagination`) and `reviewQueueColumns` are reused; a shared
   `ReviewItemsPanel` component hosts the common stats + tabs + toolbar + table logic.

## Changes

### 1. `/app/editor/review` — Proposal Reviews only

- `ReviewQueuePage` keeps its UI (tabs ALL/NEW/NEEDS/BLOCKING/OVERDUE/COMPLETED,
  stat cards, search, pagination) but its queue is filtered to
  `kind === "PROPOSAL_PACKAGE"`.
- Remove `buildSubmissionReviewItems(liveSubmissions)` and
  `useEditorReviewQueueQuery` from this page.
- Title/description become proposal-focused: "Proposal Reviews".
- Nav label in `shared/config/navigation.ts:39` changes from "Review Queue" to
  "Proposal Reviews".

### 2. `/app/editor/series` — Series Monitor with two tabs

- Add tab state: `"SERIES" | "REVIEWS"`.
- **Series tab**: current stat cards (Active, At risk, Pending review, Publish ready)
  + `SeriesMonitorTable`. Pending-review count continues to include chapters and
  submissions.
- **Chapter Reviews tab**: items from `buildReviewQueue()` filtered to
  `kind === "CHAPTER"` plus `buildSubmissionReviewItems()` results, rendered by the
  shared `ReviewItemsPanel`.

### 3. Shared `ReviewItemsPanel`

- New component at
  `features/editor/review-queue/components/review-items-panel.tsx` that accepts a
  pre-built `ReviewItem[]` and renders: stat cards, tabs, search toolbar, `QueueTable`
  with `reviewQueueColumns`, pagination.
- `ReviewQueuePage` and the Series page's Chapter Reviews tab both render it.

### 4. Route move

- Delete `frontend/src/routes/app.editor.review.$submissionId.tsx`.
- Create `frontend/src/routes/app.editor.series.submission.$submissionId.tsx`
  rendering the same `EditorSubmissionReview`.
- Update back-link in `editor-submission-review.tsx:66` from `/app/editor/review` to
  `/app/editor/series`.

### 5. Untouched

- `reviewQueueColumns`/`review-queue-table.tsx` — used by both pages; the SUBMISSION
  branch stays (needed by Chapter Reviews tab).
- `ReviewDetailDrawer` — dead code, not in scope.
- `buildReviewQueue`, `buildSubmissionReviewItems`, `getDeadlineRisk`,
  `getPublicationReadiness` in `editor-access.ts` — unchanged.

## Verification

- `npx tsc --noEmit` (or repo's typecheck command) passes.
- Lint passes.
- E2E suite (`frontend/tests/e2e-role-flows.spec.ts`, `frontend/tests/live/live-user-flows.spec.ts`)
  only asserts routes load; rerun to confirm no regressions.
- Manual: `/app/editor/review` shows only proposal items; `/app/editor/series`
  Chapter Reviews tab shows chapters + submissions; submission workspace reachable at
  the new route; old `/app/editor/review/$submissionId` no longer resolves.
