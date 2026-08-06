# Studio Page Assignment Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an Assistant accept or reject pending page assignments from the dashboard, while preserving page-backed task readiness and fixing task creation and Studio canvas reload regressions.

**Architecture:** Add an authenticated, Assistant-scoped page-assignment inbox read model to the Studio API. The Assistant dashboard consumes that model and uses the existing page-assignment action commands; the backend remains authoritative for state transitions and mirroring task assignment status. Separately, remove the client-owned task status field and make the Studio canvas measure when its host mounts.

**Tech Stack:** Express 5, Mongoose 9, Vitest/Supertest, React 19, TanStack Query 5, Playwright, TypeScript.

## Global Constraints

- An Assistant must accept the Series invitation before they can receive or respond to Page Assignments.
- `PENDING` Page Assignment requires one explicit Assistant Accept/Reject decision; do not auto-accept it on team join.
- Page Assignment remains the canonical owner for all page-backed tasks; do not introduce per-task acceptance.
- Keep `createStudioTaskSchema` strict; task lifecycle status remains server-owned.
- Do not change submission, Mangaka review, Editor approval, earning, or task reassignment behavior in this work.

---

## File structure

- `backend/src/services/page-assignment-inbox.service.ts` — builds an actor-scoped, flattened pending-page-assignment read model.
- `backend/src/controllers/studio.controller.ts` — exposes the read model through an authenticated controller.
- `backend/src/routes/studio.routes.ts` — registers the Assistant-only inbox route.
- `backend/src/__tests__/page-assignment.test.ts` — verifies API scoping, team membership, and existing page/task state behavior.
- `frontend/src/features/assistant/api/assistant-queries.ts` — defines the inbox DTO, query key, query, and action mutation.
- `frontend/src/features/assistant/dashboard/components/page-assignments-panel.tsx` — renders the pending Page Assignment cards and decision controls.
- `frontend/src/features/assistant/dashboard/components/assistant-dashboard.tsx` — places the panel beside Team Invitations.
- `frontend/src/features/series/model/mutation-invalidations.ts` — declares the shared cache-key invalidation set for an Assistant decision.
- `frontend/src/features/series/detail/components/studio-tab.tsx` — removes client task `status` and uses a mount-safe canvas observer.
- `frontend/tests/cache-invalidation-contracts.spec.ts` — pins query invalidation for dashboard decisions.
- `frontend/tests/live/live-user-flows.spec.ts` — proves task creation payload and post-reload canvas size in a browser.

### Task 1: Add the Assistant pending Page Assignment inbox API

**Files:**

- Create: `backend/src/services/page-assignment-inbox.service.ts`
- Modify: `backend/src/controllers/studio.controller.ts:1-60, 560-579`
- Modify: `backend/src/routes/studio.routes.ts:1-60`
- Test: `backend/src/__tests__/page-assignment.test.ts`

**Interfaces:**

- Produces `listPendingPageAssignmentsForAssistant(actorId: string): Promise<PendingPageAssignment[]>`.
- Produces `GET /api/studio/page-assignments/mine`, restricted to role `ASSISTANT`.
- `PendingPageAssignment` fields: `pageId`, `seriesId`, `seriesTitle`, `chapterId`, `chapterNumber`, `chapterTitle`, `pageIndex`, `mangakaId`, `mangakaName`, `assignedAt`, `taskCount`.

- [ ] **Step 1: Write the failing API tests**

  Add tests that create a pending assignment for `u-assist` and assert the endpoint returns one flattened card, then create a second assignment for `u-assist-2` and assert it is absent. Also assert a Mangaka request is rejected.

  ```ts
  const response = await request(app)
    .get("/api/studio/page-assignments/mine")
    .set("Authorization", `Bearer ${assistant.accessToken}`)
    .expect(200);

  expect(response.body.data).toEqual([
    expect.objectContaining({ pageId, seriesId: "s-berserk-prod", taskCount: 1 }),
  ]);
  ```

