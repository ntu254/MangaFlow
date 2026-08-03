# Mobile Board Core Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Queue-first Board mobile experience for voting, Chair session governance, fresh re-votes, manual at-risk decisions, ranking, and immutable decision history.

**Architecture:** Extend the Board inbox/detail projection from canonical `VotingSession`, vote, ranking, and decision records. Board members cast votes against the active snapshotted session; Board Chair actions delegate to canonical governance services. A tied close creates an immutable `TIED` round and linked empty `OPEN` re-vote on the backend; mobile only renders that lineage. At-risk decisions move behind a validated domain service instead of direct controller persistence.

**Tech Stack:** Expo SDK 56, React Native, TypeScript, Zod, TanStack Query v5, Jest Expo, React Native Testing Library, Express, Mongoose, MongoDB transactions, Vitest, Supertest.

## Global Constraints

- This plan starts only after the foundation and Editor plans pass.
- VotingSession is the source of truth for electorate, quorum, proposal snapshot, votes, status, and version.
- Mobile sends `expectedVersion` for vote, patch, close, cancel, and finalize operations where the endpoint supports it.
- Board members see vote actions; only `isChair=true` users see Chair actions.
- Closing a tied round creates a fresh empty `OPEN` re-vote linked by `reVoteOfSessionId`.
- Special tie-break behavior is retired; ties automatically create a fresh Board re-vote session.
- Historical `TIE_BREAK_REQUIRED` records are read-only compatibility data.
- No votes are copied from a tied round to its re-vote.
- At-risk cancellation is always a manual Chair decision.
- Ranking import remains web-only; mobile ranking is read-only.
- Mobile never calculates quorum, tally, result, `canFinalize`, or ranking score.
- Preserve unrelated dirty files.

## File Structure

### Backend

- Modify `backend/src/services/mobile-inbox.service.ts`: Board vote, finalization, re-vote, and at-risk work items.
- Create `backend/src/services/mobile-board-detail.service.ts`: actor-aware session/ranking detail projection.
- Create `backend/src/services/at-risk-decision.service.ts`: validated auditable decision command.
- Modify `backend/src/controllers/mobile.controller.ts`: delegate Board mobile aliases to canonical services.
- Modify `backend/src/routes/mobile.routes.ts`: Board detail reads only.
- Reuse `backend/src/controllers/voting.controller.ts` and `backend/src/services/proposal-governance.service.ts` for canonical session commands.
- Create `backend/src/__tests__/mobile-board-workflows.test.ts`.
- Create `backend/src/__tests__/at-risk-decision.service.test.ts`.

### Mobile

- Create `mobile/src/services/board-mobile-data-source.ts`.
- Create `mobile/src/hooks/use-board-session.ts`.
- Create `mobile/src/hooks/use-board-at-risk.ts`.
- Create `mobile/src/hooks/use-board-rankings.ts`.
- Create `mobile/src/screens/board-sessions-screen.tsx`.
- Create `mobile/src/screens/board-session-detail-screen.tsx`.
- Create `mobile/src/screens/board-session-form-screen.tsx`.
- Create `mobile/src/screens/board-ranking-screen.tsx`.
- Create `mobile/src/screens/board-history-screen.tsx`.
- Create `mobile/src/components/vote-progress.tsx`.
- Create `mobile/src/components/revote-banner.tsx`.
- Create `mobile/src/components/at-risk-decision-sheet.tsx`.
- Modify `mobile/src/screens/board-today-screen.tsx`.
- Modify `mobile/src/MangaFlowMobileApp.tsx`.
- Retire obsolete Board branches from `mobile/src/hooks/use-board-mobile-flow.ts`, `mobile/src/screens/board-screens.tsx`, and `mobile/src/screens/board-action-panels.tsx` after replacement coverage passes.

---

### Task 1: Complete the actor-aware Board inbox and session detail contract

**Files:**

- Modify: `backend/src/services/mobile-inbox.service.ts`
- Create: `backend/src/services/mobile-board-detail.service.ts`
- Modify: `backend/src/controllers/mobile.controller.ts`
- Modify: `backend/src/routes/mobile.routes.ts`
- Create: `backend/src/__tests__/mobile-board-workflows.test.ts`

