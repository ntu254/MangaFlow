# Studio Task Action Lock Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Create Assistant Task discoverable but correctly locked during Tantou Review, and prevent Page Assignment release from bypassing the same lock.

**Architecture:** The Studio tab computes the existing chapter review lock once and passes it to the Inspector. The Inspector renders the task action in both Page and Region selections, using disabled state and explanatory copy rather than hiding it. The page-assignment service applies the canonical backend chapter-content lock before RELEASE.

**Tech Stack:** React 19, TypeScript, Express 5, Mongoose 9, Vitest/Supertest, Playwright.

## Global Constraints

- Do not allow task creation or Page Assignment release while chapter status is `TANTOU_REVIEW`.
- Keep Assistant Accept/Reject Page Assignment transitions unchanged.
- Retain backend authority; disabled frontend controls are not the only protection.
- Do not change submission, earning, or editorial approval state machines.

---

## File structure

- `backend/src/services/page-assignment.service.ts` — rejects RELEASE when its chapter content is locked.
- `backend/src/__tests__/page-assignment.test.ts` — proves a locked chapter cannot release its assignment.
- `frontend/src/features/series/detail/components/studio-tab.tsx` — passes chapter lock state into Inspector.
- `frontend/src/features/series/detail/components/studio/studio-inspector.tsx` — presents Create Task and Release disabled state with explanatory copy.
- `frontend/tests/live/live-user-flows.spec.ts` — browser-level verification of the visible disabled action and post-review editable behavior.

### Task 1: Enforce the Tantou Review lock on Page Assignment release

**Files:**

- Modify: `backend/src/services/page-assignment.service.ts:1-5, 116-139`
- Test: `backend/src/__tests__/page-assignment.test.ts`

**Interfaces:**

- Consumes `assertChapterContentUnlocked(chapter)` from `authorization.service.ts`.
- Produces `409 CHAPTER_REVIEW_LOCKED` from `applyPageAssignmentAction(..., "RELEASE")` when the page belongs to a `TANTOU_REVIEW` chapter.

- [ ] **Step 1: Write the failing API test**

  Assign a page with no tasks, change its chapter status to `TANTOU_REVIEW`, then issue RELEASE as the owning Mangaka. Assert the assignment remains `PENDING` and the response is the canonical lock error.

  ```ts
  await ChapterModel.updateOne({ id: CHAPTER_ID }, { $set: { status: "TANTOU_REVIEW" } });
  const response = await request(app)
    .post(`/api/studio/pages/${pageId}/assignment/actions/RELEASE`)
    .set("Authorization", `Bearer ${mangaka.accessToken}`)
    .send({})
    .expect(409);
  expect(response.body.code).toBe("CHAPTER_REVIEW_LOCKED");
  ```

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `npm test -- --run src/__tests__/page-assignment.test.ts`

  Expected: the Release call returns `200` before the lock guard exists.

- [ ] **Step 3: Add the canonical guard**

  Import `assertChapterContentUnlocked` and, in the `RELEASE` branch, load the page context and call the guard before querying active tasks:

  ```ts
  const { chapter } = await getPageContext(pageId);
  assertChapterContentUnlocked(chapter);
  ```

- [ ] **Step 4: Verify the backend behavior**

  Run: `npm test -- --run src/__tests__/page-assignment.test.ts && npm run lint`

  Expected: release is blocked only for locked chapters; existing release and accept/reject tests pass.

- [ ] **Step 5: Commit the backend guard**

  ```bash
  git add backend/src/services/page-assignment.service.ts backend/src/__tests__/page-assignment.test.ts
  git commit -m "fix: lock page release during tantou review"
  ```

### Task 2: Keep task and release actions visible with a lock explanation

**Files:**

- Modify: `frontend/src/features/series/detail/components/studio-tab.tsx:368-375, 805-850`
- Modify: `frontend/src/features/series/detail/components/studio/studio-inspector.tsx:145-220, 470-650`
- Test: `frontend/tests/live/live-user-flows.spec.ts`

**Interfaces:**

