# Mobile Editor Core Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Queue-first Editor mobile experience for proposals, consolidated chapter review, editorial comments, publication decisions, and history using canonical backend services.

**Architecture:** Extend the shared inbox projection with actor-scoped Editor work items and use canonical proposal, chapter, comment, and publication endpoints for detail and mutation. Focused query hooks own each workflow family, while reusable detail and confirmation components render backend capabilities and disabled reasons. Assistant submissions stay read-only evidence; no Editor-in-Chief tie-break mutation exists.

**Tech Stack:** Expo SDK 56, React Native, TypeScript, Zod, TanStack Query v5, Jest Expo, React Native Testing Library, Express, Mongoose, Vitest, Supertest.

## Global Constraints

- This plan starts only after `2026-07-30-mobile-workflow-foundation.md` passes.
- Editor mobile never approves or rejects Assistant submissions; Mangaka owns submission review.
- Editor mobile reviews the consolidated chapter through canonical chapter actions.
- Only the assigned Tantou receives blocking-comment and chapter decision capabilities.
- Self-review remains forbidden.
- Readiness and blocker eligibility are returned by backend services and are not recalculated on mobile.
- Proposal, chapter, comment, and publication mutations use canonical services.
- No new Editor-in-Chief tie-break action exists; ties create Board re-votes.
- Live API failures never return mock content.
- Every decision preserves form input on validation, permission, conflict, or server failure.
- Preserve unrelated dirty files.

## File Structure

### Backend

- Modify `backend/src/services/mobile-inbox.service.ts`: Editor chapter/comment/publication items.
- Create `backend/src/services/mobile-editor-detail.service.ts`: actor-scoped compact detail projections.
- Modify `backend/src/controllers/mobile.controller.ts`: thin detail handlers.
- Modify `backend/src/routes/mobile.routes.ts`: Editor detail routes.
- Reuse `backend/src/services/workflow.service.ts`, `chapter-review.service.ts`, `chapter-readiness.service.ts`, and `publication.service.ts` without a second state machine.
- Create `backend/src/__tests__/mobile-editor-workflows.test.ts`: inbox/detail/action parity tests.

### Mobile

- Create `mobile/src/services/editor-mobile-data-source.ts`.
- Create `mobile/src/hooks/use-editor-proposal.ts`.
- Create `mobile/src/hooks/use-editor-chapter.ts`.
- Create `mobile/src/hooks/use-editor-comments.ts`.
- Create `mobile/src/hooks/use-editor-publications.ts`.
- Create `mobile/src/components/workflow-detail-layout.tsx`.
- Create `mobile/src/components/workflow-action-bar.tsx`.
- Create `mobile/src/screens/editor-reviews-screen.tsx`.
- Create `mobile/src/screens/editor-proposal-detail-screen.tsx`.
- Create `mobile/src/screens/editor-chapter-detail-screen.tsx`.
- Create `mobile/src/screens/editor-publish-screen.tsx`.
- Create `mobile/src/screens/editor-history-screen.tsx`.
- Modify `mobile/src/screens/editor-today-screen.tsx`.
- Modify `mobile/src/MangaFlowMobileApp.tsx`.
- Retire obsolete Editor branches from `mobile/src/hooks/use-editor-mobile-flow.ts`, `mobile/src/screens/editor-screens.tsx`, and `mobile/src/screens/editor-action-panels.tsx` after replacement tests pass.

---

### Task 1: Extend the Editor inbox with chapter, comment, and publication work

**Files:**

- Modify: `backend/src/services/mobile-inbox.service.ts`
- Create: `backend/src/services/mobile-editor-detail.service.ts`
- Modify: `backend/src/controllers/mobile.controller.ts`
- Modify: `backend/src/routes/mobile.routes.ts`
- Create: `backend/src/__tests__/mobile-editor-workflows.test.ts`

**Interfaces:**

- Consumes: `ChapterModel`, `SeriesModel`, `StudioCommentModel`, `PublicationModel`, `chapterReadiness`, `findChapterBlockingComments`, and Task 1 contract schemas.
- Produces: complete `GET /api/editor/inbox`, `GET /api/editor/proposals/:id/detail`, and `GET /api/editor/chapters/:id/detail`.

