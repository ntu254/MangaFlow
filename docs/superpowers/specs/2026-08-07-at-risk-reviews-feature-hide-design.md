# Hide At-risk Reviews Feature From UI

## Goal

Remove every UI entry point into the Board "At-risk Reviews" feature
(`/app/board/at-risk`) — the nav link, the route itself, and the dashboard
widgets that surface it — without touching the backend, the underlying
ranking/decision data, or any other place in the UI that shows a generic
"risk" badge (e.g. the full rankings table, series overview). This is a
frontend-only visibility change, fully reversible by re-adding the nav entry
and route component.

## Current contract and selected approach

Three UI surfaces currently expose the feature:

1. **Navigation menu** — `frontend/src/shared/config/navigation.ts:49`:
   `{ to: "/app/board/at-risk", label: "At-risk Reviews", group: "Governance" }`
   in the Board nav group.
2. **Route** — `frontend/src/routes/app.board.at-risk.tsx` renders
   `AtRiskReviewsPage` at `/app/board/at-risk`.
3. **Board dashboard** — `frontend/src/features/board/dashboard/components/board-dashboard.tsx`:
   an "At-risk" `StatCard` (lines 46-51) and an "At-risk preview" `PageSection`
   (lines 108-131) that lists flagged series and links to
   `/app/board/at-risk`.

Approach: keep the feature's source code intact (`features/board/at-risk/**`,
`entities/board/model/board-types.ts`, the API hooks) so it can be
re-enabled later with a single revert — only remove the entry points:

- Delete the nav item from `navigation.ts` so it no longer appears in the
  Board sidebar.
- Change the route to redirect to `/app/board/dashboard` instead of
  rendering `AtRiskReviewsPage`, so a direct/bookmarked visit to
  `/app/board/at-risk` no longer shows the page.
- Remove the "At-risk" `StatCard` and "At-risk preview" `PageSection` from
  `BoardDashboard`, since both exist only to surface/link into the
  now-hidden page. Rebalance the dashboard grid (stat cards go from 4 to 3
  columns worth of content; the "Recent sessions" section keeps its own
  column).

Explicitly out of scope (per user instruction — "chỉ ẩn ... không động BE",
only hide, don't touch backend):

- `backend/**` — no route, controller, service, or schema changes.
- The generic `RiskLevel`/"risk" badges shown elsewhere (`RankingTable`,
  series overview, chapter KPI strip, rankings pages) — those are a
  different, still-visible surface and are not part of this change.
- `board-queue-page.tsx` / `board-voting-queue-page.tsx`, which already
  filter `AT_RISK` items **out** of the normal proposal queue (unrelated
  existing behavior, not a new at-risk surface).
- Board notification types `AT_RISK_FLAGGED` / `AT_RISK_DECIDED` in
  `board-notifications-page.tsx` — a separate event-feed surface, not part
  of the At-risk Reviews page itself.
- Deleting `features/board/at-risk/**` component/model files, the
  `AtRiskDecisionKind`/`AtRiskReview` types, or the `useAtRiskDecisionMutation`
  hook — kept in place, just unreached, so this stays a reversible UI-only
  change and nothing else in the app that imports these types breaks.

## Data flow

```text
Before:
  Board nav "At-risk Reviews" -> /app/board/at-risk -> AtRiskReviewsPage
  BoardDashboard "At-risk preview" -> /app/board/at-risk -> AtRiskReviewsPage

After:
  Board nav: no "At-risk Reviews" entry
  /app/board/at-risk -> redirect -> /app/board/dashboard
  BoardDashboard: no "At-risk" stat card, no "At-risk preview" section
```

No API calls change; `useRankingsListQuery`, `useBoardQueueQuery`, and
`useAtRiskDecisionMutation` are simply no longer invoked from the removed UI.

## Testing

No backend or business-logic change, so no new unit tests. Verification is:

1. `npm run lint` and `npm run typecheck` in `frontend/` pass.
2. Manual check in the browser preview:
   - Board sidebar no longer lists "At-risk Reviews" under Governance.
   - Navigating directly to `/app/board/at-risk` redirects to
     `/app/board/dashboard` instead of rendering the page.
   - `BoardDashboard` no longer shows the "At-risk" stat card or "At-risk
     preview" panel; the remaining stat cards and "Recent sessions" section
     still render correctly.
   - Risk badges on the rankings/series pages (unrelated surfaces) are
     unaffected.

## Non-goals

- No backend change of any kind.
- No deletion of at-risk feature source files, types, or hooks.
- No change to risk badges/pills shown outside the At-risk Reviews page.
- No change to board notification types or the proposal-queue at-risk
  filter.