- [ ] **Step 2: Run the new tests and verify the route is absent**

  Run: `npm test -- --run src/__tests__/page-assignment.test.ts`

  Expected: the new inbox assertions fail with `404` until the route is added.

- [ ] **Step 3: Implement the read model and route**

  In `page-assignment-inbox.service.ts`, query only chapters with a nested page assignment matching the actor and `PENDING`; flatten matching pages, count non-terminal `StudioTaskModel` records per page, and hydrate series and Mangaka display data. Sort by `assignedAt` ascending. Add a controller that calls the service with `requireActor(req).id`, then register:

  ```ts
  router.get(
    "/studio/page-assignments/mine",
    requireExactRole("ASSISTANT") as any,
    listMyPendingPageAssignments,
  );
  ```

- [ ] **Step 4: Run the focused tests and TypeScript check**

  Run: `npm test -- --run src/__tests__/page-assignment.test.ts && npm run lint`

  Expected: all page-assignment tests pass, including the new visibility and role checks.

- [ ] **Step 5: Commit the API unit**

  ```bash
  git add backend/src/services/page-assignment-inbox.service.ts backend/src/controllers/studio.controller.ts backend/src/routes/studio.routes.ts backend/src/__tests__/page-assignment.test.ts
  git commit -m "feat: expose pending page assignments to assistants"
  ```

### Task 2: Render and action pending Page Assignments on the Assistant dashboard

**Files:**

- Create: `frontend/src/features/assistant/dashboard/components/page-assignments-panel.tsx`
- Modify: `frontend/src/features/assistant/api/assistant-queries.ts:380-460`
- Modify: `frontend/src/features/assistant/dashboard/components/assistant-dashboard.tsx:1-30, 210-225`
- Modify: `frontend/src/features/series/model/mutation-invalidations.ts:50-80`
- Test: `frontend/tests/cache-invalidation-contracts.spec.ts`

**Interfaces:**

- Consumes `PendingPageAssignment` from Task 1.
- Produces `useMyPendingPageAssignmentsQuery()` and `useRespondToPageAssignmentMutation()`.
- Produces `pageAssignmentInboxInvalidations(scope: PageAssignmentScope): unknown[]`.
- `useRespondToPageAssignmentMutation()` accepts `{ pageId: string; action: "ACCEPT" | "REJECT"; reason?: string; chapterId: string; seriesId: string }`.

- [ ] **Step 1: Write the cache invalidation contract**

  Extend `frontend/tests/cache-invalidation-contracts.spec.ts` to require the decision invalidation helper to refresh the inbox and the existing Studio, chapter-page, readiness, and series-chapter keys.

  ```ts
  const keys = pageAssignmentInboxInvalidations({ chapterId: "chapter-1", seriesId: "series-1" });
  expect(keys).toContainEqual(["assistant", "page-assignments", "mine"]);
  expect(includesKey(keys, ["chapters", "detail", "chapter-1", "pages"])).toBe(true);
  ```

- [ ] **Step 2: Run the contract test and verify it fails**

  Run: `npx playwright test tests/cache-invalidation-contracts.spec.ts --config playwright.contract.config.ts`

  Expected: TypeScript import failure until the helper/query API exists.

- [ ] **Step 3: Implement query hooks and the panel**

  Add the DTO and query key in `assistant-queries.ts`:

  ```ts
  export type PendingPageAssignment = {
    pageId: string; seriesId: string; seriesTitle: string; chapterId: string;
    chapterNumber: number; chapterTitle?: string; pageIndex: number;
    mangakaId: string; mangakaName: string; assignedAt: string; taskCount: number;
  };
  ```

  Query `GET /studio/page-assignments/mine`. The mutation posts to the existing `/studio/pages/:pageId/assignment/actions/:action` command and invalidates both inbox and Studio keys on success. Build `PageAssignmentsPanel` with pending cards, an Accept Page button, and a Reject button that requires a non-empty reason before sending `REJECT`.

  Add the pure invalidation helper to `mutation-invalidations.ts` by composing the existing page keys and the inbox key:

  ```ts
  export function pageAssignmentInboxInvalidations(scope: PageAssignmentScope) {
    return [["assistant", "page-assignments", "mine"], ...pageAssignmentInvalidations(scope)];
  }
  ```

