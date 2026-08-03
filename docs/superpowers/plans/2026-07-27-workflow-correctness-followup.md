# Workflow Correctness Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the remaining backend, frontend, documentation, and Postman workflow contracts consistent with the canonical MangaFlow business rules and prevent active work from being orphaned.

**Architecture:** Keep controllers thin and place transition/workload policy in focused backend services. Route middleware will mirror the controller’s actor contract, while the frontend and Postman clients will consume the same canonical endpoints and top-level Material status. No new Admin/payroll workflow is introduced.

**Tech Stack:** TypeScript, Express, Mongoose, Vitest, Supertest, React/TanStack Query, Playwright contract tests, Postman Collection v2.1 JSON.

## Global Constraints

- Proposal approval remains VotingSession-based; direct `FORCE_STATUS` remains HTTP `410 WORKFLOW_REMOVED`.
- Generic `POST /api/submissions` remains deprecated; canonical submission is `POST /api/tasks/:taskId/submit`.
- Earnings remain tracking-only and are created as `EARNED` when Mangaka approves a submission.
- RateTable remains Admin-owned and no production rate is hard-coded.
- Admin CT-11 routes remain mounted; this plan only clarifies their descriptions.
- No production migration is executed from the workspace.
- Approved Material records cannot be silently downgraded or mutated through a working-version operation.

---

### Task 1: Align comment route perimeters and editorial contract descriptions

**Files:**
- Modify: `backend/src/routes/studio.routes.ts:56-68`
- Test: `backend/src/__tests__/comment-authority.test.ts`
- Modify: `docs/business-flows/INDEX.md:300-310,370-380`
- Modify: `docs/business-flows/12-comments.md` in the permission/transition section
- Modify: `postman/MangaFlow-API.postman_collection.json` in comment and voting request descriptions

**Interfaces:**
- Consumes: existing `resolveComment`, `reopenComment`, `addressComment`, and active Tantou checks.
- Produces: route-level role declarations that match runtime policy exactly.

- [ ] **Step 1: Add the failing route-perimeter assertions**

  Extend `describe("CT-03 resolve/reopen authority")` with these requests:

  ```ts
  const assistant = await loginAs("jun@beachread.jp");
  await request(createApp())
    .post("/api/comments/cmt-ct03/resolve")
    .set("Authorization", `Bearer ${assistant.accessToken}`)
    .send({})
    .expect(403);

  const mangaka = await loginAs("inoue@beachread.jp");
  await request(createApp())
    .post("/api/comments/cmt-ct03/reopen")
    .set("Authorization", `Bearer ${mangaka.accessToken}`)
    .send({})
    .expect(403);
  ```

  Keep the existing assertions that an unassigned Editor gets `TANTOU_ASSIGNMENT_REQUIRED` and the assigned Tantou can resolve/reopen.

- [ ] **Step 2: Run the focused test and verify the route contract fails**

  Run:

  ```bash
  npm --prefix backend test -- src/__tests__/comment-authority.test.ts
  ```

  Expected before the route change: the Assistant/Mangaka requests reach the controller rather than being rejected at the route perimeter. The assertions must fail or expose the broader middleware contract.

- [ ] **Step 3: Narrow the middleware to the documented actors**

  In `backend/src/routes/studio.routes.ts`, use exactly:

  ```ts
  router.post(
    "/comments/:commentId/resolve",
    requireExactRole("EDITOR") as any,
    resolveComment,
  );
  router.post(
    "/comments/:commentId/reopen",
    requireExactRole("EDITOR") as any,
    reopenComment,
  );
  ```

  Leave `address` as `requireExactRole("MANGAKA")`. Do not add Assistant address/resolve permissions.

- [ ] **Step 4: Update API and Postman descriptions**

  State that resolve/reopen require the assigned Tantou Editor and address requires the owning Mangaka. State that a tied vote opens a fresh Board re-vote. Remove `FORCE_STATUS` from the normal Proposal action description; retain it only in the explicit Admin override/deprecated compatibility request with its documented `410`/operational meaning.

