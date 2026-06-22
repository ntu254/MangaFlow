# Board Flow Analysis Trace

## 2026-06-22 - Board role flow analysis

Requested Board flow:

Board Login -> Dashboard -> Series Approval -> Voting Sessions -> Publishing Schedule -> Reader Vote Data -> Ranking Board -> Cancellation Review -> Decision History -> Logout.

Current implementation summary:

- Login and Logout use the shared auth/session flow.
- Board Dashboard exists through the shared `/app/dashboard` route and `BoardDash`, but the UI is still mostly mock/entity based.
- Board summary API exists at `GET /api/dashboard/board/summary`.
- Board sidebar currently exposes:
  - Dashboard
  - My Series
  - Board: Series vote
  - Notifications
  - Reader Preview
  - Board voting
  - Rankings
  - Settings
- Board-specific routes currently registered:
  - `/app/board`
  - `/app/board/series-review`
  - `/app/board/series/$id/vote`
- Shared routes relevant to Board:
  - `/app/rankings`
  - `/app/publications`

Flow coverage:

- Dashboard
  - Requested: View pending approvals, open voting sessions, ranking alerts.
  - Current: `BoardDash` shows open ballots, at-risk series, rankings to lock, pending votes from mock entities.
  - Backend: `GET /api/dashboard/board/summary` returns pending Board review count and at-risk review count.
  - Gap: Dashboard UI is not fully wired to the board summary API and does not expose ranking alerts from backend.

- Series Approval
  - Requested: View submitted series, open proposal, review manuscript, vote approve/reject/revision.
  - Current: `/app/board/series-review` lists Board queue from `useBoardReviewQueue`.
  - Current: `/app/board/series/$id/vote` opens a proposal by series id and supports vote actions.
  - Backend: `GET /api/board/queue`, `POST /api/board/series/:seriesId/vote`.
  - Gap: Manuscript review is represented indirectly through series detail/audit context, not a dedicated Board manuscript review panel.

- Voting Sessions
  - Requested: View active voting, submit vote, view result, Board Chair finalizes result.
  - Current: Board review queue shows vote counts, quorum, decision status, and vote summary.
  - Current: Vote page supports cast vote, finalize, and tie-break actions.
  - Backend: `POST /api/board/series/:seriesId/finalize-decision`, `POST /api/board/series/:seriesId/tie-break`.
  - Gap: UI uses a local "I am acting as Board Chair" checkbox; it does not fetch/display actual chair status from board membership.

- Publishing Schedule
  - Requested: View approved series, choose weekly/monthly/special release, confirm schedule.
  - Current: `/app/publications` exists, but it uses mock publication entities.
  - Backend: Publication routes exist, but create/schedule/cancel/publish currently require EDITOR role.
  - Backend Board decision finalize accepts `publicationType` only as `WEEKLY` or `MONTHLY`.
  - Gap: No Board-owned publishing schedule UI and no `SPECIAL` release type in current backend enum.

- Reader Vote Data
  - Requested: Select issue, enter vote data, validate, save, update ranking.
  - Current: `/app/rankings` has a mock "Import CSV" button only.
  - Backend: `POST /api/rankings/import` supports Board ranking import with `period` and entries.
  - Gap: No UI form/import flow wired to ranking import API; no issue selector UI.

- Ranking Board
  - Requested: View ranking, filter by period, compare series, identify risk series.
  - Current: `/app/rankings` displays mock ranking entries and lock button.
  - Backend: `GET /api/rankings`, `POST /api/rankings/:rankingId/submit`, `POST /api/rankings/:rankingId/finalize`, `POST /api/rankings/:rankingId/void`.
  - Gap: Ranking UI is not wired to backend, lacks period filter, comparison, and risk identification workflow.

- Cancellation Review
  - Requested: Open low-ranking series, review performance, vote continue/hold/cancel, finalize decision.
  - Current: Backend has Board at-risk decision support.
  - Backend: `POST /api/board/series/:seriesId/at-risk-decisions` accepts `CONTINUE`, `WARNING`, `CANCEL`, `COMPLETE`.
  - Gap: No dedicated Board cancellation review route/UI; requested `hold` maps closest to current backend `WARNING`.

- Decision History
  - Requested: View past decisions, filter and inspect details.
  - Current: Vote page shows `AuditTimeline` for a series.
  - Gap: No dedicated Board decision history route/list/filter.

Implementation notes:

- The strongest currently connected Board slice is Series Approval/Voting Sessions.
- Ranking and Publishing screens exist visually but are not Board API connected yet.
- Board Chair finalization needs real chair permission/visibility instead of a user-controlled checkbox.
- Publishing Schedule needs product clarification because requested `special release` is not supported by current backend publication type enum.

Recommended next implementation order:

1. Wire Board Dashboard to `GET /api/dashboard/board/summary` and replace mock ballot/ranking counts.
2. Replace `/app/rankings` mock data with Board ranking API queries and add period filter.
3. Add Reader Vote Data import form that posts to `POST /api/rankings/import`.
4. Add Cancellation Review route that lists at-risk series and posts Board at-risk decisions.
5. Add Board Decision History route backed by audit logs or a dedicated Board decisions API.
6. Resolve Publishing Schedule ownership: either keep scheduling under Editor or add Board schedule endpoints and support `SPECIAL`.

Trace status:

- Analysis only; no Board UI behavior changed in this pass.
- This file records current coverage and gaps for implementation planning.

## 2026-06-22 - Board UI implementation pass

Implementation summary:

- Applied the project-local `design-taste-frontend` and `redesign-existing-projects` skills for an internal SaaS dashboard pass.
- Updated Board sidebar IA to match the requested Board flow:
  - Dashboard
  - Series Approval
  - Voting Sessions
  - Publishing Schedule
  - Reader Vote Data
  - Ranking Board
  - Cancellation Review
  - Decision History
  - Settings
- Rebuilt Board Dashboard as an operational control room for pending approvals, open voting sessions, ranking alerts, and at-risk review work.
- Reworked Series Approval to focus on submitted series, proposal review status, quorum, vote summaries, and handoff into voting sessions.
- Added Board Voting Sessions screen for active voting, vote submission navigation, results, and Board Chair finalization visibility.
- Added Board Publishing Schedule screen for approved series and weekly/monthly/special schedule intent.
- Added Reader Vote Data screen for selecting a series, entering reader vote data, validating input, saving, and updating ranking data through the ranking import API when a real backend series id is available.
- Reworked Ranking Board to use ranking API data first, with period filtering, series comparison, risk identification, and finalize action.
- Added Cancellation Review screen for low-ranking/at-risk series with continue, hold, cancel, and finalize decisions.
- Added Decision History screen with filterable Board decision examples while waiting for a dedicated Board-readable decision history endpoint.

API and product notes:

- Ranking Board and Reader Vote Data now use the new ranking API client/query layer.
- Cancellation Review now uses the Board at-risk decision endpoint.
- Publishing Schedule remains partially local because current publication scheduling endpoints are Editor-owned and current Board publication type support only covers weekly/monthly.
- Requested `special release` still needs backend enum/API support before it can be persisted.
- Decision History still needs either Board-readable audit logs or a dedicated Board decisions API to become fully live.
- Board Chair finalization is exposed in the flow, while backend permission remains the source of truth.

Verification:

- Prettier was run on touched frontend files.
- Frontend build was run after route generation and completed successfully.

## 2026-06-22 - Board Decision Portal UI pass

Design read:

- Board is now treated as a Decision Portal instead of a set of separate Board tables.
- The UI language stays aligned with the existing app theme tokens for background, card, border, text, muted text, and primary accent.
- The redesign uses project-local `design-taste-frontend` and `redesign-existing-projects` guidance, but applies only the dashboard/product-UI relevant parts because this is not a marketing page.

Implemented UI structure:

- Sidebar navigation now names the Board role around the portal mental model:
  - Decision Portal
  - Review Workspace
  - Voting Panel
  - Publishing Schedule
  - Reader Vote Data
  - Ranking Analytics
  - Cancellation Cases
  - Decision History
- Added shared Board Decision Portal primitives:
  - Portal shell
  - Top portal navigation
  - Decision timeline
  - Portal cards
  - Metrics
  - Action tiles
  - Pills, notices, and loading rows
- Dashboard tổng quan now presents the Board as a unified control room.
- Review workspace now uses the same portal shell and clearly connects submitted proposals to the vote panel.
- Voting panel for a series now has evidence, quorum metrics, vote form, Chair finalization, vote ledger, and audit timeline in one case layout.
- Ranking analytics now sits inside the Decision Portal shell and keeps period filtering, comparison, risk identification, and finalize actions.
- Cancellation review now behaves like a case page with a case queue and decision panel.
- Decision history now uses the portal shell and decision ledger styling.
- Publishing schedule and Reader Vote Data now share the portal shell so supporting Board screens do not visually drift.