- [ ] **Step 1: Write failing actor-scope and capability tests**

```ts
it("returns only assigned Tantou chapter actions", async () => {
  const tantou = await loginAs("editor@mangaflow.local");
  const response = await request(createApp())
    .get("/api/editor/inbox")
    .set("Authorization", `Bearer ${tantou.accessToken}`)
    .expect(200);

  const chapter = response.body.data.items.find((item: any) => item.kind === "CHAPTER_REVIEW");
  expect(chapter.actions.map((item: any) => item.action)).toEqual(
    expect.arrayContaining(["REQUEST_REVISION", "REJECT", "EDITOR_APPROVE"]),
  );
  expect(chapter.blockers.every((item: any) => item.detail.length > 0)).toBe(true);
});

it("does not expose chapter actions to a different Editor", async () => {
  const other = await loginAs("second.editor@mangaflow.local");
  const response = await request(createApp())
    .get("/api/editor/inbox")
    .set("Authorization", `Bearer ${other.accessToken}`)
    .expect(200);
  expect(response.body.data.items
    .filter((item: any) => item.kind === "CHAPTER_REVIEW")
    .flatMap((item: any) => item.actions)
    .some((action: any) => action.enabled)).toBe(false);
});
```

Add assertions for:

- `COMMENT_REVIEW` only when the assigned Tantou can resolve/reopen.
- `PUBLICATION` with `SCHEDULE`, `POSTPONE`, or `PUBLISH` descriptors from actual publication state.
- No Assistant submission approval action string anywhere in the response.

- [ ] **Step 2: Run and verify red**

```powershell
cd backend
npx vitest run src/__tests__/mobile-editor-workflows.test.ts
```

- [ ] **Step 3: Implement actor-aware Editor item builders**

Add focused builders:

```ts
function chapterReviewWorkItem(actor: RequestActor, chapter: any, series: any): MobileWorkItem;
function commentReviewWorkItem(actor: RequestActor, comment: any): MobileWorkItem;
function publicationWorkItem(actor: RequestActor, chapter: any, publication: any): MobileWorkItem;
```

Use canonical statuses and service results. `EDITOR_APPROVE.enabled` is derived from the same readiness/blocker result returned by the backend detail service; its disabled reason is a joined human-readable summary, not a client count.

- [ ] **Step 4: Implement compact detail projections**

Return:

```ts
type EditorChapterDetail = {
  chapter: { id: string; seriesId: string; title: string; status: string; version: number | null };
  series: { id: string; title: string; editorId: string | null };
  pages: Array<{ id: string; pageNumber: number; status: string; thumbnailFileKey?: string }>;
  readiness: ReturnType<typeof chapterReadiness>;
  blockers: Array<{ id: string; status: string; body: string; targetType: string; targetId: string }>;
  evidence: { taskCount: number; currentSubmissionCount: number };
  actions: MobileWorkflowActionDescriptor[];
};
```

Task/submission fields are evidence only.

- [ ] **Step 5: Add thin handlers and routes**

Use Editor guards and actor-aware services:

```ts
router.get("/editor/proposals/:proposalId/detail", requireExactRole("EDITOR"), proposalDetail);
router.get("/editor/chapters/:chapterId/detail", requireExactRole("EDITOR"), chapterDetail);
```

- [ ] **Step 6: Run focused backend tests**

```powershell
npx vitest run src/__tests__/mobile-editor-workflows.test.ts src/__tests__/authorization-perimeter.test.ts src/__tests__/chapter-readiness.service.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add backend/src/services/mobile-inbox.service.ts backend/src/services/mobile-editor-detail.service.ts backend/src/controllers/mobile.controller.ts backend/src/routes/mobile.routes.ts backend/src/__tests__/mobile-editor-workflows.test.ts
git commit -m "feat: project Editor mobile workflow inbox"
```

### Task 2: Implement proposal detail and canonical decisions

**Files:**

- Create: `mobile/src/services/editor-mobile-data-source.ts`
- Create: `mobile/src/hooks/use-editor-proposal.ts`
- Create: `mobile/src/components/workflow-detail-layout.tsx`
- Create: `mobile/src/components/workflow-action-bar.tsx`
- Create: `mobile/src/screens/editor-proposal-detail-screen.tsx`
- Create: `mobile/src/__tests__/editor-proposal-flow.test.tsx`
- Modify: `mobile/src/screens/editor-today-screen.tsx`