- [ ] **Step 4: Mount and verify the panel**

  Render `<PageAssignmentsPanel />` immediately after `<TeamInvitationsPanel />` in `AssistantDashboard`. Run:

  `npm run typecheck && npx playwright test tests/cache-invalidation-contracts.spec.ts --config playwright.contract.config.ts`

  Expected: typecheck and the cache-invalidation contract pass.

- [ ] **Step 5: Commit the dashboard unit**

  ```bash
  git add frontend/src/features/assistant/api/assistant-queries.ts frontend/src/features/assistant/dashboard/components/page-assignments-panel.tsx frontend/src/features/assistant/dashboard/components/assistant-dashboard.tsx frontend/src/features/series/model/mutation-invalidations.ts frontend/tests/cache-invalidation-contracts.spec.ts
  git commit -m "feat: let assistants accept page assignments from dashboard"
  ```

### Task 3: Remove the unsupported create-task lifecycle field

**Files:**

- Modify: `frontend/src/features/series/detail/components/studio-tab.tsx:860-890`
- Modify: `frontend/src/features/series/api/series-queries.ts:800-840`
- Test: `frontend/tests/live/live-user-flows.spec.ts:1095-1125`

**Interfaces:**

- `POST /api/studio/tasks` body contains task creation fields defined by `createStudioTaskSchema`, never `status`.
- Backend remains responsible for returning a new task in `TODO` state.

- [ ] **Step 1: Write the browser payload assertion**

  In the existing Create Assistant Task live flow, inspect the outgoing JSON and assert it has no `status`, then assert the created response is `201` and contains `status: "TODO"`.

  ```ts
  const requestBody = taskResponse.request().postDataJSON() as Record<string, unknown>;
  expect(requestBody).not.toHaveProperty("status");
  expect((await taskResponse.json()).data.status).toBe("TODO");
  ```

- [ ] **Step 2: Run the live scenario to verify the current request fails schema validation**

  Run: `npx playwright test tests/live/live-user-flows.spec.ts --config playwright.live.config.ts --grep "Create Assistant Task"`

  Expected: the create request returns `400` with `Unrecognized key: "status"` before the fix.

- [ ] **Step 3: Remove the client lifecycle field**

  Remove `status: "TODO"` from the `createTaskMutation.mutateAsync` body and remove `status?: "TODO"` from the mutation variable type. Do not relax `createStudioTaskSchema`.

- [ ] **Step 4: Re-run the focused live flow and frontend checks**

  Run: `npm run typecheck && npx playwright test tests/live/live-user-flows.spec.ts --config playwright.live.config.ts --grep "Create Assistant Task"`

  Expected: task creation is `201`; the response status is `TODO`; no payload includes `status`.

- [ ] **Step 5: Commit the contract fix**

  ```bash
  git add frontend/src/features/series/detail/components/studio-tab.tsx frontend/src/features/series/api/series-queries.ts frontend/tests/live/live-user-flows.spec.ts
  git commit -m "fix: keep task lifecycle status server controlled"
  ```

### Task 4: Measure the Studio canvas after its host mounts

**Files:**

- Modify: `frontend/src/features/series/detail/components/studio-tab.tsx:397-420, 565-620`
- Test: `frontend/tests/live/live-user-flows.spec.ts`

**Interfaces:**

- The canvas host callback receives `HTMLDivElement | null` and owns one active `ResizeObserver`.
- `KonvaPageCanvas` always receives the measured host width and height after direct route load and reload.