- [ ] **Step 5: Run the focused test and commit**

  Run:

  ```bash
  npm --prefix backend test -- src/__tests__/comment-authority.test.ts
  git diff --check
  git add backend/src/routes/studio.routes.ts backend/src/__tests__/comment-authority.test.ts docs/business-flows/INDEX.md docs/business-flows/12-comments.md postman/MangaFlow-API.postman_collection.json
  git commit -m "fix: align comment route authorization contracts"
  ```

  Expected: all CT-03 tests pass and no route description claims a broader actor set than runtime policy.

---

### Task 2: Prevent Assistant and Tantou removal from orphaning work

**Files:**
- Create: `backend/src/services/assignment-workload.service.ts`
- Modify: `backend/src/controllers/series.controller.ts:575-594`
- Modify: `backend/src/services/tantou.service.ts:112-163`
- Create: `backend/src/__tests__/assignment-removal.test.ts`
- Modify: `docs/business-flows/INDEX.md` team/assignment section

**Interfaces:**
- Consumes: `StudioTaskModel`, `ChapterModel`, `StudioCommentModel`, `MaterialModel`, `SubmissionModel`, and canonical status values from `backend/src/db/models.ts`.
- Produces: `findAssistantAssignmentBlockers(seriesId, assistantId)` and `findTantouWorkloadBlockers(seriesId)`, each returning `Array<{ kind: string; id: string; status: string }>`.

- [ ] **Step 1: Write workload service tests and removal integration tests**

  In `backend/src/__tests__/assignment-removal.test.ts`, seed a dedicated Series and active Assistant/Editor members. Cover:

  ```ts
  it("returns 409 and leaves Assistant membership/task intact when an open task exists", async () => {
    await StudioTaskModel.create({
      id: "task-removal-open",
      seriesId: "series-removal",
      chapterId: "chapter-removal",
      assigneeId: "assistant-removal",
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(createApp())
      .delete("/api/series/series-removal/members/member-assistant-removal")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(409);

    expect(response.body.code).toBe("ACTIVE_ASSIGNMENTS_EXIST");
    expect(response.body.data.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "task-removal-open", status: "IN_PROGRESS" }),
      ]),
    );
    expect(await SeriesMemberModel.exists({ id: "member-assistant-removal" })).toBe(true);
  });
  ```

  Add the success case after changing the task to `CANCELLED`, and verify the member is removed and `Series.assistantIds` no longer contains the Assistant. Add Tantou cases for a `TANTOU_REVIEW` Chapter, an `OPEN` blocking comment, an `IN_REVIEW` Material, and an `EDITOR_REVIEW`/`MANGAKA_APPROVED` Submission; each must return `EDITOR_WORKLOAD_EXISTS` and leave `Series.editorId` and the active member unchanged. Add a success case after all blockers are cleared.

- [ ] **Step 2: Run the new tests before implementation**

  Run:

  ```bash
  npm --prefix backend test -- src/__tests__/assignment-removal.test.ts
  ```

  Expected: the new removal guards fail because the current controllers delete/deactivate immediately.

