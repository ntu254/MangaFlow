# MangaFlow Mobile Agent Context

## Current Scope

MangaFlow Mobile currently supports only the two approved mobile roles:

- Tantou Editor
- Board / Board Chair

Do not add Admin, Mangaka, or Assistant mobile surfaces unless a new story and contract explicitly expand the mobile scope.

## Source Of Truth

Read these before changing mobile:

- `mobile/README.md`
- `docs/business-flows/INDEX.md` and the relevant flow docs, especially `docs/business-flows/02-proposal-lifecycle.md`, `docs/business-flows/04-chapter-workflow.md`, `docs/business-flows/06-board-governance.md`, `docs/business-flows/09-rankings.md`, `docs/business-flows/11-file-management.md`, `docs/business-flows/12-comments.md`
- `backend/src/mobile/mobile-work-item.contract.ts` — the canonical zod contract mirrored by `mobile/src/domain/mobile-work-item.ts`
- `backend/src/routes/mobile.routes.ts`, `backend/src/routes/voting.routes.ts`, `backend/src/routes/series.routes.ts`, `backend/src/routes/studio.routes.ts`, `backend/src/routes/review-file.routes.ts` — the endpoints the mobile data sources call
- Recent implementation plans/specs under `docs/superpowers/plans/` and `docs/superpowers/specs/` for in-flight mobile work

## Mobile Architecture

```txt
mobile/src/app/
  Expo Router entry (index.tsx renders MangaFlowMobileApp; _layout.tsx wires providers).

mobile/src/MangaFlowMobileApp.tsx
  Auth gate (login/session) + AuthenticatedShell, which reads role/designation
  from the authenticated /auth/me identity. No manual role switch.

mobile/src/domain/
  mobile-work-item.ts: zod-validated inbox item contract shared with the backend.
  mobile-notification.ts: zod-validated notification contract (actionUrl is
  deliberately stripped — mobile has no approved destination contract).
  editor-activity.ts: Editor-only "My Editorial Activity" presentation model.
  board-decision-ledger.ts: Board-only "Governance Decision Ledger" model.
  These two mappers are never merged into one business activity model.
  timestamp.ts: shared low-level timestamp formatting only.
  workflow.ts: small shared UI types (Role, Tone, MetricItem, QueueItem,
  SeriesCard, AtRiskDecision) used by mf.tsx and the Board data source.

mobile/src/services/
  mobile-api-client.ts / mobile-api-config.ts / mobile-api-error.ts: typed
  fetch client, base URL resolution, normalized error type.
  mobile-request-diagnostics.ts: normalizes HTTP / network / Zod-contract
  failures into safe support diagnostics (status, backend code, request id,
  category) — never a response body, token, or stack trace.
  mobile-clipboard.ts: optional copy affordance for support details.
  mobile-auth.ts / mobile-auth-storage.ts: login, session restore, refresh-token
  storage in SecureStore.
  mobile-inbox-data-source.ts: GET /editor/inbox | /board/inbox, validated by
  mobileInboxSchema and normalized through MobileRequestError on failure.
  mobile-notification-data-source.ts: GET /notifications and
  POST /notifications/:id/read.
  editor-mobile-data-source.ts: Editor proposal/chapter/comment/publication
  detail reads and canonical action calls.
  board-mobile-data-source.ts: Board session/ranking/decision-history detail
  reads and canonical vote/session/at-risk-decision calls.

mobile/src/hooks/
  use-mobile-inbox.ts plus per-detail hooks (use-editor-proposal,
  use-editor-chapter, use-editor-comments, use-editor-publications,
  use-editor-history, use-board-session, use-board-sessions,
  use-board-rankings, use-board-at-risk, use-mobile-notifications) — each wraps
  a data-source call in React Query and owns its own mutation/invalidation
  wiring.

mobile/src/screens/
  editor-workspace.tsx / board-workspace.tsx: tab router for each role, holding
  local "which detail is open" navigation state.
  *-today-screen.tsx, *-sessions-screen.tsx, *-ranking-screen.tsx,
  *-history-screen.tsx: list screens for each tab.
  notifications-screen.tsx: the fifth tab for both roles, shared by Editor and
  Board because /notifications is already scoped to the authenticated user.
  editor-proposal-detail-screen.tsx, editor-chapter-detail-screen.tsx,
  editor-publish-screen.tsx, board-session-detail-screen.tsx,
  board-session-form-screen.tsx: detail/action screens.

mobile/src/components/
  Shared primitives: mf.tsx (MFHeader/MFButton/MFHero/... design system),
  today-queue.tsx, work-item-card.tsx, workflow-state.tsx,
  workflow-detail-layout.tsx, workflow-action-bar.tsx,
  workflow-confirmation-sheet.tsx, comment-thread.tsx, vote-progress.tsx,
  revote-banner.tsx, readiness-evidence.tsx, at-risk-decision-sheet.tsx,
  publication-confirmation.tsx, submitted-files-panel.tsx,
  review-file-viewer.tsx (role-scoped submitted-file list and short-lived
  preview UI, mounted from the detail screens above).
```