**Interfaces:**

- Consumes: `/editor/proposals/:id/detail`, existing proposal mobile aliases, Task 1 confirmation shell, Task 1 query client.
- Produces: `useEditorProposal(proposalId)`, proposal detail UI, and confirmed `CLAIM`, `REQUEST_CHANGES`, `REJECT`, `FORWARD` mutations.

- [ ] **Step 1: Write failing decision-flow tests**

```tsx
it("requires a reason before requesting changes", async () => {
  renderEditorProposal(proposalDetailFixture);
  fireEvent.press(screen.getByRole("button", { name: "Request changes" }));
  expect(screen.getByText("Request changes for Neon District?")).toBeVisible();
  fireEvent.press(screen.getByRole("button", { name: "Confirm request changes" }));
  expect(screen.getByText("Reason is required.")).toBeVisible();
  expect(mockRequestChanges).not.toHaveBeenCalled();
});

it("refreshes proposal and inbox after forwarding", async () => {
  renderEditorProposal(forwardableProposalFixture);
  fireEvent.press(screen.getByRole("button", { name: "Forward to Board" }));
  fireEvent.changeText(screen.getByLabelText("Editor recommendation"), "Ready for Board review.");
  fireEvent.press(screen.getByRole("button", { name: "Confirm forward" }));
  await waitFor(() => expect(mockForward).toHaveBeenCalledWith(expect.objectContaining({
    editorRecommendation: "Ready for Board review.",
  })));
  expect(mockInvalidate).toHaveBeenCalledWith(expect.arrayContaining(["mobile-inbox", "editor"]));
});
```

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/editor-proposal-flow.test.tsx
```

- [ ] **Step 3: Implement typed proposal queries and mutations**

Export:

```ts
getEditorProposalDetail(id: string): Promise<EditorProposalDetail>;
claimEditorProposal(id: string): Promise<void>;
requestEditorProposalChanges(id: string, input: { comment: string; checklist?: Record<string, boolean> }): Promise<void>;
rejectEditorProposal(id: string, input: { reason: string }): Promise<void>;
forwardEditorProposal(id: string, input: {
  editorRecommendation: string;
  feasibilityNote: string;
  suggestedPublicationType: "WEEKLY" | "MONTHLY";
}): Promise<void>;
```

Do not synthesize a default recommendation or publication type if the backend descriptor marks it required.

- [ ] **Step 4: Build progressive detail and sticky actions**

Render current version, proposal summary, claim state, requested cadence, materials summary, backend checklist evidence, history, and action descriptors. Disabled actions remain visible only when their reason helps the user; the reason appears beside the sticky action.

- [ ] **Step 5: Implement action-specific confirmations**

The confirmation effect for `FORWARD` states that Board review is opened only by subsequent governance/session behavior. `CLAIM` must explain conflict handling. Preserve form drafts on every failed mutation.

- [ ] **Step 6: Run focused tests, typecheck, and export**

```powershell
npm test -- --runInBand src/__tests__/editor-proposal-flow.test.tsx
npm run lint
npm run build
```

- [ ] **Step 7: Commit**

```powershell
git add mobile/src/services/editor-mobile-data-source.ts mobile/src/hooks/use-editor-proposal.ts mobile/src/components/workflow-detail-layout.tsx mobile/src/components/workflow-action-bar.tsx mobile/src/screens/editor-proposal-detail-screen.tsx mobile/src/screens/editor-today-screen.tsx mobile/src/__tests__/editor-proposal-flow.test.tsx
git commit -m "feat: add Editor proposal decisions on mobile"
```

### Task 3: Implement consolidated chapter review

**Files:**

- Modify: `mobile/src/services/editor-mobile-data-source.ts`
- Create: `mobile/src/hooks/use-editor-chapter.ts`
- Create: `mobile/src/screens/editor-chapter-detail-screen.tsx`
- Create: `mobile/src/components/readiness-evidence.tsx`
- Create: `mobile/src/__tests__/editor-chapter-flow.test.tsx`
- Create: `backend/src/__tests__/mobile-editor-chapter-actions.test.ts`

**Interfaces:**

- Consumes: `/editor/chapters/:id/detail`, `/chapters/:id/actions/REQUEST_REVISION`, `/REJECT`, `/EDITOR_APPROVE`.
- Produces: chapter evidence/detail and canonical Editor chapter mutations.

- [ ] **Step 1: Add backend parity tests**

```ts
it("returns the same blocker reason and rejects direct approval", async () => {
  const editor = await loginAs("editor@mangaflow.local");
  const detail = await request(createApp())
    .get(`/api/editor/chapters/${blockedChapterId}/detail`)
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .expect(200);
  expect(detail.body.data.actions.find((action: any) => action.action === "EDITOR_APPROVE"))
    .toMatchObject({ enabled: false });

  await request(createApp())
    .post(`/api/chapters/${blockedChapterId}/actions/EDITOR_APPROVE`)
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .send({})
    .expect(409);
});
```

- [ ] **Step 2: Write failing mobile tests**

```tsx
it("does not recalculate approval from rendered comment count", () => {
  renderEditorChapter({
    ...blockedChapterDetail,
    blockers: [],
    actions: [{ ...approveAction, enabled: false, disabledReason: "Frozen snapshot is stale." }],
  });
  expect(screen.getByRole("button", { name: "Approve chapter" })).toBeDisabled();
  expect(screen.getByText("Frozen snapshot is stale.")).toBeVisible();
});
```

- [ ] **Step 3: Run red tests**

```powershell
cd backend
npx vitest run src/__tests__/mobile-editor-chapter-actions.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/editor-chapter-flow.test.tsx
```

- [ ] **Step 4: Implement chapter query and action hooks**

Use `useEditorChapter(chapterId)` with no optimistic status update. On success invalidate Editor inbox, chapter detail, chapter readiness, comments, and history keys.

- [ ] **Step 5: Implement detail UI**

Tabs/sections:

- Overview.
- Pages with compact metadata/permission-checked preview entry.
- Comments.

The sticky bar exposes only backend descriptors. `REQUEST_REVISION` and `REJECT` require a reason. `EDITOR_APPROVE` confirmation names the frozen snapshot/version.

- [ ] **Step 6: Run focused verification**

```powershell
cd backend
npx vitest run src/__tests__/mobile-editor-chapter-actions.test.ts src/__tests__/chapter-readiness.service.test.ts src/__tests__/comment-authority.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/editor-chapter-flow.test.tsx
npm run lint
```

- [ ] **Step 7: Commit**

```powershell
git add backend/src/__tests__/mobile-editor-chapter-actions.test.ts mobile/src/services/editor-mobile-data-source.ts mobile/src/hooks/use-editor-chapter.ts mobile/src/screens/editor-chapter-detail-screen.tsx mobile/src/components/readiness-evidence.tsx mobile/src/__tests__/editor-chapter-flow.test.tsx
git commit -m "feat: add Editor chapter review on mobile"
```

### Task 4: Implement editorial comment lifecycle

**Files:**

- Modify: `mobile/src/services/editor-mobile-data-source.ts`
- Create: `mobile/src/hooks/use-editor-comments.ts`
- Create: `mobile/src/components/comment-thread.tsx`
- Modify: `mobile/src/screens/editor-chapter-detail-screen.tsx`
- Create: `mobile/src/__tests__/editor-comment-flow.test.tsx`

**Interfaces:**

- Consumes: `POST /comments`, `POST /comments/:id/replies`, `POST /comments/:id/resolve`, `POST /comments/:id/reopen`.
- Produces: create/reply/resolve/reopen UI that respects backend capability descriptors.

- [ ] **Step 1: Write failing lifecycle tests**

```tsx
it("shows only the backend-enabled Tantou action", () => {
  renderCommentThread({
    ...addressedBlockingComment,
    actions: [resolveEnabled, reopenDisabled],
  });
  expect(screen.getByRole("button", { name: "Resolve comment" })).toBeEnabled();
  expect(screen.getByText(reopenDisabled.disabledReason!)).toBeVisible();
});

