# Business Workflow Earn-at-COMPLETE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile the production workflow on the earn-at-COMPLETE model: Tantou-only task editorial actions, mandatory two-step editorial gate, loosened chapter gate, editor UI actions, and docs/E2E sync.

**Architecture:** Backend contract first (RBAC + transition gate + chapter gate + status drift), then web editor UI, then docs/E2E. No earning call-site change (`recordTaskEarning` stays at task COMPLETE). Earning remains a tracking-only record — not a payment.

**Tech Stack:** Node/Express/Mongoose backend (vitest + supertest + mongodb-memory-server), React/Vite frontend (Playwright E2E, TanStack Query).

**Spec:** `docs/superpowers/specs/2026-08-06-business-workflow-earn-at-complete-design.md`

## Global Constraints

- Canonical task lifecycle: `TODO → IN_PROGRESS → SUBMITTED → MANGAKA_APPROVED → EDITOR_APPROVED → COMPLETED`. Earning records exactly once at COMPLETE; `EARNED` means tracking-only, never payment.
- New error code: `TASK_EDITOR_ACTION_FORBIDDEN`.
- Task action endpoint: `POST /api/studio/tasks/:taskId/actions/:action` (`backend/src/routes/studio.routes.ts:58`).
- Chapter send-to-review endpoint: `POST /api/studio/chapters/:chapterId/send-editor-review` (`workflow.test.ts` uses this; `POST /api/chapters/:chapterId/actions/SUBMIT_REVIEW` is the legacy alias — do not touch it).
- Seed accounts: Tantou editor `tanaka@beachread.jp` (u-editor; `series.editorId === "u-editor"` for `s-berserk-prod` and all `createReviewFixture` series), non-Tantou editor `editor@mangaflow.local` (u-mobile-editor), mangaka `inoue@beachread.jp` (u-mangaka, owner of `s-berserk-prod`), assistant `jun@beachread.jp` (u-assist), admin `admin@beachread.jp` (u-admin). `loginAs(email)` defaults password to the email.
- Backend tests run from `backend/`: `npx vitest run <file> -t "<name>"` for a single test, `npm test` for all.
- Frontend checks run from `frontend/`: `npm run typecheck`, `npm run lint`, `npm run test:e2e`.
- No data migration. No mobile task actions. `submissionDecision` and submission statuses are unchanged.
- UI copy rule: "Completing a task records the assistant's earning (tracking only — not a payment)."

---

### Task 1: Backend RBAC — Tantou editor owns EDITOR_APPROVE/COMPLETE (P1-2)

**Files:**
- Modify: `backend/src/services/task-submission.service.ts` (`assertTaskActionAllowed` ~line 143, `applyTaskAction` line 342-343)
- Test: `backend/src/__tests__/p0-workflow-refactor.test.ts`

**Interfaces:**
- Consumes: existing `taskSeriesId(task)` helper (same file, line 78), `SeriesModel` (already imported line 5).
- Produces: `assertTaskActionAllowed(actor, task, action)` becomes `async`. New error code `TASK_EDITOR_ACTION_FORBIDDEN`. `EDITOR_APPROVE`/`COMPLETE` allowed only for the series' assigned Tantou editor or ADMIN.

- [ ] **Step 1: Write the failing tests** (append inside `describe("P0 canonical task submission workflow")` in `p0-workflow-refactor.test.ts`)

```ts
it("blocks the owning Mangaka from task EDITOR_APPROVE and COMPLETE", async () => {
  const mangaka = await loginAs("inoue@beachread.jp");
  await StudioTaskModel.create({
    id: "task-rbac-mangaka",
    chapterId: "ch-s-berserk-prod-4",
    seriesId: "s-berserk-prod",
    assigneeId: "u-assist",
    assigneeName: "Jun Assistant",
    status: "MANGAKA_APPROVED",
    isRequired: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  for (const action of ["EDITOR_APPROVE", "COMPLETE"]) {
    const res = await request(createApp())
      .post(`/api/studio/tasks/task-rbac-mangaka/actions/${action}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(403);
    expect(res.body.code).toBe("TASK_EDITOR_ACTION_FORBIDDEN");
  }
});