**Interfaces:**

- Consumes: `boardQueue()`, `VotingSessionModel`, `ProposalVoteModel`, `BoardDecisionModel`, `RankingModel`, canonical tally values, and actor `isChair`.
- Produces: complete `GET /api/board/inbox`, `GET /api/board/sessions/:id/detail`, and `GET /api/board/at-risk/:rankingId/detail`.

- [ ] **Step 1: Write failing capability and lineage tests**

```ts
it("returns a member vote capability from the active session snapshot", async () => {
  const member = await loginAs("board.member@mangaflow.local");
  const response = await request(createApp())
    .get("/api/board/inbox")
    .set("Authorization", `Bearer ${member.accessToken}`)
    .expect(200);

  const vote = response.body.data.items.find((item: any) => item.kind === "BOARD_VOTE");
  expect(vote.version).toEqual(expect.any(Number));
  expect(vote.actions).toContainEqual(expect.objectContaining({
    action: "VOTE",
    enabled: true,
  }));
  expect(vote.summary.quorum).toEqual(expect.any(Number));
  expect(vote.summary.canFinalize).toEqual(expect.any(Boolean));
});

it("shows finalize only to the Chair when the backend says canFinalize", async () => {
  const chair = await loginAs("board@beachread.jp");
  const response = await request(createApp())
    .get("/api/board/inbox")
    .set("Authorization", `Bearer ${chair.accessToken}`)
    .expect(200);
  expect(response.body.data.items.flatMap((item: any) => item.actions))
    .toContainEqual(expect.objectContaining({ action: "SESSION_FINALIZE", enabled: true }));
});

it("links a fresh re-vote to immutable tied history", async () => {
  const detail = await getFreshReVoteDetail();
  expect(detail.session).toMatchObject({ status: "OPEN", reVoteOfSessionId: expect.any(String) });
  expect(detail.previousRound).toMatchObject({ status: "TIED" });
  expect(detail.currentUserVote).toBeNull();
});
```

- [ ] **Step 2: Run and verify red**

```powershell
cd backend
npx vitest run src/__tests__/mobile-board-workflows.test.ts
```

- [ ] **Step 3: Implement Board item builders**

Add:

```ts
function boardVoteWorkItem(actor: RequestActor, session: any, proposal: any, tally: any): MobileWorkItem;
function sessionFinalizeWorkItem(actor: RequestActor, session: any, result: any): MobileWorkItem;
function boardReVoteWorkItem(actor: RequestActor, session: any, prior: any, tally: any): MobileWorkItem;
function atRiskWorkItem(actor: RequestActor, ranking: any): MobileWorkItem;
```

The service reads `canFinalize`, quorum, tally, and lineage from canonical backend results. It does not recompute them differently from `proposal-governance.service.ts`.

- [ ] **Step 4: Implement Board session detail projection**

Return:

```ts
type MobileBoardSessionDetail = {
  session: VotingSessionSummary;
  proposal: ProposalVersionSummary;
  tally: BoardTally;
  currentUserVote: BoardVoteValue | null;
  previousRound: VotingSessionSummary | null;
  actions: MobileWorkflowActionDescriptor[];
  notes: SessionNoteSummary[];
};
```

For a fresh re-vote, `currentUserVote` comes only from the new session.

- [ ] **Step 5: Add routes with exact roles**

```ts
router.get("/board/sessions/:sessionId/detail", requireExactRole("BOARD"), boardSessionDetail);
router.get("/board/at-risk/:rankingId/detail", requireExactRole("BOARD"), boardAtRiskDetail);
```

- [ ] **Step 6: Run focused backend tests**

```powershell
npx vitest run src/__tests__/mobile-board-workflows.test.ts src/__tests__/board.test.ts src/__tests__/p0-workflow-refactor.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add backend/src/services/mobile-inbox.service.ts backend/src/services/mobile-board-detail.service.ts backend/src/controllers/mobile.controller.ts backend/src/routes/mobile.routes.ts backend/src/__tests__/mobile-board-workflows.test.ts
git commit -m "feat: project Board mobile workflow inbox"
```

### Task 2: Implement Board session detail and voting

**Files:**

