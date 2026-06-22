# Board Current Functions

Last updated: 2026-06-22

This document describes the current Board role behavior for developers who need
to maintain or extend the Board flow.

## Overview

The Board role uses the main app sidebar as its only navigation surface. Board
pages are framed as an internal Dashboard workspace, not as a separate
"Decision Portal" subnav.

Current Board flow:

1. Dashboard
2. Review Workspace
3. Voting Panel
4. Publishing Schedule
5. Reader Vote Data
6. Ranking Analytics
7. Cancellation Cases
8. Decision History

Reader Vote Data multi-series import is intentionally deferred.

## Navigation And Shell

Frontend entry points:

- `client/src/layouts/Sidebar.tsx`
- `client/src/features/board/components/DecisionPortal.tsx`
- `client/src/features/dashboard/components/BoardDash.tsx`

Behavior:

- Board sidebar item `/app/dashboard` is labeled `Dashboard`.
- Board does not see `/app/settings`.
- Board pages do not render a horizontal subnav.
- Shared Board UI primitives live in `DecisionPortal.tsx`, including:
  - `DecisionPortalShell`
  - `PortalCard`
  - `PortalMetric`
  - `PortalPill`
  - `PortalNotice`
  - `DecisionTimeline`

Implementation note:

- `DecisionPortal.tsx` still exports non-component helpers, so targeted ESLint
  reports a Fast Refresh warning for `react-refresh/only-export-components`.

## Dashboard

Route:

- `/app/dashboard`

Primary frontend:

- `client/src/features/dashboard/components/BoardDash.tsx`

Purpose:

- Gives Board users a compact command center for proposal review, voting,
  publishing schedule, ranking analytics, cancellation cases, and decision
  history.

Data:

- Reads Board dashboard summary through `useDashboard("board")`.
- Dashboard links into the Board subpages rather than performing decisions
  inline.

## Review Workspace

Route:

- `/app/board/series-review`

Primary frontend:

- `client/src/routes/app/board/series-review.tsx`

Purpose:

- Lets Board members inspect proposal draft content and manuscript materials
  before opening the vote panel.

Behavior:

- Left pane lists submitted series in the Board review queue.
- Right pane shows the selected series summary:
  - proposal title, logline, synopsis, premise, characters, conflict
  - target audience, cadence, owner, genres/tags
  - current manuscript version and status
  - manuscript version history
  - manuscript files
  - supporting materials
- Board can preview or download files.
- Board cannot upload, delete, or edit manuscript files from this view.

Data:

- Queue comes from `useBoardReviewQueue()`.
- Selected series preview comes from `useSeriesSummary(seriesId)`, backed by
  `GET /series/:seriesId/summary`.
- File preview/download uses
  `GET /series/:seriesId/manuscripts/files/:fileAssetId/download`.

Permissions:

- This page is read-only for Board.
- Existing backend series visibility controls determine whether Board can read
  a series summary.

## Voting Panel

Route:

- `/app/board/series/$id/vote`

Primary frontend:

- `client/src/routes/app/board/series/$id.vote.tsx`

Purpose:

- Allows eligible Board users to review evidence, cast votes, and finalize
  Board decisions.

Behavior:

- Loads the series detail and Board queue item.
- Loads `useSeriesSummary(id)` and renders `SeriesPreviewPanel` before the vote
  form.
- Shows proposal draft fields, current manuscript, files, and supporting
  materials before a vote is cast.
- Supports Board vote values:
  - `APPROVE`
  - `REJECT`
  - `NEEDS_REVISION`
- Supports chair finalization and tie-break actions.
- For approval finalization, publication type is limited to:
  - `WEEKLY`
  - `MONTHLY`

Client API/query layer:

- `useCastBoardVote(id)`
- `useFinalizeBoardDecision(id)`
- `useTieBreakBoardDecision(id)`
- `useSeriesSummary(id)`

Backend endpoints:

- `POST /board/series/:seriesId/vote`
- `POST /board/series/:seriesId/finalize-decision`
- `POST /board/series/:seriesId/tie-break`

Post-decision refresh:

- Board vote/finalize mutations invalidate Board queue and series summary data
  so manuscript version/status can refresh after finalization.

## Manuscript Status After Board Vote

Backend behavior:

- Board finalization keeps using the existing manuscript update path that
  updates the latest manuscript after the Board decision.

Frontend behavior:

- Review Workspace and Voting Panel both read manuscript data from
  `/series/:id/summary`.
- Series manuscript page also reads the same summary source, so status/version
  changes become visible after query invalidation/refetch.

## Publishing Schedule

Route:

- `/app/board/publishing-schedule`

Primary frontend:

- `client/src/routes/app/board/publishing-schedule.tsx`

Purpose:

- Lets Board save publishing intent for approved series.

Behavior:

- Lists approved/scheduled Board series from the Board schedule API.
- Uses a real datetime input for publish time.
- Saves:
  - `publicationType`
  - `publishAt`
  - optional `note`
- `SPECIAL` cadence is not supported in this pass.

Backend endpoints:

- `GET /board/publishing-schedule`
- `POST /board/series/:seriesId/publishing-schedule`

Backend validation:

- `publicationType`: `WEEKLY | MONTHLY`
- `publishAt`: ISO datetime
- `note`: optional

## Ranking Analytics

Route:

- `/app/rankings`

Primary frontend:

- `client/src/routes/app/rankings.tsx`
- `client/src/shared/queries/useRankings.ts`

Purpose:

- Provides a SaaS-style ranking analytics view for Board and other permitted
  roles.

Behavior:

- Shows KPI cards:
  - total votes
  - average score
  - risk count
  - finalized count
- Shows charts:
  - trend chart by period
  - top-series bar chart
- Keeps a detailed ranking table.
- Ranking status flow in UI:
  - `DRAFT` can be submitted.
  - only `SUBMITTED` can be finalized.

Backend ranking endpoints used by query layer:

- `GET /rankings`
- `POST /rankings/:rankingId/submit`
- `POST /rankings/:rankingId/finalize`

## Cancellation Cases

Route:

- `/app/board/cancellation-review`

Primary frontend:

- `client/src/routes/app/board/cancellation-review.tsx`
- `client/src/shared/queries/useBoardReview.ts`

Purpose:

- Lets Board review at-risk or cancellation-requested series and record
  continue/warning/cancel/complete decisions.

Behavior:

- Loads real Board cancellation cases.
- Shows latest ranking context, latest decision context, synopsis, status, and
  timestamps.
- Submits at-risk decisions through the existing Board endpoint.
- Shows per-series at-risk decision history.

Backend endpoints:

- `GET /board/cancellation-cases`
- `GET /board/series/:seriesId/at-risk-decisions`
- `POST /board/series/:seriesId/at-risk-decisions`

Decision values:

- `CONTINUE`
- `WARNING`
- `CANCEL`
- `COMPLETE`

## Decision History

Route:

- `/app/board/decision-history`

Primary frontend:

- `client/src/routes/app/board/decision-history.tsx`

Purpose:

- Gives Board users a Board-readable decision ledger separate from admin audit
  logs.

Behavior:

- Calls the real Board decision history endpoint.
- Supports type filtering.
- Merges multiple Board-relevant decision sources into one view.

Backend endpoint:

- `GET /board/decision-history`

Current history sources:

- Board series decisions
- At-risk decision records
- Relevant finalized ranking events when available

## Reader Vote Data

Route:

- `/app/board/reader-votes`

Status:

- Functional page remains unchanged for this pass.
- Multi-series Reader Vote Data import is deferred.
- Do not expand this feature as part of Board review/voting work unless the
  scope explicitly changes.

## Backend Board Module

Primary files:

- `server/src/modules/board/board.routes.ts`
- `server/src/modules/board/board.controller.ts`
- `server/src/modules/board/board.service.ts`
- `server/src/modules/board/board.repository.ts`
- `server/src/modules/board/board.validation.ts`
- `server/src/modules/board/board.model.ts`

Important Board API group:

- `GET /board/queue`
- `POST /board/series/:seriesId/vote`
- `POST /board/series/:seriesId/finalize-decision`
- `POST /board/series/:seriesId/tie-break`
- `GET /board/publishing-schedule`
- `POST /board/series/:seriesId/publishing-schedule`
- `GET /board/cancellation-cases`
- `GET /board/series/:seriesId/at-risk-decisions`
- `POST /board/series/:seriesId/at-risk-decisions`
- `GET /board/decision-history`

## Frontend API And Query Layer

Primary files:

- `client/src/shared/api/board.ts`
- `client/src/shared/queries/useBoardReview.ts`
- `client/src/shared/queries/useRankings.ts`
- `client/src/shared/queries/useSeries.ts`

Notable query keys:

- `["board", "queue"]`
- `["board", "publishing-schedule"]`
- `["board", "cancellation-cases"]`
- `["board", "decision-history", type]`
- `["series", id, "summary"]`

When changing Board decisions, keep invalidation broad enough to refresh:

- Board queue
- Board schedule/history/cancellation cases when relevant
- selected series detail
- selected series summary

## Current Validation Notes

Known passing checks from the Board implementation pass:

- Targeted ESLint on changed Board frontend routes passed.
- `npm run build` in `client` passed.
- Targeted server tests passed:
  - `src/modules/board/board.service.test.ts`
  - `src/modules/ranking/ranking.service.test.ts`

Known unrelated blockers:

- Full server lint currently fails on pre-existing unrelated TypeScript/lint
  issues outside the Board pass.
- Full client lint currently fails on pre-existing repo-wide lint/prettier/no-any
  issues outside the Board pass.

## Developer Notes

- Keep Board screens read-only unless the action is explicitly a Board decision
  action.
- Do not add Board access to general Settings.
- Do not reintroduce the horizontal Board subnav.
- Keep `SPECIAL` publishing cadence out of Board schedule until backend support
  is added.
- Prefer existing shared Board portal primitives before adding a new visual
  abstraction.
- Update `flow/board-flow-analysis-trace.md` when making durable Board flow
  changes.