- [ ] **Step 3: Implement focused blocker queries**

  Extend `AppError` in `backend/src/lib/http.ts` with an optional `details?: Record<string, unknown>` property and constructor parameter, then have `errorHandler` expose it as `data` for non-500 errors:

  ```ts
  constructor(status: number, message: string, code = "APP_ERROR", details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
  ```

  In the JSON response, use `data: appError.status >= 500 ? null : (appError.details ?? null)` so existing error responses remain unchanged unless a caller supplies details.

  Create `backend/src/services/assignment-workload.service.ts` with these concrete policies:

  ```ts
  export type WorkloadBlocker = { kind: string; id: string; status: string };

  export async function findAssistantAssignmentBlockers(
    seriesId: string,
    assistantId: string,
  ): Promise<WorkloadBlocker[]>;

  export async function findTantouWorkloadBlockers(
    seriesId: string,
  ): Promise<WorkloadBlocker[]>;
  ```

  Assistant blockers are tasks in the Series assigned to that Assistant whose status is not one of `MANGAKA_APPROVED`, `EDITOR_APPROVED`, `REJECTED`, `CANCELLED`, or `COMPLETED`. Tantou blockers are Chapters in `TANTOU_REVIEW` or `REVISION_REQUIRED`, blocking Comments with status `OPEN` or `REOPENED`, Materials with status `IN_REVIEW`, and Submissions with `reviewStage: "EDITOR_REVIEW"` and status `MANGAKA_APPROVED`. Use `Promise.all`, map only stable IDs/statuses, and sort by `kind` then `id` for deterministic API responses.

- [ ] **Step 4: Guard both mutation paths before changing persistence**

  In `removeMember`, load the member before deleting it. If its role is `assistant`, call `findAssistantAssignmentBlockers`; throw:

  ```ts
  throw new AppError(
    409,
    "Assistant has active assignments that must be reassigned or cancelled first.",
    "ACTIVE_ASSIGNMENTS_EXIST",
  );
  ```

  Pass `{ blockers }` as the new `AppError` details value so the response is `{ success: false, data: { blockers }, code: "ACTIVE_ASSIGNMENTS_EXIST" }`; then delete only when the list is empty. In `removeTantouEditor`, call `findTantouWorkloadBlockers(seriesId)` after authorization/member lookup and before deactivation; throw `EDITOR_WORKLOAD_EXISTS` with the same details payload. Preserve existing audit events and denormalized array/editor cleanup.

- [ ] **Step 5: Run focused tests, typecheck, and commit**

  Run:

  ```bash
  npm --prefix backend test -- src/__tests__/assignment-removal.test.ts src/__tests__/tantou.test.ts
  npm --prefix backend run lint
  git diff --check
  git add backend/src/services/assignment-workload.service.ts backend/src/controllers/series.controller.ts backend/src/services/tantou.service.ts backend/src/__tests__/assignment-removal.test.ts docs/business-flows/INDEX.md
  git commit -m "fix: guard assignment removal with workload checks"
  ```

---

### Task 3: Make Material status transitions explicit and preserve approved versions

**Files:**
- Modify: `backend/src/services/material-status.service.ts`
- Modify: `backend/src/controllers/material.controller.ts:58-119`
- Create: `backend/src/__tests__/material-status-transition.test.ts`
- Modify: `backend/src/validators/material.schema.ts` only if the API schema needs a transition-specific command shape
- Modify: `docs/business-flows/07-material-management.md`
- Modify: `docs/business-flows/INDEX.md`

**Interfaces:**
- Consumes: `MaterialStatus`, existing owner/Tantou authorization helpers, and the `MaterialModel` version array.
- Produces: one pure transition policy used by `PATCH /api/materials/:id` and a deterministic immutable-approved-version conflict.

- [ ] **Step 1: Add pure transition tests**

  Test `isMaterialTransitionAllowed`/`assertMaterialTransition` for every pair in the selected matrix:

  ```ts
  expect(isMaterialTransitionAllowed("DRAFT", "ACTIVE")).toBe(true);
  expect(isMaterialTransitionAllowed("ACTIVE", "IN_REVIEW")).toBe(true);
  expect(isMaterialTransitionAllowed("IN_REVIEW", "ACTIVE")).toBe(true);
  expect(isMaterialTransitionAllowed("ACTIVE", "APPROVED")).toBe(true);
  expect(isMaterialTransitionAllowed("IN_REVIEW", "APPROVED")).toBe(true);
  expect(isMaterialTransitionAllowed("DRAFT", "APPROVED")).toBe(false);
  expect(isMaterialTransitionAllowed("APPROVED", "ACTIVE")).toBe(false);
  expect(isMaterialTransitionAllowed("ARCHIVED", "ACTIVE")).toBe(false);
  ```

  Treat same-status updates as no-ops and allow archive from each non-archived state.