it("keeps a reply draft after a 409", async () => {
  mockReply.mockRejectedValue(new MobileApiError("Comment changed.", 409, "CONFLICT"));
  renderCommentThread(openComment);
  fireEvent.changeText(screen.getByLabelText("Reply"), "Please adjust the balloon.");
  fireEvent.press(screen.getByRole("button", { name: "Send reply" }));
  expect(await screen.findByText("This workflow changed. Refreshing current comment.")).toBeVisible();
  expect(screen.getByDisplayValue("Please adjust the balloon.")).toBeVisible();
});
```

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/editor-comment-flow.test.tsx
```

- [ ] **Step 3: Implement typed comment mutations**

Create/reply inputs require explicit target IDs and body. `isBlocking` is sent only when the backend descriptor exposes that field to the assigned Tantou. Resolve/reopen send no guessed status.

- [ ] **Step 4: Implement accessible thread UI**

Each comment announces author, status, blocker state, target page/task, and available action. Reply controls use 44-pixel targets and preserve drafts across errors.

- [ ] **Step 5: Run mobile and backend authority tests**

```powershell
cd backend
npx vitest run src/__tests__/comment-authority.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/editor-comment-flow.test.tsx
npm run lint
```

- [ ] **Step 6: Commit**

```powershell
git add mobile/src/services/editor-mobile-data-source.ts mobile/src/hooks/use-editor-comments.ts mobile/src/components/comment-thread.tsx mobile/src/screens/editor-chapter-detail-screen.tsx mobile/src/__tests__/editor-comment-flow.test.tsx
git commit -m "feat: add Tantou comment lifecycle on mobile"
```