it("blocks a non-Tantou editor from task EDITOR_APPROVE", async () => {
  const editor = await loginAs("editor@mangaflow.local");
  await StudioTaskModel.create({
    id: "task-rbac-nontantou",
    chapterId: "ch-s-berserk-prod-4",
    seriesId: "s-berserk-prod",
    assigneeId: "u-assist",
    assigneeName: "Jun Assistant",
    status: "MANGAKA_APPROVED",
    isRequired: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const res = await request(createApp())
    .post("/api/studio/tasks/task-rbac-nontantou/actions/EDITOR_APPROVE")
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .send({})
    .expect(403);
  expect(res.body.code).toBe("TASK_EDITOR_ACTION_FORBIDDEN");
});

it("allows the assigned Tantou editor to approve a MANGAKA_APPROVED task", async () => {
  const editor = await loginAs("tanaka@beachread.jp");
  await StudioTaskModel.create({
    id: "task-rbac-tantou",
    chapterId: "ch-s-berserk-prod-4",
    seriesId: "s-berserk-prod",
    assigneeId: "u-assist",
    assigneeName: "Jun Assistant",
    status: "MANGAKA_APPROVED",
    currentSubmissionId: "sub-rbac-tantou",
    isRequired: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await SubmissionModel.create({
    id: "sub-rbac-tantou",
    taskId: "task-rbac-tantou",
    assistantId: "u-assist",
    status: "MANGAKA_APPROVED",
    version: 1,
    submissionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const res = await request(createApp())
    .post("/api/studio/tasks/task-rbac-tantou/actions/EDITOR_APPROVE")
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .send({})
    .expect(200);
  expect(res.body.data.status).toBe("EDITOR_APPROVED");
});

it("lets ADMIN complete an EDITOR_APPROVED task as the emergency pass-through", async () => {
  const admin = await loginAs("admin@beachread.jp");
  await StudioTaskModel.create({
    id: "task-rbac-admin",
    chapterId: "ch-s-berserk-prod-4",
    seriesId: "s-berserk-prod",
    assigneeId: "u-assist",
    assigneeName: "Jun Assistant",
    status: "EDITOR_APPROVED",
    currentSubmissionId: "sub-rbac-admin",
    quantity: 1,
    rateSnapshot: 500,
    isRequired: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await SubmissionModel.create({
    id: "sub-rbac-admin",
    taskId: "task-rbac-admin",
    assistantId: "u-assist",
    status: "MANGAKA_APPROVED",
    version: 1,
    submissionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const res = await request(createApp())
    .post("/api/studio/tasks/task-rbac-admin/actions/COMPLETE")
    .set("Authorization", `Bearer ${admin.accessToken}`)
    .send({})
    .expect(200);
  expect(res.body.data.status).toBe("COMPLETED");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (in `backend/`): `npx vitest run src/__tests__/p0-workflow-refactor.test.ts -t "RBAC|Tantou|emergency pass-through" 2>&1 | Select-Object -Last 15`
Expected: Mangaka and non-Tantou tests fail (currently return 200); the ADMIN test also fails (today ADMIN gets 403 at `assertCanMutateTask`, since `canMutateSeries` denies ADMIN); the Tantou test passes (already allowed).

- [ ] **Step 3: Implement the RBAC gate**

In `task-submission.service.ts`, replace the current `EDITOR_APPROVE`/`COMPLETE` block (lines 176-189):

```ts
  // Editor approval escalates a task MANGAKA_APPROVED → EDITOR_APPROVED and
  // EDITOR_APPROVED → COMPLETED. Only the series' assigned Tantou editor owns
  // these actions; ADMIN keeps an emergency pass-through (recorded in audit).
  // The owning Mangaka must NOT complete tasks: that would record an earning
  // without the Tantou editorial gate.
  if (normalized === "EDITOR_APPROVE" || normalized === "COMPLETE") {
    const seriesId = await taskSeriesId(task);
    const series = seriesId
      ? await SeriesModel.findOne({ id: seriesId }).lean()
      : null;
    const isAssignedTantou =
      actor.role === "EDITOR" &&
      series != null &&
      String(series.editorId ?? "") === String(actor.id);
    if (!isAssignedTantou && actor.role !== "ADMIN") {
      throw new AppError(
        403,
        "Only the assigned Tantou Editor can approve or complete tasks.",
        "TASK_EDITOR_ACTION_FORBIDDEN",
      );
    }
    return;
  }
```

Change the function signature at line 143 from `function assertTaskActionAllowed(` to `async function assertTaskActionAllowed(`.

In `applyTaskAction`, change the call at line 342 from `assertTaskActionAllowed(actor, task, action);` to `await assertTaskActionAllowed(actor, task, action);`.

Replace the line-343 generic mutate check:

```ts
  const isEditorialAction =
    normalizedAction === "EDITOR_APPROVE" || normalizedAction === "COMPLETE";
  if (actor.role !== "ASSISTANT" && !(isEditorialAction && actor.role === "ADMIN")) {
    await assertCanMutateTask(actor, task);
  }
```

(`canMutateSeries` returns `false` for ADMIN, so without this skip the ADMIN pass-through would be rejected downstream at `assertCanMutateTask`. Tantou editors still pass through `assertCanMutateTask`, which preserves the archived/deleted-series guards.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/p0-workflow-refactor.test.ts -t "RBAC|Tantou|emergency pass-through" 2>&1 | Select-Object -Last 15`
Expected: 4 passing.

- [ ] **Step 5: Run the full backend suite for regressions**

Run: `npm test 2>&1 | Select-Object -Last 25`
Expected: 1 known failure remains — the "creates backend-computed earning ... on Mangaka approval" test (fixed in Task 2). No new failures.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/task-submission.service.ts backend/src/__tests__/p0-workflow-refactor.test.ts
git commit -m "fix(task): restrict task EDITOR_APPROVE/COMPLETE to Tantou editor or ADMIN"
```

---

### Task 2: Backend COMPLETE requires EDITOR_APPROVED (P1-3) + fix the red earning test

**Files:**
- Modify: `backend/src/services/task-submission.service.ts` (COMPLETE case ~line 449)
- Test: `backend/src/__tests__/p0-workflow-refactor.test.ts` (rewrite the failing test at line 529; add one new test)

**Interfaces:**
- Consumes: Task 1 gate. `recordTaskEarning` (unchanged) called only in the COMPLETE branch.
- Produces: `COMPLETE` accepts only `EDITOR_APPROVED` source status; error `INVALID_TRANSITION` from `MANGAKA_APPROVED`.

- [ ] **Step 1: Rewrite the red earning test and add the transition-gate test**

Replace the test `"creates backend-computed earning and transactional outbox on Mangaka approval"` (lines 529-578) with:

```ts
it("records exactly one backend-computed earning and outbox event at task COMPLETE", async () => {
  const assistant = await loginAs("jun@beachread.jp");
  const mangaka = await loginAs("inoue@beachread.jp");
  const editor = await loginAs("tanaka@beachread.jp");
  await StudioTaskModel.create({
    id: "task-p0-earning",
    chapterId: "ch-s-berserk-prod-4",
    seriesId: "s-berserk-prod",
    assigneeId: assistant.user.id,
    assigneeName: "Jun Assistant",
    status: "IN_PROGRESS",
    isRequired: true,
    quantity: 3,
    rateSnapshot: 1200,
    estimatedAmount: 999999,
    currency: "VND",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const submit = await request(createApp())
    .post("/api/tasks/task-p0-earning/submit")
    .set("Authorization", `Bearer ${assistant.accessToken}`)
    .set("Idempotency-Key", "idem-task-p0-earning")
    .send({ expectedCurrentSubmissionId: null, fileKey: "pages/task-p0-earning.png" })
    .expect(201);

  await request(createApp())
    .post(`/api/submissions/${submit.body.data.id}/approve`)
    .set("Authorization", `Bearer ${mangaka.accessToken}`)
    .send({ reviewerNote: "Approved" })
    .expect(200);

  const beforeComplete = await EarningModel.findOne({ taskId: "task-p0-earning" }).lean();
  expect(beforeComplete).toBeNull();

  await request(createApp())
    .post("/api/studio/tasks/task-p0-earning/actions/EDITOR_APPROVE")
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .send({})
    .expect(200);
  await request(createApp())
    .post("/api/studio/tasks/task-p0-earning/actions/COMPLETE")
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .send({})
    .expect(200);

  const earning = (await EarningModel.findOne({
    sourceKey: `TASK_APPROVAL:task-p0-earning:${submit.body.data.id}`,
  }).lean()) as any;
  expect(earning?.status).toBe("EARNED");
  expect(earning?.amount).toBe(3600);

  const outbox = await OutboxEventModel.find({
    aggregateId: {
      $in: ["task-p0-earning", `TASK_APPROVAL:task-p0-earning:${submit.body.data.id}`],
    },
  }).lean();
  expect(outbox.map((event: any) => event.type)).toEqual(
    expect.arrayContaining(["task.submitted", "earning.earned"]),
  );
});

it("rejects COMPLETE from MANGAKA_APPROVED before the editor step", async () => {
  const assistant = await loginAs("jun@beachread.jp");
  const mangaka = await loginAs("inoue@beachread.jp");
  const editor = await loginAs("tanaka@beachread.jp");
  await StudioTaskModel.create({
    id: "task-p0-skip-editor",
    chapterId: "ch-s-berserk-prod-4",
    seriesId: "s-berserk-prod",
    assigneeId: assistant.user.id,
    assigneeName: "Jun Assistant",
    status: "IN_PROGRESS",
    isRequired: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const submit = await request(createApp())
    .post("/api/tasks/task-p0-skip-editor/submit")
    .set("Authorization", `Bearer ${assistant.accessToken}`)
    .set("Idempotency-Key", "idem-task-p0-skip-editor")
    .send({ expectedCurrentSubmissionId: null, fileKey: "pages/task-p0-skip-editor.png" })
    .expect(201);

  await request(createApp())
    .post(`/api/submissions/${submit.body.data.id}/approve`)
    .set("Authorization", `Bearer ${mangaka.accessToken}`)
    .send({ reviewerNote: "Approved" })
    .expect(200);

  const blocked = await request(createApp())
    .post("/api/studio/tasks/task-p0-skip-editor/actions/COMPLETE")
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .send({})
    .expect(409);
  expect(blocked.body.code).toBe("INVALID_TRANSITION");

  await request(createApp())
    .post("/api/studio/tasks/task-p0-skip-editor/actions/EDITOR_APPROVE")
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .send({})
    .expect(200);
  const ok = await request(createApp())
    .post("/api/studio/tasks/task-p0-skip-editor/actions/COMPLETE")
    .set("Authorization", `Bearer ${editor.accessToken}`)
    .send({})
    .expect(200);
  expect(ok.body.data.status).toBe("COMPLETED");
});
```

- [ ] **Step 2: Run to verify the tests fail**

Run: `npx vitest run src/__tests__/p0-workflow-refactor.test.ts -t "records exactly one|rejects COMPLETE from" 2>&1 | Select-Object -Last 15`
Expected: "rejects COMPLETE from MANGAKA_APPROVED" fails (COMPLETE returns 200 pre-fix). "records exactly one..." is a green regression guard — it passes both before and after the fix (it drives the full gate through EDITOR_APPROVE → COMPLETE, which already records the earning today).

- [ ] **Step 3: Tighten the COMPLETE transition**

In `task-submission.service.ts` COMPLETE case (line 449), replace:

```ts
      if (task.status !== "MANGAKA_APPROVED" && task.status !== "EDITOR_APPROVED") {
        throw new AppError(
          409,
          `Task must be MANGAKA_APPROVED or EDITOR_APPROVED before completion. Current: ${task.status}.`,
          "INVALID_TRANSITION",
        );
      }
```

with:

```ts
      if (task.status !== "EDITOR_APPROVED") {
        throw new AppError(
          409,
          `Task must be EDITOR_APPROVED before completion. Current: ${task.status}.`,
          "INVALID_TRANSITION",
        );
      }
```

- [ ] **Step 4: Run the two tests to verify they pass**

Run: `npx vitest run src/__tests__/p0-workflow-refactor.test.ts -t "records exactly one|rejects COMPLETE from" 2>&1 | Select-Object -Last 15`
Expected: 2 passing.

- [ ] **Step 5: Run the full backend suite**

Run: `npm test 2>&1 | Select-Object -Last 25`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/task-submission.service.ts backend/src/__tests__/p0-workflow-refactor.test.ts
git commit -m "fix(task): COMPLETE only from EDITOR_APPROVED; earning test drives the full gate"
```

---

### Task 3: Backend chapter send-to-review gate accepts editor-approved tasks (P1-1)

**Files:**
- Modify: `backend/src/services/chapter-review.service.ts:29`
- Test: `backend/src/__tests__/workflow.test.ts` (chapter review describe block, near line 1005)

**Interfaces:**
- Consumes: `createReviewFixture({ ownerId, taskStatus, submissionStatus })` helper in `workflow.test.ts:651` (creates APPROVED proposal + ONGOING series with `editorId: "u-editor"` + chapter with uploaded page + optional task/submission).
- Produces: `APPROVED_TASK_STATUSES = ["MANGAKA_APPROVED", "EDITOR_APPROVED", "COMPLETED"]`.

- [ ] **Step 1: Write the failing tests**

Append inside the chapter review `describe` block in `workflow.test.ts`:

```ts
it("sends a chapter to review when tasks are EDITOR_APPROVED", async () => {
  const mangaka = await loginAs("inoue@beachread.jp");
  const fixture = await createReviewFixture({
    ownerId: mangaka.user.id,
    taskStatus: "EDITOR_APPROVED",
    submissionStatus: "MANGAKA_APPROVED",
  });
  const response = await request(createApp())
    .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
    .set("Authorization", `Bearer ${mangaka.accessToken}`)
    .expect(200);
  expect(response.body.data.chapter.status).toBe("TANTOU_REVIEW");
});

it("sends a chapter to review when tasks are COMPLETED", async () => {
  const mangaka = await loginAs("inoue@beachread.jp");
  const fixture = await createReviewFixture({
    ownerId: mangaka.user.id,
    taskStatus: "COMPLETED",
    submissionStatus: "MANGAKA_APPROVED",
  });
  const response = await request(createApp())
    .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
    .set("Authorization", `Bearer ${mangaka.accessToken}`)
    .expect(200);
  expect(response.body.data.chapter.status).toBe("TANTOU_REVIEW");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (in `backend/`): `npx vitest run src/__tests__/workflow.test.ts -t "EDITOR_APPROVED|COMPLETED" 2>&1 | Select-Object -Last 15`
Expected: both fail with 409 `TASKS_NOT_MANGAKA_APPROVED`.

- [ ] **Step 3: Loosen the gate**

In `chapter-review.service.ts` line 29, replace:

```ts
const APPROVED_TASK_STATUSES = ["MANGAKA_APPROVED"];
```

with:

```ts
const APPROVED_TASK_STATUSES = ["MANGAKA_APPROVED", "EDITOR_APPROVED", "COMPLETED"];
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/workflow.test.ts -t "EDITOR_APPROVED|COMPLETED" 2>&1 | Select-Object -Last 15`
Expected: 2 passing. Also run `npx vitest run src/__tests__/workflow.test.ts 2>&1 | Select-Object -Last 15` — all green.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/chapter-review.service.ts backend/src/__tests__/workflow.test.ts
git commit -m "fix(chapter): send-to-review gate accepts EDITOR_APPROVED and COMPLETED tasks"
```

---

### Task 4: Backend page assignment reject → REJECTED status (P2-1)

**Files:**
- Modify: `backend/src/services/page-assignment.service.ts` (REJECT branch line 100-106, `assertCurrentPageAssignment` line 146)
- Test: `backend/src/__tests__/page-assignment.test.ts` ("mirrors REJECT onto open tasks of the page" test, line 356)

**Interfaces:**
- Consumes: existing `saveAssignment`, `currentPageAssignment` helpers.
- Produces: page assignment status set `REJECTED` on assistant reject (with `rejectedReason`); `assertCurrentPageAssignment` treats `REJECTED` like `RELEASED` (no active assignment). `assignPage` unchanged (already only blocks `PENDING`/`ACCEPTED`).

- [ ] **Step 1: Extend the failing test**

In `page-assignment.test.ts`, in the test `"mirrors REJECT onto open tasks of the page with the rejection reason"` (line 356), replace the REJECT call (lines 378-382):

```ts
    const rejectRes = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/REJECT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ reason: "Overcommitted" })
      .expect(200);
    expect(rejectRes.body.data.status).toBe("REJECTED");
    expect(rejectRes.body.data.rejectedReason).toBe("Overcommitted");
```

(keep the existing task `assignmentStatus` assertions after it).

- [ ] **Step 2: Run the test to verify it fails**

Run (in `backend/`): `npx vitest run src/__tests__/page-assignment.test.ts -t "mirrors REJECT" 2>&1 | Select-Object -Last 15`
Expected: fails — `status` is `"RELEASED"`, not `"REJECTED"`.

- [ ] **Step 3: Implement REJECTED**

In `page-assignment.service.ts`, REJECT branch (line 100-106), replace:

```ts
    const saved = await saveAssignment(pageId, {
      ...current,
      status: normalized === "ACCEPT" ? "ACCEPTED" : "RELEASED",
```

with:

```ts
    const saved = await saveAssignment(pageId, {
      ...current,
      status: normalized === "ACCEPT" ? "ACCEPTED" : "REJECTED",
```

In `assertCurrentPageAssignment` (line 146), replace:

```ts
  if (!assignment || assignment.status === "RELEASED") {
```

with:

```ts
  if (!assignment || assignment.status === "RELEASED" || assignment.status === "REJECTED") {
```

- [ ] **Step 4: Run the test to verify it passes, then the full suite**

Run: `npx vitest run src/__tests__/page-assignment.test.ts 2>&1 | Select-Object -Last 15`, then `npm test 2>&1 | Select-Object -Last 25`
Expected: all green (the `workflow-integrity.test.ts:517` `RELEASED` assertion is a RELEASE action, not REJECT — untouched).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/page-assignment.service.ts backend/src/__tests__/page-assignment.test.ts
git commit -m "fix(page): assistant reject marks the page assignment REJECTED, not RELEASED"
```

---

### Task 5: Frontend PageAssignmentStatus gains REJECTED (P2-1 UI)

**Files:**
- Modify: `frontend/src/entities/series/model/studio-types.ts:101`
- Modify: `frontend/src/features/series/detail/components/studio-tab.tsx:372`
- Modify: `frontend/src/features/series/detail/components/studio/create-task-dialog.tsx:109,266`
- Modify: `frontend/src/features/series/detail/components/studio/studio-inspector.tsx:135`

**Interfaces:**
- Consumes: backend Task 4 (page assignments may now be `REJECTED`).
- Produces: `PageAssignmentStatus` type includes `"REJECTED"`; all "assignment inactive" checks treat `REJECTED` like `RELEASED`; badge map covers the new status.

- [ ] **Step 1: Update the type**

In `studio-types.ts:101`, replace:

```ts
export type PageAssignmentStatus = "PENDING" | "ACCEPTED" | "RELEASED";
```

with:

```ts
export type PageAssignmentStatus = "PENDING" | "ACCEPTED" | "RELEASED" | "REJECTED";
```

- [ ] **Step 2: Update the inactive-assignment checks**

In `studio-tab.tsx:372`, replace:

```ts
    page?.pageAssignment?.status !== "RELEASED" &&
```

with:

```ts
    page?.pageAssignment?.status !== "RELEASED" &&
    page?.pageAssignment?.status !== "REJECTED" &&
```

In `create-task-dialog.tsx:109`, replace:

```ts
    if (!pageAssignment || pageAssignment.status === "RELEASED") {
```

with:

```ts
    if (
      !pageAssignment ||
      pageAssignment.status === "RELEASED" ||
      pageAssignment.status === "REJECTED"
    ) {
```

In `create-task-dialog.tsx:266`, replace:

```ts
                !pageHasSource || !pageAssignment || pageAssignment.status === "RELEASED" || rates.length === 0
```

with:

```ts
                !pageHasSource ||
                !pageAssignment ||
                pageAssignment.status === "RELEASED" ||
                pageAssignment.status === "REJECTED" ||
                rates.length === 0
```

- [ ] **Step 3: Add the badge style**

In `studio-inspector.tsx` (lines 132-136), replace the `PAGE_ASSIGNMENT_STATUS_BADGE` record with:

```ts
const PAGE_ASSIGNMENT_STATUS_BADGE: Record<PageAssignment["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  ACCEPTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  RELEASED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
};
```

- [ ] **Step 4: Verify**

Run (in `frontend/`): `npm run typecheck`, then `npm run lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/entities/series/model/studio-types.ts frontend/src/features/series/detail/components/studio-tab.tsx frontend/src/features/series/detail/components/studio/create-task-dialog.tsx frontend/src/features/series/detail/components/studio/studio-inspector.tsx
git commit -m "fix(studio): handle REJECTED page assignment status in UI"
```

---

### Task 6: Backend comments + status-drift cleanup (P2-2, P2-3)

**Files:**
- Modify: `backend/src/services/page-assignment.service.ts` (header comment lines 6-20)
- Modify: `backend/src/services/task-submission.service.ts` (COMPLETE comment lines 445-448)
- Modify: `backend/src/query_series_status.ts:37`
- Modify: `backend/src/services/chapter-readiness.service.ts:61`
- Test: `backend/src/__tests__/chapter-readiness.service.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: comments describe earning-at-COMPLETE; `query_series_status.ts` counts `EDITOR_APPROVED`/`COMPLETED` as completed; `chapterReadiness` accepts `MANGAKA_APPROVED`/`EDITOR_APPROVED`/`COMPLETED` tasks.

- [ ] **Step 1: Add the readiness regression test**

Read the top of `chapter-readiness.service.test.ts` and match its harness (the existing "does not let a terminal REJECTED task..." test at line 70 calls `chapterReadiness(chapter, [], tasks, submissions)` and asserts on item keys). Append:

```ts
it("accepts EDITOR_APPROVED and COMPLETED tasks in readiness", () => {
  const chapter: any = { status: "TANTOU_REVIEW", pages: [] };
  const tasks = [
    { id: "task-ea", isRequired: true, status: "EDITOR_APPROVED", currentSubmissionId: "sub-ea" },
    { id: "task-c", isRequired: true, status: "COMPLETED", currentSubmissionId: "sub-c" },
  ];
  const submissions = [
    { id: "sub-ea", taskId: "task-ea", status: "MANGAKA_APPROVED" },
    { id: "sub-c", taskId: "task-c", status: "MANGAKA_APPROVED" },
  ];
  const readiness = chapterReadiness(chapter, [], tasks, submissions);
  const allTasksApproved = readiness.items.find((item: any) => item.key === "allTasksApproved");
  expect(allTasksApproved?.passed).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (in `backend/`): `npx vitest run src/__tests__/chapter-readiness.service.test.ts -t "EDITOR_APPROVED and COMPLETED" 2>&1 | Select-Object -Last 15`
Expected: fails — `allTasksApproved.passed` is false.

- [ ] **Step 3: Fix readiness**

In `chapter-readiness.service.ts:61`, replace:

```ts
        .every((task) => ["MANGAKA_APPROVED", "CANCELLED", "REJECTED"].includes(task.status)),
```

with:

```ts
        .every((task) =>
          ["MANGAKA_APPROVED", "EDITOR_APPROVED", "COMPLETED", "CANCELLED", "REJECTED"].includes(
            task.status,
          ),
        ),
```

- [ ] **Step 4: Fix the status query script**

In `query_series_status.ts:37`, replace:

```ts
      completedTasksCount += tasks.filter(t => t.status === "MANGAKA_APPROVED").length;
```

with:

```ts
      completedTasksCount += tasks.filter(t =>
        ["EDITOR_APPROVED", "COMPLETED"].includes(t.status),
      ).length;
```

- [ ] **Step 5: Fix the drifted comments**

In `page-assignment.service.ts`, replace the header block (lines 9-19):

```ts
 * Workflow integrity invariant (Sprint 1.3):
 *   MANGAKA_APPROVED is NOT terminal — it only means the owning Mangaka
 *   accepted the submission; an Editor approval step is still required
 *   before any task can be released. Releasing a page assignment while an
 *   Editor-approved-but-not-yet-paid task exists lets a new Assistant take
 *   over the page even though the Earning is still attached to the
 *   previous assignee.
 *
 * EDITOR_APPROVED is the intermediate status: earning is recorded but not
 * yet paid out. COMPLETED is the only state that releases the assignment
 * for reassignment without ambiguity about who earned the work.
```

with:

```ts
 * Workflow integrity invariant (Sprint 1.3):
 *   MANGAKA_APPROVED is NOT terminal — it only means the owning Mangaka
 *   accepted the submission; an Editor approval step is still required
 *   before any task can be released. Releasing a page assignment while an
 *   Editor-approved-but-not-completed task exists lets a new Assistant take
 *   over the page even though the Earning is still attached to the
 *   previous assignee.
 *
 * EDITOR_APPROVED is the intermediate status: the earning is NOT recorded
 * yet. Earning is recorded exactly once at COMPLETED (tracking only — not
 * a payment), and COMPLETED is the only state that releases the assignment
 * for reassignment without ambiguity about who earned the work.
```

In `task-submission.service.ts` COMPLETE case, replace the comment block (lines 445-448):

```ts
      // Editor finalises the task. Earning is recorded exactly once here so
      // corrections can no longer happen silently via re-approval of a stale
      // submission.
```

with:

```ts
      // Editor finalises the task. Earning is recorded exactly once here
      // (tracking only — not a payment) so corrections can no longer happen
      // silently via re-approval of a stale submission.
```

- [ ] **Step 6: Run the readiness test, then the full backend suite**

Run: `npx vitest run src/__tests__/chapter-readiness.service.test.ts 2>&1 | Select-Object -Last 15`, then `npm test 2>&1 | Select-Object -Last 25`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/page-assignment.service.ts backend/src/services/task-submission.service.ts backend/src/services/chapter-readiness.service.ts backend/src/query_series_status.ts backend/src/__tests__/chapter-readiness.service.test.ts
git commit -m "docs(task): align earning comments and status-drift queries with COMPLETE model"
```

---

### Task 7: Frontend editor task actions in the chapter review page (P0-1)

**Files:**
- Modify: `frontend/src/features/series/api/series-queries.ts` (add `useTaskEditorActionMutation` next to `useTaskActionMutation` at line 435)
- Modify: `frontend/src/features/editor/reviews/components/chapter-review-page.tsx`
- Modify: `frontend/src/features/editor/reviews/components/review-summary-panel.tsx`
- Create: `frontend/tests/editor-task-actions.spec.ts`

**Interfaces:**
- Consumes: `studioTaskActionInvalidations(taskId?, chapterId?)` from `frontend/src/features/series/model/mutation-invalidations.ts:48` (already imported by `series-queries.ts`); `apiRequest`, `mapApiError`, `Panel`, `useStudioTasksQuery` from existing barrels; `StudioTask` type (`frontend/src/entities/series/model/studio-types.ts`).
- Produces: `useTaskEditorActionMutation(chapterId?)` → `useMutation<unknown, Error, { taskId: string; action: "EDITOR_APPROVE" | "COMPLETE" }>`; `ReviewSummaryPanel` gains props `taskActionsPending: boolean` and `onTaskAction(taskId: string, action: "EDITOR_APPROVE" | "COMPLETE"): void`.

- [ ] **Step 1: Add the mutation hook**

In `series-queries.ts`, immediately after `useTaskActionMutation` (line 451), add:

```ts
export function useTaskEditorActionMutation(chapterId?: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { taskId: string; action: "EDITOR_APPROVE" | "COMPLETE" }>({
    mutationFn: ({ taskId, action }) =>
      apiRequest<unknown>(`/studio/tasks/${taskId}/actions/${action}`, {
        method: "POST",
      }),
    onSuccess: (_data, variables) => {
      return Promise.all(
        studioTaskActionInvalidations(variables.taskId, chapterId).map((key) =>
          queryClient.invalidateQueries({ queryKey: key as never }),
        ),
      );
    },
  });
}
```

Confirm `studioTaskActionInvalidations` is imported in this file (it is used at line 445 already). Export the new hook through the `features/series` barrel if the barrel lists hooks explicitly.

- [ ] **Step 2: Wire the page**

In `chapter-review-page.tsx`:
- Import `useTaskEditorActionMutation` and `toast`, `mapApiError` (toast/mapApiError already imported).
- After `const chapterAction = useChapterActionMutation(...)`, add:

```ts
  const taskAction = useTaskEditorActionMutation(chapterId);
```

- Add a handler next to `runAction`:

```ts
  function runTaskAction(taskId: string, action: "EDITOR_APPROVE" | "COMPLETE") {
    taskAction.mutate(
      { taskId, action },
      {
        onSuccess: () =>
          toast.success(
            action === "EDITOR_APPROVE"
              ? "Task approved by editor."
              : "Task completed. Earning recorded.",
          ),
        onError: (error) => toast.error(mapApiError(error)),
      },
    );
  }
```

- Pass the two new props to `ReviewSummaryPanel`:

```tsx
            taskActionsPending={taskAction.isPending}
            onTaskAction={runTaskAction}
```

- [ ] **Step 3: Render the Assistant tasks panel**

In `review-summary-panel.tsx`, add the two props to the destructuring and the prop-type object:

```ts
  taskActionsPending,
  onTaskAction,
```

```ts
  taskActionsPending: boolean;
  onTaskAction: (taskId: string, action: "EDITOR_APPROVE" | "COMPLETE") => void;
```

Insert a new `<Panel title="Assistant tasks">` between the "Review snapshot" panel and the "Comments" panel:

```tsx
      <Panel title="Assistant tasks">
        {tasks.length === 0 ? (
          <p className="text-[12px] text-[var(--admin-faint)]">
            No assistant tasks on this chapter.
          </p>
        ) : (
          <div className="space-y-2">
            <ul className="space-y-2">
              {tasks.map((task) => {
                const needsApprove = task.status === "MANGAKA_APPROVED";
                const needsComplete = task.status === "EDITOR_APPROVED";
                return (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-2 rounded-[6px] border border-[var(--admin-border)] p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-[var(--admin-ink)]">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-[var(--admin-faint)]">
                        {task.assigneeName} · {task.status}
                      </p>
                    </div>
                    {needsApprove ? (
                      <button
                        type="button"
                        disabled={taskActionsPending}
                        onClick={() => onTaskAction(task.id, "EDITOR_APPROVE")}
                        className="shrink-0 rounded-[5px] bg-[var(--admin-navy)] px-2 py-1 text-[10px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] disabled:opacity-40"
                      >
                        Approve
                      </button>
                    ) : needsComplete ? (
                      <button
                        type="button"
                        disabled={taskActionsPending}
                        onClick={() => onTaskAction(task.id, "COMPLETE")}
                        className="shrink-0 rounded-[5px] border border-[var(--admin-border)] px-2 py-1 text-[10px] font-semibold text-[var(--admin-ink)] hover:bg-[var(--admin-hover)] disabled:opacity-40"
                      >
                        Complete
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <p className="text-[10px] text-[var(--admin-faint)]">
              Completing a task records the assistant&apos;s earning (tracking only — not a
              payment).
            </p>
          </div>
        )}
      </Panel>
```

- [ ] **Step 4: Write the mocked E2E test** — create `frontend/tests/editor-task-actions.spec.ts`

Follow the `e2e-role-flows.spec.ts` pattern (`page.addInitScript` seeds `beachread-api-tokens` and `beachread-auth` in localStorage; `page.route` intercepts `**/api/...`). The editor user id is `u-editor`, role `editor`:

```ts
import { expect, test, type Page } from "@playwright/test";

const EDITOR = {
  id: "u-editor",
  name: "Sato Editor",
  email: "editor@beachread.jp",
  role: "editor",
};

const SERIES = {
  id: "series-001",
  slug: "harbor-of-bones",
  title: "Harbor of Bones",
  synopsis: "A coastal mystery.",
  genres: ["Mystery"],
  coverUrl: "",
  status: "ONGOING",
  cadence: "weekly",
  startDate: "2026-06-01T00:00:00.000Z",
  targetChapters: 12,
  authorId: "u-mangaka",
  authorName: "Inoue Mangaka",
  editorId: "u-editor",
  editorName: "Sato Editor",
  assistantIds: ["u-assistant"],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
};

const CHAPTER = {
  id: "chapter-001",
  seriesId: "series-001",
  number: 7,
  title: "The Lighthouse",
  status: "TANTOU_REVIEW",
  assigneeId: "u-mangaka",
  assigneeName: "Inoue Mangaka",
  pages: [
    {
      id: "page-001",
      index: 1,
      fileName: "page-001.png",
      fileUrl: "metadata://local/page-001.png",
      sizeKB: 128,
      status: "UPLOADED",
      uploadedAt: "2026-07-20T00:00:00.000Z",
    },
  ],
  reviewNotes: [],
  revisionRound: 0,
  history: [],
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
};

const TASK_APPROVED = {
  id: "task-001",
  seriesId: "series-001",
  chapterId: "chapter-001",
  pageId: "page-001",
  title: "Clean lighthouse background",
  type: "background",
  assigneeId: "u-assistant",
  assigneeName: "Jun Assistant",
  status: "MANGAKA_APPROVED",
  isRequired: true,
  createdAt: "2026-07-20T00:00:00.000Z",
};

async function seedEditor(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem(
      "beachread-api-tokens",
      JSON.stringify({ accessToken: "test-access", refreshToken: "test-refresh" }),
    );
    window.localStorage.setItem(
      "beachread-auth",
      JSON.stringify({ state: { user }, version: 0 }),
    );
  }, EDITOR);
}

test("editor approves and completes a MANGAKA_APPROVED task from the chapter review page", async ({
  page,
}) => {
  await seedEditor(page);
  let tasks = [TASK_APPROVED];

  await page.route("**/api/series/series-001", (route) =>
    route.fulfill({ json: { data: SERIES } }),
  );
  await page.route("**/api/chapters/chapter-001/reviews", (route) =>
    route.fulfill({ json: { data: [] } }),
  );
  await page.route("**/api/comments?*", (route) => route.fulfill({ json: { data: [] } }));
  await page.route("**/api/studio/regions?*", (route) => route.fulfill({ json: { data: [] } }));
  await page.route("**/api/studio/tasks?*", (route) => route.fulfill({ json: { data: tasks } }));
  await page.route("**/api/chapters/chapter-001", (route) =>
    route.fulfill({ json: { data: CHAPTER } }),
  );

  const editorApproveRequest = page.waitForRequest((request) =>
    request.url().endsWith("/api/studio/tasks/task-001/actions/EDITOR_APPROVE"),
  );
  const completeRequest = page.waitForRequest((request) =>
    request.url().endsWith("/api/studio/tasks/task-001/actions/COMPLETE"),
  );
  await page.route("**/api/studio/tasks/task-001/actions/*", (route) => {
    const url = route.request().url();
    const action = url.endsWith("/COMPLETE") ? "COMPLETE" : "EDITOR_APPROVE";
    tasks = [
      {
        ...TASK_APPROVED,
        status: action === "COMPLETE" ? "COMPLETED" : "EDITOR_APPROVED",
      },
    ];
    route.fulfill({ json: { data: { id: "task-001", status: tasks[0].status } } });
  });

  await page.goto("/app/editor/chapters/chapter-001/review");

  await expect(page.getByText("Assistant tasks")).toBeVisible();
  await expect(page.getByText("Clean lighthouse background")).toBeVisible();
  await expect(page.getByText("tracking only — not a payment").first()).toBeVisible();

  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await editorApproveRequest;
  await expect(page.getByRole("button", { name: "Complete", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Complete", exact: true }).click();
  await completeRequest;
  await expect(page.getByRole("button", { name: "Complete", exact: true })).toHaveCount(0);
  await expect(page.getByText("COMPLETED").first()).toBeVisible();
});
```

Note: if a fixture field name differs from the real API shape (e.g. the tasks query returns `data` vs `data.data`), check `e2e-role-flows.spec.ts` route handlers and the query hook (`useStudioTasksQuery`) for the exact envelope, and adjust the `fulfill` bodies.

- [ ] **Step 5: Run the new test**

Run (in `frontend/`): `npx playwright test tests/editor-task-actions.spec.ts 2>&1 | Select-Object -Last 15`
Expected: passing.

- [ ] **Step 6: Verify typecheck + lint**

Run: `npm run typecheck`, then `npm run lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/series/api/series-queries.ts frontend/src/features/editor/reviews/components/chapter-review-page.tsx frontend/src/features/editor/reviews/components/review-summary-panel.tsx frontend/tests/editor-task-actions.spec.ts
git commit -m "feat(editor): task EDITOR_APPROVE/COMPLETE actions on the chapter review page"
```

---

### Task 8: Live E2E — editor step before the earning assertion (P0-2)

**Files:**
- Modify: `frontend/tests/live/assistant-task-lifecycle.spec.ts`

**Interfaces:**
- Consumes: Task 1-2 backend gate (Tantou `tanaka@beachread.jp` can EDITOR_APPROVE → COMPLETE `tsk-002` after Mangaka approval), Task 7 UI.
- Produces: live flow covers the full editorial gate; final test asserts the "Completed" label and the earning row.

- [ ] **Step 1: Insert the editor step test**

In `assistant-task-lifecycle.spec.ts`, after the test `"Mangaka approves the corrected submission"` (ends line 154), insert:

```ts
  test("Tantou editor approves and completes the task so the earning records", async ({
    page,
  }) => {
    await login(page, "tanaka@beachread.jp", "tanaka@beachread.jp");
    const tokens = JSON.parse(
      (await page.evaluate(() => localStorage.getItem("beachread-api-tokens"))) ?? "{}",
    );
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    const approve = await page.request.post(
      `/api/studio/tasks/${TASK_ID}/actions/EDITOR_APPROVE`,
      { headers },
    );
    expect(approve.status()).toBe(200);
    const complete = await page.request.post(
      `/api/studio/tasks/${TASK_ID}/actions/COMPLETE`,
      { headers },
    );
    expect(complete.status()).toBe(200);
  });
```

(Verify the localStorage token key used by the real app login — `e2e-role-flows.spec.ts` uses `beachread-api-tokens`. If the app uses a different key, read the token from that key instead.)

- [ ] **Step 2: Update the final assertion**

In the test `"Assistant sees the approved task and the earned amount in its original currency"` (line 156), replace:

```ts
    await expect(taskRow).toContainText("MANGAKA APPROVED");
```

with:

```ts
    await expect(taskRow).toContainText("Completed");
```

(`TASK_STATUS_LABEL.COMPLETED` is "Completed" per `frontend/src/shared/constants/status-constants.ts:103`. The earning-row assertions stay unchanged.)

- [ ] **Step 3: Run the live spec (requires the backend seeded and running)**

Run (in `frontend/`): `npx playwright test tests/live/assistant-task-lifecycle.spec.ts 2>&1 | Select-Object -Last 20`
Expected: all serial tests pass, including the new editor step.

- [ ] **Step 4: Commit**

```bash
git add frontend/tests/live/assistant-task-lifecycle.spec.ts
git commit -m "test(e2e): drive Tantou EDITOR_APPROVE and COMPLETE before asserting earning"
```

---

### Task 9: Docs sync to the earn-at-COMPLETE model (P0-2)

**Files (all Modify):**
- `BUSINESS_FLOW.md` (lines ~291, ~312, §9 Flow E)
- `BUSINESS_CANONICAL_FLOW.md` (lines ~341, §8 Flow E)
- `docs/business-flows/05-assistant-submission.md` (§ "Earning Creation (on MANGAKA_APPROVED)" line 120, mermaid line 35)
- `docs/business-flows/08-earnings.md` (mermaid line 18, text)
- `MangaFlow_Master_Document_Updated.md` ("Earning Creation (on MANGAKA_APPROVED)" line ~753, §08 line ~1003)
- `docs/DESIGN.md` (line 186)

**Interfaces:**
- Consumes: the canonical model below; nothing else.
- Produces: every doc describes earning recorded at task COMPLETE by the Tantou editor, tracking only.

- [ ] **Step 1: Apply the canonical wording to each file**

Canonical sequence to describe:

1. Mangaka approves a submission → task `MANGAKA_APPROVED`; no earning yet; region stays locked.
2. Tantou Editor approves the task → `EDITOR_APPROVED` (submission unchanged).
3. Tantou Editor completes the task → `COMPLETED`; an idempotent `Earning` (`EARNED`, tracking only — not a payment) is recorded via `sourceKey: TASK_APPROVAL:<taskId>:<submissionId>`; `earning.earned` outbox event.
4. Only `COMPLETED`/`REJECTED`/`CANCELLED` tasks release a page assignment for reassignment.

Concrete edits:

- `BUSINESS_FLOW.md` line 291 (table row): change `Task → MANGAKA_APPROVED; region unlocked; **Earning** row created (EARNED)` to `Task → MANGAKA_APPROVED; no earning yet (editor step follows)`.
- `BUSINESS_FLOW.md` line 312 (state diagram): change `SUBMITTED --> MANGAKA_APPROVED: Mangaka approves (Earning created, region unlocked)` to `SUBMITTED --> MANGAKA_APPROVED: Mangaka approves (no earning yet)`.
- `BUSINESS_FLOW.md` §9 Flow E — Earnings (line 343-353): rewrite steps to say the Earning is created when the Tantou Editor **completes** the task (COMPLETE), not when the Mangaka approves; keep the tracking-only framing already present at line 360-361.
- `BUSINESS_CANONICAL_FLOW.md` line 341 (table row): same change as BUSINESS_FLOW.md line 291.
- `BUSINESS_CANONICAL_FLOW.md` §8 Flow E (line 477-498): update the numbered steps to the COMPLETE trigger; keep line 133 "tracking records, not confirmed payments" as-is.
- `docs/business-flows/05-assistant-submission.md` line 7-8: change "On Mangaka approval, the Page task slot is released and an Earning record is created." to "On Mangaka approval the submission is accepted; the Tantou Editor then approves and completes the task, which records the Earning (tracking only) and releases the page slot."
- `docs/business-flows/05-assistant-submission.md` line 120 heading: `## Earning Creation (on MANGAKA_APPROVED)` → `## Earning Creation (on task COMPLETE)`; update the bullets (lines 122-131) to the COMPLETE trigger.
- `docs/business-flows/08-earnings.md` line 18 (mermaid): change the `E --> F[Create Earning idempotently]` edge label to reflect the COMPLETE trigger; update line 62-63 text "automatic Earning creation from Mangaka approval" → "automatic Earning creation when the Tantou Editor completes the task".
- `MangaFlow_Master_Document_Updated.md` line ~753 heading `### Earning Creation (on MANGAKA_APPROVED)` → `### Earning Creation (on task COMPLETE)`; update the body (lines 754-763) accordingly, keeping `$setOnInsert` idempotency and the `earning.earned` event description; also line ~1003 diagram edge `D1 -->|Approve| H[Create Idempotent Earning]` → `D1 -->|Approve| H[Task COMPLETE creates Idempotent Earning]`.
- `docs/DESIGN.md` line 186: `StudioTask ||--o| Earning : "on approval"` → `StudioTask ||--o| Earning : "on completion"`.

- [ ] **Step 2: Verify no stale "on MANGAKA_APPROVED" earning wording remains**

Run (repo root): `rg -n "Earning.*MANGAKA_APPROVED|MANGAKA_APPROVED.*[Ee]arning|earning.*Mangaka approval|Earning Creation \(on MANGAKA_APPROVED\)" --glob "*.md" docs BUSINESS_FLOW.md BUSINESS_CANONICAL_FLOW.md MangaFlow_Master_Document_Updated.md`
Expected: no matches. (The word "earn" may still appear next to approval-related prose that is otherwise correct — judge each hit against the canonical sequence.)

- [ ] **Step 3: Commit**

```bash
git add BUSINESS_FLOW.md BUSINESS_CANONICAL_FLOW.md docs/business-flows/05-assistant-submission.md docs/business-flows/08-earnings.md MangaFlow_Master_Document_Updated.md docs/DESIGN.md
git commit -m "docs: sync business flows and master doc to earn-at-COMPLETE model"
```

---