- [ ] **Step 2: Run the new tests before implementation**

  Run:

  ```bash
  npm --prefix backend test -- src/__tests__/material-status-transition.test.ts
  ```

  Expected: the transition assertions fail because the current service only validates enum membership.

- [ ] **Step 3: Implement the transition policy**

  In `material-status.service.ts`, add a `Record<MaterialStatus, ReadonlySet<MaterialStatus>>` containing:

  ```ts
  DRAFT: ["DRAFT", "ACTIVE", "ARCHIVED"],
  ACTIVE: ["ACTIVE", "IN_REVIEW", "APPROVED", "ARCHIVED"],
  IN_REVIEW: ["IN_REVIEW", "ACTIVE", "APPROVED", "ARCHIVED"],
  APPROVED: ["APPROVED", "ARCHIVED"],
  ARCHIVED: ["ARCHIVED"],
  ```

  Export the pure predicate and throw `AppError(409, ..., "INVALID_TRANSITION")` from the controller when a requested target is not allowed. Keep actor authorization separate: owner/assigned Tantou for `ACTIVE`, `IN_REVIEW`, and `ARCHIVED`; assigned Tantou only for `APPROVED`.

- [ ] **Step 4: Protect approved material version history**

  In `addMaterialVersion`, reject a material whose top-level status is `APPROVED` with `409 APPROVED_MATERIAL_IMMUTABLE` before appending to `versions`. This preserves the approved record because the current schema has no separate working-material identity. Document that callers must create a new DRAFT material for replacement work.

- [ ] **Step 5: Add endpoint actor/state tests**

  Cover Mangaka `DRAFT → ACTIVE`, Mangaka `ACTIVE → IN_REVIEW`, Mangaka `IN_REVIEW → ACTIVE`, Mangaka `ACTIVE → APPROVED` returns `403 TANTOU_ASSIGNMENT_REQUIRED`, assigned Tantou approval succeeds, invalid status returns `400`, `DRAFT → APPROVED` returns `409 INVALID_TRANSITION`, and version append on `APPROVED` returns `409 APPROVED_MATERIAL_IMMUTABLE`. Assert that `metadata.status` is never written by the endpoint.

- [ ] **Step 6: Update material docs and commit**

  Replace the current partial table in `docs/business-flows/07-material-management.md` with the complete matrix and immutable-version rule. Update the INDEX summary to point to the same policy. Run:

  ```bash
  npm --prefix backend test -- src/__tests__/material-status-transition.test.ts src/__tests__/materials-mf032.test.ts src/__tests__/material-status-migration.test.ts
  npm --prefix backend run lint
  git diff --check
  git add backend/src/services/material-status.service.ts backend/src/controllers/material.controller.ts backend/src/__tests__/material-status-transition.test.ts backend/src/validators/material.schema.ts docs/business-flows/07-material-management.md docs/business-flows/INDEX.md
  git commit -m "fix: enforce canonical material transitions"
  ```

---

### Task 4: Make the Postman collection executable across roles

**Files:**
- Modify: `postman/MangaFlow-API.postman_collection.json`
- Modify: `postman/MangaFlow-Local.postman_environment.json`
- Create: `scripts/verify-postman-contract.mjs`
- Modify: `README.md` or `docs/business-flows/INDEX.md` with the local Postman run commands

**Interfaces:**
- Consumes: all currently mounted routes and seeded login credentials.
- Produces: role-specific token variables, complete entity ID capture, explicit happy/negative workflow folders, and a deterministic route-parity verifier.

