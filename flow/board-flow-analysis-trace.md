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