There is no separate mock-data layer anymore. `mobile/src/data/` does not exist;
demo mode (below) is a small inline empty inbox, not a parallel UI.

## Mock/API Boundary

- Live mode is the default and the only mode with real content. There is no
  live-to-mock fallback on request failure — a failed read surfaces a friendly
  error with retry and a collapsed **Support details** disclosure carrying only
  HTTP status, backend code, request id, and failure category.
- Demo mode is explicit and opt-in via `EXPO_PUBLIC_ENABLE_MOBILE_MOCK_FALLBACK=true`.
  It short-circuits the inbox query to a labelled empty inbox
  (`demoInbox` in `MangaFlowMobileApp.tsx`) so the shell never issues a live
  request; it is not a full mock UI layer with reference data. `Sessions`,
  `Ranking`, and `History` tabs render an explicit "Demo mode does not read
  live ..." notice in demo mode rather than any mock content.
- Capabilities (`actions[]` on every inbox item and every detail payload) are
  computed by the backend only. Mobile renders `enabled`/`disabledReason`
  as given and never recomputes eligibility, readiness, tally, ranking, or
  workflow-status transitions client-side.
- Do not implement backend permissions, workflow transitions, readiness
  calculation, ranking formula, payroll, or signed URL access in mobile.
- Review-file metadata is safe to keep in view state, but a display URL is
  obtained lazily (only when a user opens a file), stays only in memory, is
  refreshed 30 seconds before its 900-second lifetime, and is never mocked or
  persisted to AsyncStorage/logs.

## Role Flows

### Tantou Editor (`editor-workspace.tsx`, 5 tabs)

- **Today**: full inbox (`GET /editor/inbox`) — proposal reviews, chapter
  reviews, blocking comments awaiting verification, and publication items.
- **Reviews**: same inbox filtered to `PROPOSAL_REVIEW` and `CHAPTER_REVIEW`.
  - Proposal detail (`editor-proposal-detail-screen.tsx`): claim, request
    changes, reject, forward-to-board (with recommendation + cadence);
    a `SubmittedFilesPanel` lists the current proposal manuscript and
    proposal attachments visible to the assigned Editor.
  - Chapter detail (`editor-chapter-detail-screen.tsx`): readiness evidence,
    blocking comment thread, request-revision, reject, editor-approve; a
    `SubmittedFilesPanel` lists the frozen chapter-review file context and
    visible page/submission attachments.
- **Publish**: inbox filtered to `PUBLICATION` — schedule, postpone, publish
  now, from `editor-publish-screen.tsx`.
- **History — "My Editorial Activity"**: read-only personal activity
  (`GET /dashboard/editor/summary`) mapped through `editor-activity.ts`.
- **Notifications**: fifth tab, `GET /notifications`, unread badge on the tab.
- Proposal detail keeps `savedChecklist` (backend value / last successful save)
  separate from `draftChecklist`. Forward to Board is disabled client-side until
  `savedChecklist` is 6/6; the backend `EDITORIAL_CHECKLIST_INCOMPLETE` guard
  stays authoritative for stale clients and direct API calls.
- Comment lifecycle: `OPEN -> ADDRESSED -> RESOLVED`, with `REOPENED` as a
  manual escape hatch. `COMMENT_RESOLVE`/`COMMENT_REOPEN` act through
  `use-editor-comments.ts`.