- [ ] **Step 1: Add role variables and login capture scripts**

  Add collection/environment variables `activeActorRole`, `activeAccessToken`, `adminAccessToken`, `boardAccessToken`, `editorAccessToken`, `mangakaAccessToken`, and `assistantAccessToken`, plus matching refresh-token variables. Create one login request per role; each test script stores the response token under the role-specific variable and sets `activeActorRole`/`activeAccessToken` only for that selected login request.

- [ ] **Step 2: Capture every workflow entity ID**

  Add request test scripts to successful create requests. Each script reads both `{ data: { id } }` and `{ data: { entity: { id } } }` shapes and writes the correct variable: `proposalId`, `sessionId`, `seriesId`, `chapterId`, `pageId`, `regionId`, `taskId`, `submissionId`, `commentId`, `memberId`, `materialId`, `rateId`, `noteId`, `earningId`, or `notificationId`. Use collection variables consistently; do not overwrite role tokens while capturing IDs.

- [ ] **Step 3: Organize canonical, negative, and deprecated requests**

  Add folders named `Canonical Happy Path`, `Negative Authorization & State`, and `Deprecated Compatibility`. Move or duplicate existing requests without deleting mounted-route coverage. Negative requests must assert the expected status/code for Assistant comment resolve, Mangaka comment reopen, direct `FORCE_STATUS`, generic submission creation, Mangaka Material approval, DRAFT-to-APPROVED, and special tie-break removal. Mark Admin override and old aliases as operational/deprecated in their descriptions.

- [ ] **Step 4: Add deterministic collection route parity validation**

  Create `scripts/verify-postman-contract.mjs` that recursively extracts method/path pairs from the collection, recursively extracts mounted method/path pairs from `backend/src/routes/**/*.ts` including `router.use` mounts used by `backend/src/routes/index.ts`, normalizes `:param` and `{{variable}}` segments to `{param}`, and exits non-zero with sorted missing/extra pairs. The script must also parse both Postman JSON files and assert that all five role token variables exist.

- [ ] **Step 5: Verify Postman artifacts and commit**

  Run:

  ```bash
  node scripts/verify-postman-contract.mjs
  node -e "JSON.parse(require('fs').readFileSync('postman/MangaFlow-API.postman_collection.json','utf8')); JSON.parse(require('fs').readFileSync('postman/MangaFlow-Local.postman_environment.json','utf8')); console.log('postman json ok')"
  git diff --check
  git add postman/MangaFlow-API.postman_collection.json postman/MangaFlow-Local.postman_environment.json scripts/verify-postman-contract.mjs docs/business-flows/INDEX.md
  git commit -m "test: make Postman workflow multi-role executable"
  ```

---

### Task 5: Keep frontend behavior on canonical backend contracts

**Files:**
- Modify: `tests/business-flow-contracts.spec.ts`
- Modify: `src/features/series/detail/model/comment-actions.ts` only if endpoint mapping needs a typed request descriptor
- Modify: `src/features/series/detail/model/series-material-patch.ts` only if the top-level status contract needs a type correction
- Modify: `src/shared/api/production.ts` and `src/features/series/api/series-queries.ts` only if a regression test exposes a non-POST or metadata-status request
- Modify: `docs/business-flows/INDEX.md` only for final frontend evidence links

**Interfaces:**
- Consumes: backend readiness response, canonical comment endpoints, and `MaterialItem.status`.
- Produces: frontend regression coverage proving UI helpers cannot recreate backend blockers or write legacy status fields.