- [ ] **Step 1: Add a failing reload-size assertion**

  In the live Studio flow, reload after the canvas is visible, wait for the canvas and its host to be visible again, and compare their bounding boxes. The canvas must occupy nearly the full host pane rather than 800 pixels wide.

  ```ts
  await page.reload();
  const host = page.locator('[data-testid="studio-canvas-host"]');
  await expect(host).toBeVisible();
  const hostBox = await host.boundingBox();
  const canvasBox = await page.locator("canvas").last().boundingBox();
  expect(canvasBox!.width).toBeGreaterThan(hostBox!.width * 0.9);
  ```

- [ ] **Step 2: Run the test and confirm the 800 x 600 fallback is exposed**

  Run: `npx playwright test tests/live/live-user-flows.spec.ts --config playwright.live.config.ts --grep "canvas reload"`

  Expected: the assertion fails on a direct reload because the observer was never attached after the loading render.

- [ ] **Step 3: Replace the one-shot measurement effect with a callback ref**

  Add `canvasResizeObserverRef` and a stable `setCanvasHost` callback. On a non-null node, disconnect the previous observer, update `{ w, h }` from `getBoundingClientRect()`, then observe the node. On `null`, disconnect and clear the ref. Attach it with `ref={setCanvasHost}` and add `data-testid="studio-canvas-host"`. Remove the empty-dependency layout effect.

- [ ] **Step 4: Re-run reload and type checks**

  Run: `npm run typecheck && npx playwright test tests/live/live-user-flows.spec.ts --config playwright.live.config.ts --grep "canvas reload"`

  Expected: after reload, the canvas bounding box tracks the host pane and is no longer the fallback size.

- [ ] **Step 5: Commit the canvas reliability fix**

  ```bash
  git add frontend/src/features/series/detail/components/studio-tab.tsx frontend/tests/live/live-user-flows.spec.ts
  git commit -m "fix: resize studio canvas after reload"
  ```

### Task 5: Run the integrated acceptance checks

**Files:**

- Modify only if a failure exposes a missing assertion in: `backend/src/__tests__/page-assignment.test.ts`, `frontend/tests/cache-invalidation-contracts.spec.ts`, or `frontend/tests/live/live-user-flows.spec.ts`

**Interfaces:**

- Verifies the public inbox route, dashboard decisions, strict task contract, and mount-safe canvas work together without changing unrelated workflow states.

- [ ] **Step 1: Run backend workflow coverage**

  Run: `npm test -- --run src/__tests__/page-assignment.test.ts src/__tests__/workflow-integrity.test.ts`

  Expected: all focused page-assignment lifecycle and permission checks pass. If `workflow-integrity` reports the known fixture `MongoNotConnectedError`, isolate it from this feature and record it rather than treating it as a product regression.

- [ ] **Step 2: Run frontend contracts and static checks**

  Run: `npm run typecheck && npm run lint && npx playwright test tests/cache-invalidation-contracts.spec.ts --config playwright.contract.config.ts`

  Expected: all commands pass.

- [ ] **Step 3: Run the live Assistant acceptance flow**

  Run: `npx playwright test tests/live/live-user-flows.spec.ts --config playwright.live.config.ts --grep "page assignment|Create Assistant Task|canvas reload"`

  Expected: accept-team → assign-page → dashboard accept → task start succeeds; reject requires a reason; reload keeps the canvas fitted.

- [ ] **Step 4: Inspect the final diff**

  Run: `git diff --check HEAD~4..HEAD && git status --short`

  Expected: no whitespace errors and no uncommitted generated artifacts.

- [ ] **Step 5: Commit any test-only correction**

  ```bash
  git add backend/src/__tests__/page-assignment.test.ts frontend/tests/cache-invalidation-contracts.spec.ts frontend/tests/live/live-user-flows.spec.ts
  git commit -m "test: cover assistant page assignment reliability"
  ```