### Board / Board Chair (`board-workspace.tsx`, 5 tabs)

- **Today**: full inbox (`GET /board/inbox`) — open `BOARD_VOTE`/`BOARD_REVOTE`
  items, Chair-only `SESSION_FINALIZE` items, and Chair-only `AT_RISK` items.
- **Sessions**: all voting sessions (`GET /voting-sessions`), Chair can create
  a new session for a `PENDING_BOARD` proposal.
  - Session detail (`board-session-detail-screen.tsx`): vote `APPROVE` /
    `REJECT` / `ABSTAIN` against the session's optimistic-concurrency
    `version`; Chair-only close/cancel. A tied round shows the prior round via
    `revote-banner.tsx` and is read-only. A `SubmittedFilesPanel` lists the
    frozen proposal manuscript and proposal attachments only — Board never
    receives Chapter, Page, Task, Submission, or production Material files.
- **Ranking**: imported ranking snapshot (`GET /board/rankings`); Chair can
  open an at-risk decision sheet directly from a ranked row. Rankings and
  at-risk screens expose no proposal or production files.
- **At-risk decision**: manual Chair-only decisions `CONTINUE`, `WARNING`,
  `REQUEST_IMPROVEMENT_PLAN`, `CANCEL` via `at-risk-decision-sheet.tsx`;
  cancellation is never automatic.
- **History — "Governance Decision Ledger"**: immutable decision history
  (`GET /board/decisions/history`) mapped through `board-decision-ledger.ts`,
  annotated with re-vote lineage where applicable. It is an audit record, never
  labelled as a personal activity feed.
- **Notifications**: fifth tab, `GET /notifications`, unread badge on the tab.

### Retired: Editor-in-Chief tie-break voting

Tied sessions no longer resolve through an Editor-in-Chief tie-break vote.
`POST /board/series/:seriesId/decisions/tie-break` and
`POST /voting-sessions/:id/tie-break` both return `410 TIE_BREAK_RETIRED`.
A tied round closes with status `TIED` and the backend opens a fresh re-vote
session automatically; mobile only ever displays this as history/context via
`revote-banner.tsx`, never as an action.

## Vote values

Board vote values are `APPROVE | REJECT | ABSTAIN`
(`BoardVoteValue` in `board-mobile-data-source.ts`). There is no
`NEEDS_REVISION` vote value on mobile — the backend normalizes any legacy
`NEEDS_REVISION` vote payload to `REJECT`.

## Submitted-file review

Board Proposal reviews and assigned Editor Proposal/Chapter reviews list
submitted files via a `SubmittedFilesPanel`/`ReviewFileViewer` pair
(`mobile/src/domain/review-files.ts`, `mobile/src/services/mobile-file-review.ts`).
File metadata never carries a URL; a display URL is requested only when a
user opens a file (`POST /api/files/display-url`), kept only in memory, and
refreshed 30 seconds before its 900-second server lifetime. A `403` clears
the viewer and returns to the review surface; a `404` shows unavailable.
See `docs/business-flows/11-file-management.md` for the full role/context
matrix.

## Forbidden Shortcuts

- Do not imply Admin can override Board.
- Do not imply Board votes on every Chapter.
- Do not let mobile-only checks stand in for backend authorization.
- Do not let Assistant access be inferred from Series membership in any future mobile work.
- Do not store or mock base64 AI output as database content.
- Do not reintroduce a client-side mock data-source layer as a fallback for
  live failures; demo mode must stay explicit, labelled, and empty-by-default.

## Next Story Picker

Choose the next story by the smallest safe boundary:

1. Missing empty/error/detail states inside Editor/Board screens: normal lane.
2. New read-only detail surfaces (e.g. submitted-file review) on top of the
   real detail screens listed above: normal or high-risk depending on
   endpoint and permission surface.
3. Auth, signed URLs, Board decision mutations, readiness publish actions,
   payroll, or Assistant scope: high-risk lane.
4. Adding roles beyond Editor/Board: new product/mobile scope story first.

## Validation

Run after mobile changes:

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA should cover role login (Board and Editor), all four tabs per role,
opening/backing-out of every detail screen, mock decision feedback, no
overflow on mobile width, and no copy that contradicts backend-owned workflow
rules.