Verification:

- Prettier was run on all touched Board UI files.
- `npm run build` was run inside `client` and completed successfully for client and SSR builds.

## 2026-06-22 - Board Dashboard API-backed implementation trace

Task summary:

- Implemented the requested Board Dashboard/UI and function fix pass, excluding Reader Vote Data multi-series import as agreed.

Scope completed:

- Board navigation and shell:
  - Renamed Board sidebar `/app/dashboard` from `Decision Portal` to `Dashboard`.
  - Removed Board access to `Settings` from the role sidebar.
  - Removed the horizontal Board portal/subnav from the shared Board shell.
  - Updated Board dashboard copy so the role surface is named Dashboard instead of Decision Portal.
- Series preview before vote:
  - Updated the Board vote route to load `seriesApi.getSummary(id)`.
  - Added a pre-vote preview with title, logline, synopsis, premise, characters, conflict, audience, genres/tags, requested cadence, latest manuscript version/status, files, supporting materials, and download/preview actions.
  - Expanded vote/finalize cache invalidation to include series summary and Board queues so manuscript status is refreshed after decisions.
- Manuscript version after vote:
  - Kept the existing backend finalization behavior that updates latest manuscript status.
  - Surfaced latest manuscript version/status in the Board vote preview after cache refresh.
- Publishing schedule:
  - Added Board-readable backend endpoints for listing approved series schedules and saving schedule intent.
  - Saved schedule intent with `publicationType`, `publishAt`, and optional note.
  - Reworked the Board publishing schedule page to use real approved series data, a real `datetime-local` input, and only `WEEKLY | MONTHLY` cadence.
- Ranking analytics:
  - Reworked rankings into a SaaS analytics view with KPI cards, trend chart, top-series bar chart, and detailed table.
  - Added UI support for submitting `DRAFT` rankings.
  - Limited finalize action to `SUBMITTED` rankings to match backend status flow.
- Cancellation review:
  - Added Board APIs for cancellation cases and per-series at-risk decision history.
  - Reworked the cancellation review page to load real cases, show ranking/decision context, and submit decisions through the existing at-risk decision endpoint.
- Decision history:
  - Added a Board-readable decision history endpoint that merges Board decisions, at-risk decisions, and finalized ranking events.
  - Reworked the Decision History page to use the real endpoint with type filtering.

Backend files changed:

- `server/src/modules/board/board.model.ts`
- `server/src/modules/board/board.validation.ts`
- `server/src/modules/board/board.repository.ts`
- `server/src/modules/board/board.service.ts`
- `server/src/modules/board/board.controller.ts`
- `server/src/modules/board/board.routes.ts`
- `server/src/modules/board/board.service.test.ts`

Frontend files changed:

- `client/src/layouts/Sidebar.tsx`
- `client/src/features/board/components/DecisionPortal.tsx`
- `client/src/features/dashboard/components/BoardDash.tsx`
- `client/src/routes/app/board/series/$id.vote.tsx`
- `client/src/routes/app/board/publishing-schedule.tsx`
- `client/src/routes/app/rankings.tsx`
- `client/src/routes/app/board/cancellation-review.tsx`
- `client/src/routes/app/board/decision-history.tsx`
- `client/src/shared/api/board.ts`
- `client/src/shared/queries/useBoardReview.ts`
- `client/src/shared/queries/useRankings.ts`

Validation run:

- Targeted client ESLint on changed frontend files passed with one existing Fast Refresh warning in `DecisionPortal.tsx` because the file exports non-component helpers.
- `npm run build` in `client` passed.
- `npx vitest run src/modules/board/board.service.test.ts src/modules/ranking/ranking.service.test.ts` in `server` passed.
- `git diff --check` passed, with line-ending warnings only.
- `rg` check confirmed visible Board copy no longer uses `Decision Portal` for the requested Dashboard surfaces.

Known validation blockers:

- Full `server npm run lint` is blocked by pre-existing unrelated TypeScript/lint errors in dashboard, series-member, submission command/query, and task target-state modules.
- Full `client npm run lint` is blocked by pre-existing repo-wide lint/prettier/no-explicit-any issues outside this Board pass.
- The harness CLI described by `docs/TRACE_SPEC.md` is not present at `scripts/bin/harness-cli`, so this markdown trace is the durable trace record for this pass.