### Task 5: Implement publication queue and decisions

**Files:**

- Modify: `mobile/src/services/editor-mobile-data-source.ts`
- Create: `mobile/src/hooks/use-editor-publications.ts`
- Create: `mobile/src/screens/editor-publish-screen.tsx`
- Create: `mobile/src/components/publication-confirmation.tsx`
- Create: `mobile/src/__tests__/editor-publication-flow.test.tsx`
- Extend: `backend/src/__tests__/mobile-editor-workflows.test.ts`

**Interfaces:**

- Consumes: Editor `PUBLICATION` items and canonical chapter `SCHEDULE`, `POSTPONE`, `PUBLISH` actions.
- Produces: Publish tab, schedule form, postpone/publish confirmation, and server-state refresh.

- [ ] **Step 1: Add failing publication capability tests**

Backend:

```ts
expect(readyItem.actions.find((item: any) => item.action === "SCHEDULE"))
  .toMatchObject({ enabled: true, requiresConfirmation: true, requiresReason: false });
expect(futureScheduledItem.actions.find((item: any) => item.action === "PUBLISH"))
  .toMatchObject({ enabled: false, disabledReason: expect.stringContaining("scheduled") });
```

Mobile:

```tsx
it("requires a future schedule and shows backend validation", async () => {
  renderPublication(readyPublication);
  fireEvent.press(screen.getByRole("button", { name: "Schedule publication" }));
  fireEvent.changeText(screen.getByLabelText("Scheduled date and time"), "2020-01-01T00:00");
  fireEvent.press(screen.getByRole("button", { name: "Confirm schedule" }));
  expect(await screen.findByText(/future date/i)).toBeVisible();
});
```

- [ ] **Step 2: Run red tests**

```powershell
cd backend
npx vitest run src/__tests__/mobile-editor-workflows.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/editor-publication-flow.test.tsx
```

- [ ] **Step 3: Implement publication hooks and UI**

Schedule sends `{ scheduledAt }`. Postpone and publish call canonical chapter actions. Do not change the chapter status locally; refresh inbox/detail/history after success.

- [ ] **Step 4: Add high-friction confirmation**

Publish confirmation names chapter, schedule, visibility effect, and current backend readiness. Postpone requires the backend-required reason when the descriptor indicates it.

- [ ] **Step 5: Run focused verification**

```powershell
cd backend
npx vitest run src/__tests__/mobile-editor-workflows.test.ts src/__tests__/production-completion.test.ts
cd ../mobile
npm test -- --runInBand src/__tests__/editor-publication-flow.test.tsx
npm run lint
npm run build
```