- Create: `mobile/src/services/board-mobile-data-source.ts`
- Create: `mobile/src/hooks/use-board-session.ts`
- Create: `mobile/src/components/vote-progress.tsx`
- Create: `mobile/src/components/revote-banner.tsx`
- Create: `mobile/src/screens/board-sessions-screen.tsx`
- Create: `mobile/src/screens/board-session-detail-screen.tsx`
- Modify: `mobile/src/screens/board-today-screen.tsx`
- Create: `mobile/src/__tests__/board-vote-flow.test.tsx`

**Interfaces:**

- Consumes: Board session detail, `/board/series/:seriesId/votes`, and `expectedVersion`.
- Produces: session list/detail, `useBoardSession(sessionId)`, and confirmed Board vote mutations.

- [ ] **Step 1: Write failing vote and re-vote tests**

```tsx
it("sends the active session id and expected version", async () => {
  renderBoardSession(openSessionDetail);
  fireEvent.press(screen.getByRole("button", { name: "Approve" }));
  fireEvent.press(screen.getByRole("button", { name: "Confirm approve" }));
  await waitFor(() => expect(mockVote).toHaveBeenCalledWith(expect.objectContaining({
    sessionId: openSessionDetail.session.id,
    expectedVersion: openSessionDetail.session.version,
    value: "APPROVE",
  })));
});

it("labels a fresh re-vote and does not reuse the prior vote", () => {
  renderBoardSession(freshReVoteDetail);
  expect(screen.getByText("Fresh re-vote is open")).toBeVisible();
  expect(screen.getByText(/prior round ended in a tie/i)).toBeVisible();
  expect(screen.getByText("You have not voted in this round.")).toBeVisible();
});
```

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/board-vote-flow.test.tsx
```

- [ ] **Step 3: Implement typed Board queries and mutation**

```ts
getBoardSessionDetail(sessionId: string): Promise<MobileBoardSessionDetail>;
castBoardVote(input: {
  seriesId: string;
  sessionId: string;
  expectedVersion: number;
  value: "APPROVE" | "REJECT" | "NEEDS_REVISION";
  note?: string;
}): Promise<void>;
```

The mutation does not calculate result or finalization eligibility. On success invalidate Board inbox, session detail, proposal summary, and history.

- [ ] **Step 4: Build session evidence and vote UI**

Render proposal snapshot/version, Editor recommendation, cadence, session close time, backend quorum/tally, current-user vote, notes, and re-vote lineage. The confirmation states that the action records one vote and does not finalize the proposal.

- [ ] **Step 5: Handle stale versions**

On `409`, keep note/input, show “This voting round changed,” refresh detail, and require a new confirmation against the new version.

- [ ] **Step 6: Run focused verification**

```powershell
npm test -- --runInBand src/__tests__/board-vote-flow.test.tsx
npm run lint
npm run build
```

- [ ] **Step 7: Commit**

```powershell
git add mobile/src/services/board-mobile-data-source.ts mobile/src/hooks/use-board-session.ts mobile/src/components/vote-progress.tsx mobile/src/components/revote-banner.tsx mobile/src/screens/board-sessions-screen.tsx mobile/src/screens/board-session-detail-screen.tsx mobile/src/screens/board-today-screen.tsx mobile/src/__tests__/board-vote-flow.test.tsx
git commit -m "feat: add Board session voting on mobile"
```

### Task 3: Implement Board Chair session creation and lifecycle actions

**Files:**

- Modify: `mobile/src/services/board-mobile-data-source.ts`
- Modify: `mobile/src/hooks/use-board-session.ts`
- Create: `mobile/src/screens/board-session-form-screen.tsx`
- Create: `mobile/src/components/session-confirmation.tsx`
- Create: `mobile/src/__tests__/board-chair-session-flow.test.tsx`
- Extend: `backend/src/__tests__/mobile-board-workflows.test.ts`

**Interfaces:**

- Consumes: canonical `/voting-sessions` create/patch/close/cancel routes and mobile finalize alias delegating to `closeVotingSession`.
- Produces: Chair-only create, update, close, cancel, and finalize UI.

- [ ] **Step 1: Add failing backend capability tests**

```ts
it("does not expose Chair descriptors to an ordinary member", async () => {
  const inbox = await boardInboxAs("board.member@mangaflow.local");
  expect(inbox.items.flatMap((item: any) => item.actions)
    .some((item: any) => item.action.startsWith("SESSION_"))).toBe(false);
});