Deferred:

- Reader Vote Data import for multiple series remains out of scope for this pass by explicit user agreement.

## 2026-06-22 - Board completion validation pass

Completion fix:

- Removed the remaining Board `Settings` item from `BOARD_NAV`.
- Removed `board` from the shared `/app/settings` nav item roles so Board settings access is not reintroduced through shared sidebar filtering.

Validation run:

- Targeted client ESLint on the changed Board/frontend files passed with the same single Fast Refresh warning in `DecisionPortal.tsx`.
- `npm run build` in `client` passed for client and SSR builds.
- `npx vitest run src/modules/board/board.service.test.ts src/modules/ranking/ranking.service.test.ts` in `server` passed: 2 files, 15 tests.
- `git diff --check` passed with Windows line-ending warnings only.
- `git diff -- client/src/routes/app/board/reader-votes.tsx` is empty, confirming Reader Vote Data import work remains deferred.
- `rg` verification found no Board `Settings` entry in Board navigation, no Board `SPECIAL` cadence in target pages, and no remaining visible `Decision Portal` copy in the target client Board surfaces.

## 2026-06-22 - Board Review Workspace manuscript preview pass

Implementation summary:

- Reworked `/app/board/series-review` from a table-only queue into a two-pane Board review workspace.
- Left pane now lets Board select a submitted series and see status, quorum, vote mix, and loaded manuscript version signal.
- Right pane now loads `GET /series/:id/summary` through `useSeriesSummary` and shows proposal draft fields, owner, cadence, genres/tags, current manuscript, manuscript version history, manuscript files, and supporting materials.
- Added read-only preview/download actions for submitted files through the existing manuscript download API.
- Kept Board Review Workspace read-only: no upload, delete, edit, or Mangaka draft mutation actions were added.
- Fixed the Board vote page so `SeriesPreviewPanel` is actually rendered before the vote form and uses `useSeriesSummary(id)` plus the correct `downloadUrl` response.

Validation run:

- Targeted ESLint on `client/src/routes/app/board/series-review.tsx` and `client/src/routes/app/board/series/$id.vote.tsx` passed.
- `npm run build` in `client` passed for client and SSR builds.
- `git diff --check` passed with Windows line-ending warnings only.
- `git diff -- client/src/routes/app/board/reader-votes.tsx` remains empty, so Reader Vote Data import is still deferred.

## 2026-06-22 - Board Review Workspace Mangaka-style restructure pass

Implementation summary:

- Reworked `/app/board/series-review` toward the Mangaka review mental model:
  - left pane: Board series review queue
  - center pane: proposal draft and manuscript evidence package
  - right pane: decision readiness, vote mix, reviewer handoff, and audit timeline
- Kept Board permissions read-only for draft/manuscript evidence.
- Kept vote actions routed to `/app/board/series/:id/vote` instead of adding inline Board decisions to the workspace.
- Added readiness checks for proposal draft, current manuscript, file availability, and vote readiness.
- Added vote mix bars and quorum context beside the evidence so Board members can review before casting/finalizing.

Validation run:

- Targeted ESLint on `client/src/routes/app/board/series-review.tsx` and `client/src/routes/app/board/series/$id.vote.tsx` passed.
- `git diff --check -- client/src/routes/app/board/series-review.tsx` passed with Windows line-ending warning only.
- `git diff -- client/src/routes/app/board/reader-votes.tsx` remains empty.

Known validation blocker:

- `npm run build` in `client` is currently blocked outside Board scope because `client/src/features/series/components/CoverUpload.tsx` imports missing package `react-dropzone`.

## 2026-06-22 - Board preview lint/build fix

Fix summary:

- Rechecked the current Board trace blocker and confirmed `client/package.json` now includes `react-dropzone`.
- Ran the current client build; the previous `react-dropzone` blocker no longer reproduces.
- Fixed targeted Board preview lint issues:
  - formatted `FilePreviewModal.tsx` with Prettier
  - removed `any` casts from Board review workspace file lookup
  - typed Board vote preview file metadata for preview names and MIME types

Validation run:

- Targeted ESLint passed for:
  - `client/src/routes/app/board/series-review.tsx`
  - `client/src/routes/app/board/series/$id.vote.tsx`
  - `client/src/features/board/components/FilePreviewModal.tsx`
- `npm run build` in `client` passed for client and SSR builds.
