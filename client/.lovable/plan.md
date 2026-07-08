# Plan: Editorial Board Governance UI

Build a governance-focused workspace cho role `board` (sidebar mới, dashboard, queue, proposal decision, rankings, ranking import, at-risk, decisions, notifications). Frontend-first, không động backend/store/state machine.

## 1. Nav & layout guard

- `src/lib/nav.ts` — đổi `board` thành: Dashboard / Board Queue / Rankings / Ranking Import / At-risk Reviews / Decisions / Notifications. Bỏ Studio/Task/Payroll/Series/Publication links.
- `src/routes/app.board.tsx` — thêm `beforeLoad` guard giống editor/assistant: nếu `role` set và không thuộc `{board, admin}` → redirect `/app/dashboard` (giữ admin để admin còn vào sessions). Vẫn `Outlet`.
- `src/routes/app.index.tsx` — board role landing redirect `/app/board/dashboard`.

## 2. Routes mới (dot-separated)

```
src/routes/
  app.board.dashboard.tsx
  app.board.queue.tsx
  app.board.proposals.$proposalId.tsx
  app.board.rankings.index.tsx
  app.board.rankings.import.tsx
  app.board.at-risk.tsx
  app.board.decisions.tsx
  app.board.notifications.tsx
```

Giữ nguyên `app.board.index.tsx`, `app.board.$id.tsx`, `app.board.sessions.*` (admin vẫn dùng). `app.board.index.tsx` chỉnh để board role redirect dashboard, các role khác giữ behaviour cũ.

## 3. Components mới (`src/components/board/`)

Pages: `board-dashboard.tsx`, `board-queue-page.tsx`, `proposal-decision-detail.tsx`, `series-rankings-page.tsx`, `ranking-import-page.tsx`, `at-risk-reviews-page.tsx`, `decision-history-page.tsx`, `board-notifications-page.tsx`.

Building blocks: `voting-panel.tsx`, `vote-progress.tsx`, `decision-effect-preview.tsx`,
`proposal/proposal-summary-card.tsx`, `proposal/creative-materials-readonly.tsx`, `proposal/editor-recommendation-card.tsx`, `proposal/risk-assessment-card.tsx`,
`rankings/ranking-table.tsx`, `rankings/ranking-summary-cards.tsx`, `rankings/ranking-import-preview.tsx`,
`at-risk/at-risk-queue-table.tsx`, `at-risk/performance-snapshot.tsx`, `at-risk/at-risk-decision-panel.tsx`.

Re-use `StatCard`, `EmptyState`, `ProposalStatusPill`, `MaterialsViewer` (read-only mode), `DecisionHistory`, `VoteTally`, `TieBreakPanel`. Không trùng lặp file đã có (`session-*`, `tie-break-panel`).

## 4. Data (frontend-only)

Re-use stores: `useProposals`, `useVotingSessions`, `useNotifications`, `useAudit`. Voting/Finalize/Tie-break chỉ wire khi callback tồn tại (`act("VOTE")`, `tieBreak`, `closeSession`); ngược lại disable kèm tooltip "Chưa hỗ trợ trong MVP".

New mock stores (read-only seeded, không backend):

- `src/lib/stores/rankings.ts` — periods, ranking rows, import jobs.
- `src/lib/stores/at-risk.ts` — at-risk reviews + decisions (frontend mock).
- `src/lib/board-types.ts` — enums + helpers (Risk level, AtRiskDecisionKind, RankingPeriodStatus).
- `src/lib/board-access.ts` — `buildBoardQueue()`, `summarizeVotes()`, `decisionEffect()`, `riskFromRanking()`.

Mock seed nhỏ trong `src/lib/mock/rankings.ts`, `src/lib/mock/at-risk.ts`. Empty state literal Việt theo spec.

## 5. Page specs (ngắn)

- **Dashboard**: StatCards (Pending Review / Needs Finalize / Tie-break / At-risk / Latest Period / Recent Decisions) + Decision Focus list + Pending Votes table (5 rows) + At-risk preview + Latest ranking snippet + Recent Decisions + Notifications mini.
- **Board Queue**: tabs (All/Pending Vote/Voted/Needs Finalize/Tie-break/Approved/Rejected/Needs Revision) + filter cards + table với Vote Progress bar; action "Review/Vote/Finalize" map từ proposal status.
- **Proposal Decision Detail**: layout 2 cột — sidebar Status Card + sticky Voting Panel; main: Summary → Creative Materials (read-only viewer) → Editor Recommendation → Market Fit → Risk Assessment → Vote Progress → Decision Effect Preview → Version History (DecisionHistory). Reject/Needs Revision bắt buộc comment.
- **Voting Panel**: APPROVE/REJECT/NEEDS_REVISION (+ ABSTAIN nếu enum hỗ trợ). Hidden khi user không phải board, disable nếu `checkAction("VOTE")` fail; show "Bạn đã vote: …" nếu existing; Finalize nút riêng cho EiC/admin với DecisionEffectPreview.
- **Rankings**: period selector + 6 summary cards + bảng dense (Rank/Prev/Series/Score/Votes/Views/Completion/Trend/Risk). Trend arrow + risk pill.
- **Ranking Import**: form Period + Issue + CSV upload (parse client-side) + manual table; preview + validation; nút Submit/Finalize disable với tooltip MVP.
- **At-risk Reviews**: risk queue table + drawer với Performance Snapshot + Decision Panel (CONTINUE/WARNING/CANCEL/COMPLETE, CHANGE_FORMAT/HIATUS disabled tooltip). Reason required khi WARNING/CANCEL.
- **Decision History**: filters (type/series/date) + table + drawer chi tiết, đọc từ proposal history + at-risk store + voting sessions outcomes.
- **Notifications**: filter governance kinds (PROPOSAL_READY / VOTE_DEADLINE / TIE_BREAK / RANKING_FINALIZED / AT_RISK_FLAGGED / AT_RISK_DECIDED / PUBLICATION_STRATEGY) từ `useNotifications`.

## 6. UI rules

- SaaS clean, Vietnamese copy + English status enum.
- Dùng `StatCard` đồng nhất (giống Editor/Assistant).
- Status pills/decision badges; vote progress bar 3 màu (approve emerald / reject rose / revision amber).
- Highlight tie-break (fuchsia outline), at-risk (amber/rose).
- Mọi action không có callback → button disabled + Tooltip "Chưa hỗ trợ trong MVP".
- Không expose Studio/Task/Payroll/Admin links cho board.

## 7. Verify

- `bunx tsgo --noEmit` xanh.
- Manual: switch role board → sidebar 7 mục; mở từng route; cast vote nếu callback OK; confirm các nút unsupported disabled.

## Out of scope

Backend, DB, migration, proposal/voting/ranking state machine, audit pipeline, real CSV import API, admin user mgmt, edge functions.