it("exposes finalize only from the backend canFinalize result", async () => {
  const item = await chairFinalizableItem();
  expect(item.actions.find((action: any) => action.action === "SESSION_FINALIZE"))
    .toMatchObject({ enabled: true, requiresConfirmation: true });
});
```

- [ ] **Step 2: Add failing Chair UI tests**

```tsx
it("hides session management for a non-Chair", () => {
  renderBoardApp({ user: boardMember });
  expect(screen.queryByRole("button", { name: "Create session" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Finalize decision" })).toBeNull();
});

it("keeps close and finalize effects distinct", () => {
  renderBoardSession(chairSessionDetail);
  fireEvent.press(screen.getByRole("button", { name: "Close voting" }));
  expect(screen.getByText(/may finalize, create a re-vote, or report no quorum/i)).toBeVisible();
  expect(screen.queryByText(/activate the series now/i)).toBeNull();
});
```

- [ ] **Step 3: Run red tests**

```powershell
cd backend
npx vitest run src/__tests__/mobile-board-workflows.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/board-chair-session-flow.test.tsx
```

- [ ] **Step 4: Implement Chair session form**

Create accepts one eligible proposal and supported canonical fields:

```ts
type CreateSessionInput = {
  proposalId: string;
  title: string;
  scheduledFor?: string;
  closesAt: string;
};
```

Do not accept client-supplied electorate, quorum, proposal version, or status.

- [ ] **Step 5: Implement lifecycle confirmations**

- Close: explain backend-owned result including no quorum or re-vote.
- Cancel: require reason and explain proposal returns to `PENDING_BOARD`.
- Finalize: require `canFinalize` descriptor and current expected version.
- Patch: send only canonical mutable metadata.

- [ ] **Step 6: Run focused verification**

```powershell
cd backend
npx vitest run src/__tests__/mobile-board-workflows.test.ts src/__tests__/board.test.ts src/__tests__/voting-cancel.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/board-chair-session-flow.test.tsx
npm run lint
```

- [ ] **Step 7: Commit**

```powershell
git add backend/src/__tests__/mobile-board-workflows.test.ts mobile/src/services/board-mobile-data-source.ts mobile/src/hooks/use-board-session.ts mobile/src/screens/board-session-form-screen.tsx mobile/src/components/session-confirmation.tsx mobile/src/__tests__/board-chair-session-flow.test.tsx
git commit -m "feat: add Board Chair session controls on mobile"
```

### Task 4: Harden and render the fresh re-vote workflow

**Files:**

- Modify: `backend/src/controllers/mobile.controller.ts`
- Modify: `backend/src/routes/mobile.routes.ts`
- Modify: `mobile/src/services/board-mobile-data-source.ts`
- Modify: `mobile/src/components/revote-banner.tsx`
- Modify: `mobile/src/screens/board-session-detail-screen.tsx`
- Create: `mobile/src/__tests__/board-revote-flow.test.tsx`
- Extend: `backend/src/__tests__/mobile-board-workflows.test.ts`

**Interfaces:**

- Consumes: canonical `TIED` + fresh `OPEN` behavior and `reVoteOfSessionId`.
- Produces: no active tie-break alias, visible re-vote lineage, and ordinary vote submission into the fresh round.

- [ ] **Step 1: Write regression tests that prohibit active tie-break**

Backend:

```ts
await request(createApp())
  .post(`/api/board/series/${proposalId}/decisions/tie-break`)
  .set("Authorization", `Bearer ${editor.accessToken}`)
  .send({ value: "APPROVE" })
  .expect(410)
  .expect((response) => expect(response.body.code).toBe("TIE_BREAK_RETIRED"));
```

Mobile:

```tsx
it("never renders a tie-break action for current flows", () => {
  renderBoardSession(freshReVoteDetail);
  expect(screen.queryByRole("button", { name: /tie-break/i })).toBeNull();
  expect(screen.getByRole("button", { name: "Approve" })).toBeVisible();
});
```

- [ ] **Step 2: Run red tests**

```powershell
cd backend
npx vitest run src/__tests__/mobile-board-workflows.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/board-revote-flow.test.tsx
```

- [ ] **Step 3: Retire the mobile tie-break mutation path**

Delete `tieBreakBoardDecision` from mobile data-source interfaces and UI hooks. Keep the backend compatibility route returning `410`; do not redirect it to vote.

- [ ] **Step 4: Complete lineage presentation**

Fresh round banner includes the prior session ID/status, same proposal version, and explicit “votes start at zero” copy. Legacy `TIE_BREAK_REQUIRED` detail is read-only and labeled historical.

- [ ] **Step 5: Verify repeated ties**

```powershell
cd backend
npx vitest run src/__tests__/p0-workflow-refactor.test.ts src/__tests__/board.test.ts src/__tests__/mobile-board-workflows.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/board-revote-flow.test.tsx
```

- [ ] **Step 6: Commit**

```powershell
git add backend/src/controllers/mobile.controller.ts backend/src/routes/mobile.routes.ts backend/src/__tests__/mobile-board-workflows.test.ts mobile/src/services/board-mobile-data-source.ts mobile/src/components/revote-banner.tsx mobile/src/screens/board-session-detail-screen.tsx mobile/src/__tests__/board-revote-flow.test.tsx
git commit -m "fix: align mobile Board ties with fresh re-votes"
```

### Task 5: Move at-risk decisions behind a validated domain service

**Files:**

- Create: `backend/src/services/at-risk-decision.service.ts`
- Modify: `backend/src/controllers/mobile.controller.ts`
- Create: `backend/src/__tests__/at-risk-decision.service.test.ts`
- Modify: `mobile/src/domain/workflow.ts`
- Modify: `mobile/src/services/board-mobile-data-source.ts`
- Create: `mobile/src/hooks/use-board-at-risk.ts`
- Create: `mobile/src/components/at-risk-decision-sheet.tsx`
- Create: `mobile/src/__tests__/board-at-risk-flow.test.tsx`

**Interfaces:**

- Consumes: at-risk `RankingModel`, Board Chair actor, audit/outbox notification services.
- Produces: `recordAtRiskDecision(req, seriesId, input)` and the exact decision union `CONTINUE | WARNING | REQUEST_IMPROVEMENT_PLAN | CANCEL`.

- [ ] **Step 1: Write failing backend validation tests**

```ts
it.each(["CONTINUE", "WARNING", "REQUEST_IMPROVEMENT_PLAN", "CANCEL"])(
  "records supported decision %s",
  async (decision) => {
    const result = await recordAtRiskDecision(chairRequest(), seriesId, {
      rankingId,
      decision,
      note: "Board review completed.",
    });
    expect(result.decision).toBe(decision);
  },
);

it("rejects COMPLETE and arbitrary values", async () => {
  await expect(recordAtRiskDecision(chairRequest(), seriesId, {
    rankingId,
    decision: "COMPLETE" as any,
  })).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
});

it("requires a non-empty note for CANCEL", async () => {
  await expect(recordAtRiskDecision(chairRequest(), seriesId, {
    rankingId,
    decision: "CANCEL",
  })).rejects.toMatchObject({ status: 400, code: "REASON_REQUIRED" });
});
```

- [ ] **Step 2: Write failing mobile confirmation tests**

```tsx
it("requires a reason before manual cancellation", () => {
  renderAtRiskDecision(atRiskFixture);
  fireEvent.press(screen.getByRole("button", { name: "Cancel series" }));
  fireEvent.press(screen.getByRole("button", { name: "Confirm cancellation" }));
  expect(screen.getByText("Reason is required.")).toBeVisible();
  expect(mockDecide).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run red tests**

```powershell
cd backend
npx vitest run src/__tests__/at-risk-decision.service.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/board-at-risk-flow.test.tsx
```

- [ ] **Step 4: Implement and delegate to the service**

Move ranking lookup, at-risk guard, persistence, audit, and notifications out of `mobile.controller.ts`. Controller validates only route/body shape and calls the service. Include `decidedBy`, timestamp, decision, and note in metadata.

- [ ] **Step 5: Implement Board at-risk UI**

Show ranking evidence and backend reason. Decisions use exact labels. `CANCEL` uses destructive styling and explicit non-automatic language. No action is shown to a non-Chair.

- [ ] **Step 6: Run focused verification**

```powershell
cd backend
npx vitest run src/__tests__/at-risk-decision.service.test.ts src/__tests__/mobile-board-workflows.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/board-at-risk-flow.test.tsx
npm run lint
```

- [ ] **Step 7: Commit**

```powershell
git add backend/src/services/at-risk-decision.service.ts backend/src/controllers/mobile.controller.ts backend/src/__tests__/at-risk-decision.service.test.ts mobile/src/domain/workflow.ts mobile/src/services/board-mobile-data-source.ts mobile/src/hooks/use-board-at-risk.ts mobile/src/components/at-risk-decision-sheet.tsx mobile/src/__tests__/board-at-risk-flow.test.tsx
git commit -m "feat: validate Board at-risk decisions"
```

### Task 6: Implement read-only ranking and immutable decision history

**Files:**

- Modify: `mobile/src/services/board-mobile-data-source.ts`
- Create: `mobile/src/hooks/use-board-rankings.ts`
- Create: `mobile/src/screens/board-ranking-screen.tsx`
- Create: `mobile/src/screens/board-history-screen.tsx`
- Create: `mobile/src/__tests__/board-ranking-history.test.tsx`

**Interfaces:**

- Consumes: `GET /api/rankings` and `GET /api/board/decisions/history`.
- Produces: read-only ranking/detail insight and immutable history screens.

- [ ] **Step 1: Write failing read-only tests**

```tsx
it("shows backend ranking values without import or formula controls", async () => {
  renderBoardRanking();
  expect(await screen.findByText("Reader score 6.4")).toBeVisible();
  expect(screen.queryByRole("button", { name: /import/i })).toBeNull();
  expect(screen.queryByText(/recalculate/i)).toBeNull();
});

it("renders decision history without mutation controls", async () => {
  renderBoardHistory();
  expect(await screen.findByText("APPROVED")).toBeVisible();
  expect(screen.queryByRole("button", { name: /edit|delete/i })).toBeNull();
});
```

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/board-ranking-history.test.tsx
```

- [ ] **Step 3: Implement typed read queries**

Parse ranking and history payloads with Zod. Display server values and source timestamps. Do not duplicate the ranking formula.

- [ ] **Step 4: Implement screens**

Ranking supports presentation-only search/filter and at-risk navigation. History groups immutable entries by date/session and displays re-vote lineage where present.

- [ ] **Step 5: Run focused verification**

```powershell
npm test -- --runInBand src/__tests__/board-ranking-history.test.tsx
npm run lint
npm run build
```

- [ ] **Step 6: Commit**

```powershell
git add mobile/src/services/board-mobile-data-source.ts mobile/src/hooks/use-board-rankings.ts mobile/src/screens/board-ranking-screen.tsx mobile/src/screens/board-history-screen.tsx mobile/src/__tests__/board-ranking-history.test.tsx
git commit -m "feat: add Board ranking and decision history"
```

### Task 7: Complete Board navigation, remove obsolete branches, and verify critical paths

**Files:**

- Modify: `mobile/src/MangaFlowMobileApp.tsx`
- Modify: `mobile/src/screens/board-today-screen.tsx`
- Delete after replacement: `mobile/src/hooks/use-board-mobile-flow.ts`
- Delete after replacement: obsolete exports in `mobile/src/screens/board-screens.tsx`
- Delete after replacement: obsolete exports in `mobile/src/screens/board-action-panels.tsx`
- Modify: `mobile/src/__tests__/mobile-data.test.mjs`
- Create: `mobile/src/__tests__/board-navigation.test.tsx`
- Create: `frontend/tests/live/mobile-editor-board-core.spec.ts`
- Modify: `mobile/README.md`

**Interfaces:**

- Consumes: all completed Board screens and approved mobile shell.
- Produces: exact tabs `Today`, `Sessions`, `Ranking`, `History`, no tie-break action, and end-to-end coverage through Expo web against the real backend.

- [ ] **Step 1: Write failing navigation tests**

```tsx
it("renders the approved Board tabs and no tie-break destination", () => {
  renderBoardApp({ user: boardChair });
  for (const tab of ["Today", "Sessions", "Ranking", "History"]) {
    expect(screen.getByRole("button", { name: tab })).toBeVisible();
  }
  expect(screen.queryByRole("button", { name: /tie-break/i })).toBeNull();
  expect(screen.queryByRole("button", { name: /profile tab/i })).toBeNull();
});
```

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/board-navigation.test.tsx
```

- [ ] **Step 3: Wire Board navigation and avatar profile**

Use exact four tabs. Chair designation appears in the header/avatar menu. Session create/manage controls are capability-driven inside Sessions, not a separate tab.

- [ ] **Step 4: Remove obsolete Board implementation**

Delete live imports of `startTieBreakVote`, `tieBreakBoardDecision`, and old mock/fallback Board state. Keep reusable panel primitives only if new screens import them.

- [ ] **Step 5: Add live Expo-web E2E paths**

The Playwright spec starts from `http://localhost:8081` and covers:

```ts
test("Board member votes in an open session", async ({ page }) => {
  await loginMobile(page, "board.member@mangaflow.local");
  await page.getByRole("button", { name: "Sessions" }).click();
  await page.getByRole("button", { name: /Open .* session/i }).first().click();
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Confirm approve" }).click();
  await expect(page.getByText("Vote recorded")).toBeVisible();
});

test("fresh re-vote has zero copied current-user vote", async ({ page }) => {
  await openSeededFreshReVote(page);
  await expect(page.getByText("Fresh re-vote is open")).toBeVisible();
  await expect(page.getByText("You have not voted in this round.")).toBeVisible();
});
```

Add Editor proposal/chapter smoke paths to the same file so the final plan verifies both roles together.

- [ ] **Step 6: Run complete verification**

```powershell
cd backend
npm run build
npx vitest run src/__tests__/mobile-inbox.test.ts src/__tests__/mobile-editor-workflows.test.ts src/__tests__/mobile-editor-chapter-actions.test.ts src/__tests__/mobile-board-workflows.test.ts src/__tests__/at-risk-decision.service.test.ts src/__tests__/board.test.ts src/__tests__/p0-workflow-refactor.test.ts src/__tests__/comment-authority.test.ts
cd ../mobile
npm test -- --runInBand
npm run test:legacy
npm run lint
npm run build
npx expo install --check
cd ../frontend
npx playwright test tests/live/mobile-editor-board-core.spec.ts
```

Expected: every command passes.

- [ ] **Step 7: Perform accessibility and narrow-width QA**

At 320, 360, and 390 CSS-pixel widths verify:

- No horizontal overflow.
- Sticky actions remain above safe-area/keyboard.
- Every touch target is at least 44 pixels.
- Dynamic text does not hide action effect or disabled reason.
- Screen-reader labels include entity, status, action, and blocker reason.

- [ ] **Step 8: Update README and commit**

README documents completed role scope, real API requirement, explicit demo mode, exact tabs, secure session behavior, and verification commands.

```powershell
git add -A mobile/src/hooks/use-board-mobile-flow.ts mobile/src/screens/board-screens.tsx mobile/src/screens/board-action-panels.tsx mobile/src/MangaFlowMobileApp.tsx mobile/src/screens/board-today-screen.tsx mobile/src/__tests__/mobile-data.test.mjs mobile/src/__tests__/board-navigation.test.tsx mobile/README.md frontend/tests/live/mobile-editor-board-core.spec.ts
git commit -m "feat: complete Queue-first Board mobile workflows"
```

## Plan 3 Completion Evidence

- Board Today includes live vote, Chair finalization, and at-risk work in backend order.
- Board members vote against the active session snapshot and expected version.
- Board Chair can create, update, close, cancel, and finalize sessions only when authorized.
- Tied rounds are immutable and link to a fresh empty re-vote; no active tie-break action exists.
- At-risk decisions use the exact validated decision union and require a cancellation reason.
- Ranking is read-only and history is immutable.
- Board tabs are exactly Today, Sessions, Ranking, History.
- Backend parity tests, all mobile behavior tests, typecheck, Expo export, dependency check, and live E2E paths pass.