- [ ] **Step 6: Commit**

```powershell
git add backend/src/__tests__/mobile-editor-workflows.test.ts mobile/src/services/editor-mobile-data-source.ts mobile/src/hooks/use-editor-publications.ts mobile/src/screens/editor-publish-screen.tsx mobile/src/components/publication-confirmation.tsx mobile/src/__tests__/editor-publication-flow.test.tsx
git commit -m "feat: add Editor publication decisions on mobile"
```

### Task 6: Complete Editor navigation and history; retire obsolete Editor shell

**Files:**

- Create: `mobile/src/screens/editor-reviews-screen.tsx`
- Create: `mobile/src/screens/editor-history-screen.tsx`
- Modify: `mobile/src/MangaFlowMobileApp.tsx`
- Modify: `mobile/src/screens/editor-today-screen.tsx`
- Delete after replacement: `mobile/src/hooks/use-editor-mobile-flow.ts`
- Delete after replacement: obsolete exports in `mobile/src/screens/editor-screens.tsx`
- Delete after replacement: obsolete exports in `mobile/src/screens/editor-action-panels.tsx`
- Modify: `mobile/src/__tests__/mobile-data.test.mjs`
- Create: `mobile/src/__tests__/editor-navigation.test.tsx`

**Interfaces:**

- Consumes: completed Editor workflow screens and authenticated session.
- Produces: exact tabs `Today`, `Reviews`, `Publish`, `History`; no final-approval submission action and no tie-break action.

- [ ] **Step 1: Write failing navigation tests**

```tsx
it("renders the approved four Editor tabs", () => {
  renderEditorApp();
  for (const tab of ["Today", "Reviews", "Publish", "History"]) {
    expect(screen.getByRole("button", { name: tab })).toBeVisible();
  }
  expect(screen.queryByText("Final approve submissions")).toBeNull();
  expect(screen.queryByText(/tie-break/i)).toBeNull();
});
```

- [ ] **Step 2: Run and verify red**

```powershell
cd mobile
npm test -- --runInBand src/__tests__/editor-navigation.test.tsx
```

- [ ] **Step 3: Wire Reviews and History**

Reviews filters Editor inbox by proposal/chapter kind without recomputing order. History uses canonical proposal/chapter/comment/publication history reads and is immutable.

- [ ] **Step 4: Remove obsolete Editor implementation**

Remove legacy hook/action branches only after imports resolve to the new modules. Keep shared visual primitives still used by Board. Replace `lastMockAction` and fallback wording in legacy regex tests.

- [ ] **Step 5: Run complete Editor verification**

```powershell
cd backend
npx vitest run src/__tests__/mobile-editor-workflows.test.ts src/__tests__/mobile-editor-chapter-actions.test.ts src/__tests__/proposal-lifecycle.service.test.ts src/__tests__/chapter-readiness.service.test.ts src/__tests__/comment-authority.test.ts
npm run build
cd ../mobile
npm test -- --runInBand
npm run test:legacy
npm run lint
npm run build
```

- [ ] **Step 6: Commit**

```powershell
git add -A mobile/src/hooks/use-editor-mobile-flow.ts mobile/src/screens/editor-screens.tsx mobile/src/screens/editor-action-panels.tsx mobile/src/screens/editor-reviews-screen.tsx mobile/src/screens/editor-history-screen.tsx mobile/src/screens/editor-today-screen.tsx mobile/src/MangaFlowMobileApp.tsx mobile/src/__tests__/mobile-data.test.mjs mobile/src/__tests__/editor-navigation.test.tsx
git commit -m "feat: complete Queue-first Editor mobile workflows"
```

## Plan 2 Completion Evidence

- Editor Today aggregates proposal, chapter, comment, and publication work from backend order.
- Proposal, chapter, comment, and publication decisions call canonical backend behavior.
- Assistant submissions are read-only evidence and expose no Editor approval mutation.
- Readiness and blockers match backend service output.
- The app contains no active EIC tie-break action.
- Editor tabs are exactly Today, Reviews, Publish, History.
- Focused backend parity tests, all mobile behavior tests, typecheck, and Expo export pass.
