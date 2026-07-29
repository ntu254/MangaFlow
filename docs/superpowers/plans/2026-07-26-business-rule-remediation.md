# Business-rule remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Enforce the approved task, comment, voting, assignment, outbox, and at-risk business rules without external infrastructure.

**Architecture:** Keep workflow state transitions in \`workflow.service.ts\`, controller request/record guards in controllers, and the earnings index as the final integrity boundary. The server owns a small in-process outbox runner.

**Tech Stack:** TypeScript, Express 5, Mongoose 9/MongoDB transactions, Vitest, Supertest.

## Global Constraints

- No dependencies, queues, email delivery, cookie auth, rate limiting, or payroll.
- \`START\` is valid only from \`TODO\`; \`REOPEN\` only from \`REVISION_REQUESTED\`.
- \`Earning.taskId\` is unique sparse after duplicate repair.
- \`regionId\` is immutable after creation; scope changes cancel then recreate the task.
- Blocking comments require assigned Tantou; reopen only from \`ADDRESSED\` or \`RESOLVED\`.
- Outbox \`SENT\` means its structured-log handler accepted the event.
- At-risk requests require an at-risk \`rankingId\` belonging to the URL series.

---

### Task 1: Protect task transitions and canonical earnings

**Files:**
- Modify: \`backend/src/services/workflow.service.ts:121-173,2071-2215,2962-3180\`
- Modify: \`backend/src/db/models.ts\`
- Create: \`backend/src/scripts/repair-duplicate-task-earnings.ts\`
- Test: \`backend/src/__tests__/workflow.test.ts\`

**Interfaces:** Produce \`repairDuplicateTaskEarnings(apply: boolean): Promise<{ retained: number; reversed: number }>\`. \`START\` rejects non-\`TODO\` with \`INVALID_TRANSITION\`.

- [ ] **Step 1: Write failing tests**

\`\`\`ts
it("rejects START after Mangaka approval", async () => {
  await StudioTaskModel.updateOne({ id: taskId }, { $set: { status: "MANGAKA_APPROVED" } });
  const res = await request(createApp()).post(\`/api/studio/tasks/\${taskId}/actions/START\`).set(auth(assistant));
  expect(res.status).toBe(409);
  expect(res.body.code).toBe("INVALID_TRANSITION");
});
\`\`\`

- [ ] **Step 2: Run and verify failure**

Run: \`npm --prefix backend test -- workflow.test.ts\`

- [ ] **Step 3: Implement minimal rules**

Add the source-status check before locking a region. Add \`earningSchema.index({ taskId: 1 }, { unique: true, sparse: true })\`. Upsert approved earnings by \`taskId\`. The repair script groups non-empty task IDs, retains the earliest record, marks later records \`REVERSED\`, clears \`taskId\`, and records \`metadata.originalTaskId\` and \`metadata.reversalOf\`; it is dry-run unless passed \`--apply\`.

- [ ] **Step 4: Verify**

Run: \`npm --prefix backend test -- workflow.test.ts && npm --prefix backend run lint\`

- [ ] **Step 5: Commit**

\`\`\`bash
git add backend/src/services/workflow.service.ts backend/src/db/models.ts backend/src/scripts/repair-duplicate-task-earnings.ts backend/src/__tests__/workflow.test.ts
git commit -m "fix: enforce task earnings integrity"
\`\`\`

### Task 2: Enforce blocking-comment authority

**Files:**
- Modify: \`backend/src/controllers/studio.controller.ts:68-149,423-495\`
- Modify: \`backend/src/services/workflow.service.ts:1370-1389\`
- Test: \`backend/src/__tests__/authorization-perimeter.test.ts\`, \`backend/src/__tests__/workflow.test.ts\`

**Interfaces:** Produce an assigned-Tantou blocking guard used by create, patch, resolve, and reopen.

- [ ] **Step 1: Write failing tests**

\`\`\`ts
it("rejects a Mangaka raising a blocking comment", async () => {
  const res = await request(createApp()).post("/api/comments").set(auth(mangaka))
    .send({ chapterId, body: "block", isBlocking: true });
  expect(res.status).toBe(403);
});
it("rejects reopening an OPEN comment", async () => {
  const res = await request(createApp()).post(\`/api/comments/\${commentId}/reopen\`).set(auth(editor));
  expect(res.body.code).toBe("INVALID_TRANSITION");
});
\`\`\`

- [ ] **Step 2: Run and verify failure**

Run: \`npm --prefix backend test -- authorization-perimeter.test.ts workflow.test.ts\`

- [ ] **Step 3: Implement minimal rules**

Resolve the comment target Series; accept \`isBlocking: true\` only if its \`editorId\` equals the actor. Require that same assignment for resolve/reopen, including when no editor is assigned. Filter chapter blockers to assigned-editor comments. Permit reopen only from \`ADDRESSED\` or \`RESOLVED\`.

- [ ] **Step 4: Verify**

Run: \`npm --prefix backend test -- authorization-perimeter.test.ts workflow.test.ts && npm --prefix backend run lint\`

- [ ] **Step 5: Commit**

\`\`\`bash
git add backend/src/controllers/studio.controller.ts backend/src/services/workflow.service.ts backend/src/__tests__/authorization-perimeter.test.ts backend/src/__tests__/workflow.test.ts
git commit -m "fix: restrict blocking comment authority"
\`\`\`

### Task 3: Restore proposals when voting is cancelled

**Files:**
- Modify: \`backend/src/services/workflow.service.ts:2950-2960\`
- Test: \`backend/src/__tests__/board.test.ts\`

**Interfaces:** \`cancelVotingSession(req, sessionId)\` cancels the session and returns all linked open-board proposals to \`PENDING_BOARD\`.

- [ ] **Step 1: Write failing test**

\`\`\`ts
it("returns an open proposal to PENDING_BOARD when its session is cancelled", async () => {
  await request(createApp()).post(\`/api/voting-sessions/\${sessionId}/cancel\`).set(auth(chair)).expect(200);
  expect((await ProposalModel.findOne({ id: proposalId }).lean())?.status).toBe("PENDING_BOARD");
});
\`\`\`

- [ ] **Step 2: Run and verify failure**

Run: \`npm --prefix backend test -- board.test.ts\`

- [ ] **Step 3: Implement transaction**

Use \`runWorkflowTransaction\`, conditionally cancel \`OPEN\`/\`TIE_BREAK_REQUIRED\` sessions, derive \`proposalId\` and \`proposalIds\`, and update only linked \`BOARD_REVIEW\` proposals to \`PENDING_BOARD\`. Preserve votes and snapshots.

- [ ] **Step 4: Verify and commit**

Run: \`npm --prefix backend test -- board.test.ts && npm --prefix backend run lint\`

\`\`\`bash
git add backend/src/services/workflow.service.ts backend/src/__tests__/board.test.ts
git commit -m "fix: restore proposal when voting is cancelled"
\`\`\`

### Task 4: Close uncontrolled task mutation and validate assignment

**Files:**
- Modify: \`backend/src/controllers/studio.controller.ts:242-390\`
- Modify: \`backend/src/services/workflow.service.ts:2154-2167\`
- Test: \`backend/src/__tests__/authorization-perimeter.test.ts\`

**Interfaces:** Bulk task patch returns 410. Task creation/reassignment accepts only an active Assistant SeriesMember. Single patch cannot change status, assignee, or region.

- [ ] **Step 1: Write failing tests**

\`\`\`ts
it("rejects assigning a task to a non-member Editor", async () => {
  const res = await request(createApp()).post("/api/studio/tasks").set(auth(owner))
    .send({ chapterId, assigneeId: editorId, title: "Tone" });
  expect(res.status).toBe(403);
});
it("retires the bulk task patch endpoint", async () => {
  await request(createApp()).patch("/api/studio/tasks").set(auth(owner))
    .send({ id: taskId, status: "MANGAKA_APPROVED" }).expect(410);
});
\`\`\`

- [ ] **Step 2: Run and verify failure**

Run: \`npm --prefix backend test -- authorization-perimeter.test.ts\`

- [ ] **Step 3: Implement minimum boundary checks**

Replace \`patchTasks\` with \`AppError(410, ..., "ENDPOINT_DEPRECATED")\`. Remove \`assigneeId\` and \`regionId\` from single-patch allowed fields. For create/reassign, require \`User.role === "ASSISTANT"\` and \`SeriesMemberModel.findOne({ seriesId, userId, role: "assistant", status: "active" })\`.

- [ ] **Step 4: Verify and commit**

Run: \`npm --prefix backend test -- authorization-perimeter.test.ts && npm --prefix backend run lint\`

\`\`\`bash
git add backend/src/controllers/studio.controller.ts backend/src/services/workflow.service.ts backend/src/__tests__/authorization-perimeter.test.ts
git commit -m "fix: protect task assignment and patching"
\`\`\`

### Task 5: Run existing outbox processing safely

**Files:**
- Create: \`backend/src/services/outbox-runner.service.ts\`
- Modify: \`backend/src/server.ts:1-15\`
- Test: \`backend/src/__tests__/p0-workflow-refactor.test.ts\`

**Interfaces:** Produce \`startOutboxRunner(intervalMs?: number): () => void\`.

- [ ] **Step 1: Write failing test**

\`\`\`ts
it("delivers due events once and stops after cleanup", async () => {
  const stop = startOutboxRunner(1);
  await waitFor(async () => expect((await OutboxEventModel.findOne({ id: eventId }).lean())?.status).toBe("SENT"));
  stop();
});
\`\`\`

- [ ] **Step 2: Run and verify failure**

Run: \`npm --prefix backend test -- p0-workflow-refactor.test.ts\`

- [ ] **Step 3: Implement runner**

Immediately run one batch and schedule an interval. Use a boolean overlap guard. Its handler calls \`logger.info("outbox.delivered", { id, type, aggregateType, aggregateId })\`. Return an idempotent stop function. Start after seed and clear it on SIGINT/SIGTERM.

- [ ] **Step 4: Verify and commit**

Run: \`npm --prefix backend test -- p0-workflow-refactor.test.ts && npm --prefix backend run lint\`

\`\`\`bash
git add backend/src/services/outbox-runner.service.ts backend/src/server.ts backend/src/__tests__/p0-workflow-refactor.test.ts
git commit -m "fix: run outbox events in process"
\`\`\`

### Task 6: Persist specific at-risk ranking decisions

**Files:**
- Modify: \`backend/src/controllers/mobile.controller.ts:96-108\`
- Test: \`backend/src/__tests__/board.test.ts\`

**Interfaces:** \`POST /board/series/:seriesId/at-risk-decisions\` requires \`{ rankingId, decision, note? }\`.

- [ ] **Step 1: Write failing tests**

\`\`\`ts
it("persists an at-risk decision on the requested ranking", async () => {
  await request(createApp()).post(\`/api/board/series/\${seriesId}/at-risk-decisions\`)
    .set(auth(chair)).send({ rankingId, decision: "CONTINUE", note: "Recovering" }).expect(200);
  expect((await RankingModel.findOne({ id: rankingId }).lean())?.metadata.atRiskDecision.decision).toBe("CONTINUE");
});
it("rejects a ranking from another series", async () => {
  await request(createApp()).post(\`/api/board/series/\${seriesId}/at-risk-decisions\`)
    .set(auth(chair)).send({ rankingId: otherRankingId, decision: "CONTINUE" }).expect(409);
});
\`\`\`

- [ ] **Step 2: Run and verify failure**

Run: \`npm --prefix backend test -- board.test.ts\`

- [ ] **Step 3: Implement targeted persistence**

Require non-empty \`rankingId\` and decision. Load Ranking; return 404 if absent, 409 \`RANKING_SERIES_MISMATCH\` for another series, and 409 \`RANKING_NOT_AT_RISK\` unless \`atRisk === true\` or \`status === "AT_RISK"\`. Write \`metadata.atRiskDecision = { decision, note, decidedById, decidedByName, decidedAt }\` before audit/notification.

- [ ] **Step 4: Verify all backend work and commit**

Run: \`npm --prefix backend test && npm --prefix backend run lint\`

\`\`\`bash
git add backend/src/controllers/mobile.controller.ts backend/src/__tests__/board.test.ts
git commit -m "fix: persist at-risk ranking decisions"
\`\`\`