- [ ] **Step 1: Add frontend contract assertions**

  Extend `tests/business-flow-contracts.spec.ts` with:

  ```ts
  expect(isCanonicalChapterReady({ ready: true, items: [] })).toBe(true);
  expect(isCanonicalChapterReady({ ready: true, items: [{ key: "deadline", passed: false }] })).toBe(true);
  expect(getCommentManagementEndpoint("comment-1", "OPEN")).toBe("/comments/comment-1/resolve");
  expect(getCommentManagementEndpoint("comment-1", "ADDRESSED")).toBe("/comments/comment-1/reopen");
  expect(toSeriesMaterialApiPatch({ status: "ACTIVE" })).toMatchObject({ status: "ACTIVE" });
  expect(toSeriesMaterialApiPatch({ status: "APPROVED" })).not.toHaveProperty("metadata.status");
  ```

  Keep the existing mapping assertions for both `ACTIVE` and `APPROVED`. If source inspection is needed to prove the HTTP method, factor a small pure request descriptor used by `studioApi`, `series-queries`, and the test; the descriptor must return `method: "POST"` and the canonical `/comments/:id/resolve` or `/reopen` path.

- [ ] **Step 2: Run the browser contract suite**

  Run:

  ```bash
  npx playwright test tests/business-flow-contracts.spec.ts
  ```

  Expected: all readiness, comment endpoint, Material mapping, and top-level patch assertions pass.

- [ ] **Step 3: Run root lint/typecheck/build and commit**

  Run:

  ```bash
  npm run lint
  npm run typecheck
  npm run build
  git diff --check
  git add tests/business-flow-contracts.spec.ts src/features/series/detail/model/comment-actions.ts src/features/series/detail/model/series-material-patch.ts src/shared/api/production.ts src/features/series/api/series-queries.ts
  git commit -m "test: cover canonical frontend workflow contracts"
  ```

---

### Task 6: Full verification and release evidence

**Files:**
- Modify: `docs/CODE-TODO.md` only to close findings that are actually proven by tests
- Modify: `docs/DESIGN.md` only to align the final Material/Comment contract wording
- Create: `docs/reports/2026-07-27-workflow-correctness-followup-verification.md`

**Interfaces:**
- Consumes: commits and test outputs from Tasks 1–5.
- Produces: auditable evidence for backend, frontend, mobile, Postman, architecture, and diff checks.

- [ ] **Step 1: Run backend targeted and full suites**

  ```bash
  npm --prefix backend test -- src/__tests__/comment-authority.test.ts src/__tests__/assignment-removal.test.ts src/__tests__/tantou.test.ts src/__tests__/material-status-transition.test.ts
  npm --prefix backend test
  npm --prefix backend run lint
  npm --prefix backend run build
  ```

- [ ] **Step 2: Run frontend, mobile, E2E, architecture, and security checks**

  ```bash
  npm run lint
  npm run typecheck
  npm run build
  npm run audit:architecture
  npx playwright test
  npm --prefix mobile test
  npm --prefix mobile run lint
  npm --prefix mobile run build
  npm audit --audit-level=high
  ```

  If an environment-only command cannot run, record the exact command and blocker in the verification report; do not call it passing.

- [ ] **Step 3: Verify repository and Postman invariants**

  ```bash
  node scripts/verify-postman-contract.mjs
  git diff --check
  git status --short
  git log -5 --oneline
  ```

  Confirm the only pre-existing unrelated worktree change remains `D test-results/admin-users-reference.png`; do not stage or restore it.

- [ ] **Step 4: Write verification report and commit**

  Record each command, result, test count where available, and any environment-only limitation in `docs/reports/2026-07-27-workflow-correctness-followup-verification.md`. Mark a requirement PASS only when the command/test directly covers it. Update `docs/CODE-TODO.md`/`docs/DESIGN.md` only when the evidence proves the corresponding finding is resolved. Then run:

  ```bash
  git diff --check
  git add docs/reports/2026-07-27-workflow-correctness-followup-verification.md docs/CODE-TODO.md docs/DESIGN.md
  git commit -m "docs: record workflow correctness verification"
  ```

- [ ] **Step 5: Final review**

  Review `git diff HEAD~5..HEAD`, verify no secrets or production database commands were added, confirm the unrelated screenshot deletion is unstaged, and only then report the workflow as complete.