- `StudioInspector` receives `chapterReviewLocked: boolean`.
- `PageAssignmentBlock` receives `chapterReviewLocked: boolean`.
- A reusable `CreateTaskAction` accepts `{ enabled: boolean; lockedByTantouReview: boolean; onCreateTask: () => void }` and renders the same labelled control for Page and Region selection.

- [ ] **Step 1: Write the failing browser assertions**

  In the live Studio flow, move a chapter to `TANTOU_REVIEW`, select a page and a region, and assert both show a disabled Create Assistant Task button with the exact explanatory text. Assert the accepted Page Assignment shows disabled Release page with its lock explanation.

  ```ts
  await expect(page.getByRole("button", { name: "Create Assistant Task" })).toBeDisabled();
  await expect(page.getByText("Create Task unavailable during Tantou Review. Return the chapter to IN_PRODUCTION first.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Release page" })).toBeDisabled();
  ```

- [ ] **Step 2: Run the browser scenario and confirm the missing-action failure**

  Run: `npx playwright test tests/live/live-user-flows.spec.ts --config playwright.live.config.ts --grep "tantou review task action"`

  Expected: it fails because Create Assistant Task is conditionally absent and Release page remains enabled.

- [ ] **Step 3: Implement explicit lock-state props and controls**

  In `StudioTab`, pass `chapterReviewLocked` to `StudioInspector`; preserve `canCreateTask` as the enablement condition. In `studio-inspector.tsx`, render `CreateTaskAction` in both the Page-selection and Region-selection branches whenever `permissions.canCreateTask` is true. Set `disabled={!enabled}`, set the button `title` to the Tantou explanation only when locked, and render the same helper text below it. Pass `chapterReviewLocked` to `PageAssignmentBlock`; disable Release and render `Page Assignment changes are unavailable during Tantou Review.` below that control.

- [ ] **Step 4: Verify locked and editable behavior**

  Extend the same live test to change the chapter back to `IN_PRODUCTION`, then assert Create Assistant Task and Release page are enabled when the ordinary page-assignment prerequisites are met. Run:

  `npm run typecheck && npm run lint && npx playwright test tests/live/live-user-flows.spec.ts --config playwright.live.config.ts --grep "tantou review task action"`

  Expected: locked state is explanatory and non-interactive; editable state restores the original actions.

- [ ] **Step 5: Commit the Studio UI remediation**

  ```bash
  git add frontend/src/features/series/detail/components/studio-tab.tsx frontend/src/features/series/detail/components/studio/studio-inspector.tsx frontend/tests/live/live-user-flows.spec.ts
  git commit -m "fix: explain locked studio task actions"
  ```

### Task 3: Run the regression suite for the Page Assignment workflow

**Files:**

- Modify only if the commands expose an incomplete assertion: `backend/src/__tests__/page-assignment.test.ts` or `frontend/tests/live/live-user-flows.spec.ts`

**Interfaces:**

- Verifies the API lock and the Studio UI agree on accepted Page Assignment behavior in locked and editable chapters.

- [ ] **Step 1: Run backend lifecycle coverage**

  Run: `npm test -- --run src/__tests__/page-assignment.test.ts`

  Expected: all assignment accept, reject, release, and Tantou lock tests pass.

- [ ] **Step 2: Run frontend static checks**

  Run: `npm run typecheck && npm run lint`

  Expected: no TypeScript or lint errors.

- [ ] **Step 3: Run the focused live regression**

  Run: `npx playwright test tests/live/live-user-flows.spec.ts --config playwright.live.config.ts --grep "tantou review task action"`

  Expected: controls are visible and disabled in review, then enabled in production; no mutation request is issued while disabled.

- [ ] **Step 4: Inspect the final worktree**

  Run: `git diff --check && git status --short`

  Expected: no whitespace errors or generated artifacts.

- [ ] **Step 5: Commit any regression-test-only correction**

  ```bash
  git add backend/src/__tests__/page-assignment.test.ts frontend/tests/live/live-user-flows.spec.ts
  git commit -m "test: cover studio task lock visibility"
  ```
