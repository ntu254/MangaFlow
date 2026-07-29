# P0 Workflow Correctness (CT-01/02/03) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three P0 record-level workflow-correctness defects (CT-01/02/03) so the code matches the canonical business rules, each with focused tests and its directly-affected doc updates.

**Architecture:** Backend Express/Mongoose. Fix at shared guards/services (root cause). CT-01/03 touch `studio.controller.ts` comment guards; CT-02 rewrites `cancelVotingSession` in `workflow.service.ts` to run in a transaction and fail closed. New error code `TANTOU_ASSIGNMENT_REQUIRED` (AppError `code` is a free string — no central typing to change).

**Tech Stack:** Node ESM, Express 5, Mongoose, Zod, Vitest + Supertest + mongodb-memory-server.

## Global Constraints

- Scope is exactly CT-01/02/03. No P1/P2/P3 work; no structural refactor of `workflow.service.ts` / `models.ts`.
- Branch `fix/p0-workflow-correctness` already contains design-spec commits (`6adf45b`, `2b3e9e4`). Implementation = **exactly three green commits**, one per CT. No red-state commit.
- Per-commit TDD loop: write test → run and confirm expected failure → implement → run focused tests → run relevant regression tests → commit green.
- Canonical backend test command: **`npm test`** (from `backend/`, = `vitest run`). Focused run: `npx vitest run <file>` from `backend/`. Record exact command + result in the PR. Final full `npm test` must pass before the PR.
- Each implementation commit also updates ONLY the docs directly affected by that CT (mark CODE-TODO item implemented; keep the FLOW-GAP ID but mark resolved; replace obsolete "current implementation" text; update the compliance matrix). Do not remove FLOW-GAP IDs or rewrite unrelated docs. If PR #64 (v2 docs) has merged, apply the same edits to the merged v2 docs.
- Seeded logins (password === email): MANGAKA `inoue@beachread.jp`, ASSISTANT `jun@beachread.jp`, Tantou EDITOR `editor@mangaflow.local` (id `u-editor`), Board Chair `board@beachread.jp`. Series in seed carry `editorId: "u-editor"`.
- Do NOT change `findChapterBlockingComments` detection or make it depend on the author's *current* Tantou assignment (a blocking comment must stay valid after Tantou reassignment). The write gate does not repair historical records.

---

### Task 1: CT-01 — Restrict blocking-comment authority to the assigned Tantou

**Files:**
- Modify: `backend/src/controllers/studio.controller.ts` (add guard ~after line 149; gate `createComment` ~423-439 and `patchComment` ~441-455)
- Test: `backend/src/__tests__/comment-authority.test.ts` (create)
- Docs: `docs/business-flows/12-comments.md`, `docs/business-flows/04-chapter-workflow.md`, `docs/business-flows/INDEX.md`, `docs/CODE-TODO.md`

**Interfaces:**
- Consumes: `resolveCommentSeries(target)` (`studio.controller.ts:88`), `requireActor(req)`, `AppError`.
- Produces: `assertCanRaiseBlockingComment(req, target)` — used by create + patch.

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/comment-authority.test.ts`. Follow the existing suite pattern (see `production-completion.test.ts`): `MongoMemoryServer`, `beforeEach` drops DB + `seedDatabase()`, `loginAs(email)` posts to `/api/auth/login`. Seed a Series with `editorId: "u-editor"` and a Chapter, then:

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { SeriesModel, ChapterModel, StudioCommentModel } from "../db/models.js";

let mongo: MongoMemoryServer;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });
beforeEach(async () => {
  if (!mongoose.connection.db) throw new Error("Mongo not ready");
  await mongoose.connection.db.dropDatabase();
  await seedDatabase();
  await SeriesModel.create({ id: "s-ct01", slug: "s-ct01", title: "CT01", authorId: "u-mangaka", authorName: "Inoue", editorId: "u-editor", status: "ONGOING" });
  await ChapterModel.create({ id: "ch-ct01", seriesId: "s-ct01", title: "Ch1", status: "IN_PRODUCTION", pages: [] });
});
async function loginAs(email: string) {
  const res = await request(createApp()).post("/api/auth/login").send({ email, password: email });
  return res.body.data as { accessToken: string };
}
const blockingBody = { targetType: "CHAPTER", targetId: "ch-ct01", chapterId: "ch-ct01", seriesId: "s-ct01", body: "Blocker", isBlocking: true };

describe("CT-01 blocking-comment authority", () => {
  it("rejects a non-Tantou creating a blocking comment (403 TANTOU_ASSIGNMENT_REQUIRED)", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const res = await request(createApp()).post("/api/comments")
      .set("Authorization", `Bearer ${mangaka.accessToken}`).send(blockingBody).expect(403);
    expect(res.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
    expect(await StudioCommentModel.countDocuments({ chapterId: "ch-ct01", isBlocking: true })).toBe(0);
  });
  it("allows the assigned Tantou to create a blocking comment", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const res = await request(createApp()).post("/api/comments")
      .set("Authorization", `Bearer ${editor.accessToken}`).send(blockingBody).expect(201);
    expect(res.body.data.isBlocking).toBe(true);
  });
  it("allows any otherwise-authorized actor to create a non-blocking comment", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp()).post("/api/comments")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...blockingBody, isBlocking: false }).expect(201);
  });
  it("rejects a non-Tantou patch that raises a comment to blocking", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const created = await request(createApp()).post("/api/comments")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...blockingBody, isBlocking: false }).expect(201);
    await request(createApp()).patch(`/api/comments/${created.body.data.id}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`).send({ isBlocking: true }).expect(403);
  });
});
```

- [ ] **Step 2: Run the test and confirm expected failure**

Run: `npx vitest run src/__tests__/comment-authority.test.ts` (from `backend/`)
Expected: FAIL — non-Tantou create currently returns 201 (no gate) and the comment persists.

- [ ] **Step 3: Implement the guard and gates**

In `studio.controller.ts`, add after `assertEditorCanManageComment` (after line 149):

```ts
async function assertCanRaiseBlockingComment(req: AuthedRequest, target: any) {
  const actor = requireActor(req);
  const series = (await resolveCommentSeries(target)) as any;
  if (!(actor.role === "EDITOR" && series?.editorId && series.editorId === actor.id)) {
    throw new AppError(
      403,
      "Only the assigned Tantou can create or raise a blocking editorial comment.",
      "TANTOU_ASSIGNMENT_REQUIRED",
    );
  }
}
```

In `createComment` (after `await assertCanReadCommentTarget(actor, body);`, before `StudioCommentModel.create`):

```ts
  if (body.isBlocking || (body as any).blocking) {
    await assertCanRaiseBlockingComment(req, body);
  }
```

In `patchComment` (after `const patch = sanitizePatch(...)`, before the `ok(res, await patchById(...))`):

```ts
  const raisingBlocking =
    (patch.isBlocking === true || (patch as any).blocking === true) &&
    !((comment as any).isBlocking || (comment as any).blocking);
  if (raisingBlocking) {
    await assertCanRaiseBlockingComment(req, comment);
  }
```

- [ ] **Step 4: Run focused test to green**

Run: `npx vitest run src/__tests__/comment-authority.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Run regression + lint**

Run: `npm run lint` then `npx vitest run src/__tests__/workflow.test.ts src/__tests__/production-completion.test.ts src/__tests__/authorization-perimeter.test.ts`
Expected: PASS. If any test seeded a non-Tantou blocking comment via the API and expected 201, update it to either author as `editor@mangaflow.local` on a Tantou-assigned series or insert the blocking comment directly via `StudioCommentModel.create` (legacy/direct path is intentionally not gated). Note each change.

- [ ] **Step 6: Update the CT-01 docs**

- `docs/CODE-TODO.md`: in the summary table set CT-01 **Status: Done**; in the CT-01 detail set **Status: Implemented**; in the "Current implementation compliance" matrix change the *Blocking-comment write authorization* row from **FAIL** to **PASS (implemented — assigned-Tantou gate on create/patch, `studio.controller.ts`)**.
- `docs/business-flows/INDEX.md`: in the Gap Register mark FLOW-GAP-01 **Resolved** (keep the ID and evidence); in invariant 14 change ⚠️→✅ for the create/raise clause (keep FLOW-GAP-03 ⚠️ for resolve/reopen until Task 3).
- `docs/business-flows/12-comments.md`: replace the FLOW-GAP-01 "Confirmed current behavior" block's forward-looking wording with the implemented behavior (assigned-Tantou-only create/raise; historical records handled separately), keeping the FLOW-GAP-01 heading/ID marked Resolved.
- `docs/business-flows/04-chapter-workflow.md`: no rule change; if it references FLOW-GAP-01 as open, mark it resolved.

- [ ] **Step 7: Commit (green)**

```bash
git add backend/src/controllers/studio.controller.ts backend/src/__tests__/comment-authority.test.ts docs/CODE-TODO.md docs/business-flows/INDEX.md docs/business-flows/12-comments.md docs/business-flows/04-chapter-workflow.md
git commit -m "fix(CT-01): restrict blocking-comment authority to assigned Tantou"
```

---

### Task 2: CT-02 — VotingSession cancel restores the Proposal (fail closed)

**Files:**
- Modify: `backend/src/services/workflow.service.ts` (`cancelVotingSession`)
- Test: `backend/src/__tests__/voting-cancel.test.ts` (create)
- Docs: `docs/business-flows/02-proposal-lifecycle.md`, `docs/business-flows/06-board-governance.md`, `docs/business-flows/INDEX.md`, `docs/CODE-TODO.md`

**Interfaces:**
- Consumes: `runWorkflowTransaction` (`workflow.service.ts:1322`), `VotingSessionModel`, `ProposalModel`, `audit(req, action, type, id, meta, tx)`, `requireBoardChairActor`, `ensureActor`, `toObject`.
- Route: `POST /api/voting-sessions/:id/cancel` (Chair only) already wired.

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/voting-cancel.test.ts`. Setup: create a Proposal `PENDING_BOARD`, chair creates a session (`POST /api/voting-sessions {proposalId}` → proposal becomes `BOARD_REVIEW`), seed two `ProposalVoteModel` votes, then:

```ts
// ...standard MongoMemoryServer + loginAs boilerplate (see Task 1)...
import { ProposalModel, VotingSessionModel, ProposalVoteModel } from "../db/models.js";

async function openSession(chairToken: string, proposalId: string) {
  await ProposalModel.create({ id: proposalId, title: "P", authorId: "u-mangaka", authorName: "Inoue", status: "PENDING_BOARD" });
  const s = await request(createApp()).post("/api/voting-sessions")
    .set("Authorization", `Bearer ${chairToken}`).send({ proposalId }).expect(201);
  return s.body.data.id as string;
}

describe("CT-02 voting-session cancel restores Proposal", () => {
  it("cancels an OPEN session and restores the Proposal to PENDING_BOARD, keeping votes", async () => {
    const chair = await loginAs("board@beachread.jp");
    const sessionId = await openSession(chair.accessToken, "prop-cancel-1");
    await ProposalVoteModel.create({ id: "pv-c1", sessionId, proposalId: "prop-cancel-1", voterId: "u-board-2", voterName: "Sato", voterRole: "BOARD", decision: "APPROVE", votedAt: new Date() });
    await request(createApp()).post(`/api/voting-sessions/${sessionId}/cancel`)
      .set("Authorization", `Bearer ${chair.accessToken}`).send({}).expect(200);
    expect((await VotingSessionModel.findOne({ id: sessionId }).lean() as any).status).toBe("CANCELLED");
    expect((await ProposalModel.findOne({ id: "prop-cancel-1" }).lean() as any).status).toBe("PENDING_BOARD");
    expect(await ProposalVoteModel.countDocuments({ sessionId })).toBe(1);
  });
  it("fails closed when the linked Proposal is not BOARD_REVIEW (409, session unchanged)", async () => {
    const chair = await loginAs("board@beachread.jp");
    const sessionId = await openSession(chair.accessToken, "prop-cancel-2");
    await ProposalModel.updateOne({ id: "prop-cancel-2" }, { $set: { status: "APPROVED" } });
    await request(createApp()).post(`/api/voting-sessions/${sessionId}/cancel`)
      .set("Authorization", `Bearer ${chair.accessToken}`).send({}).expect(409);
    expect((await VotingSessionModel.findOne({ id: sessionId }).lean() as any).status).not.toBe("CANCELLED");
  });
  it("allows a fresh session after cancellation that does not count the cancelled session's votes", async () => {
    const chair = await loginAs("board@beachread.jp");
    const sessionId = await openSession(chair.accessToken, "prop-cancel-3");
    await ProposalVoteModel.create({ id: "pv-c3", sessionId, proposalId: "prop-cancel-3", voterId: "u-board-2", voterName: "Sato", voterRole: "BOARD", decision: "APPROVE", votedAt: new Date() });
    await request(createApp()).post(`/api/voting-sessions/${sessionId}/cancel`)
      .set("Authorization", `Bearer ${chair.accessToken}`).send({}).expect(200);
    const s2 = await request(createApp()).post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`).send({ proposalId: "prop-cancel-3" }).expect(201);
    expect(s2.body.data.id).not.toBe(sessionId);
    // votes are scoped to their session: the new session sees none from the cancelled one
    expect(await ProposalVoteModel.countDocuments({ sessionId: s2.body.data.id })).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test and confirm expected failure**

Run: `npx vitest run src/__tests__/voting-cancel.test.ts`
Expected: FAIL — after cancel the Proposal stays `BOARD_REVIEW`; the fail-closed 409 case cancels anyway.

- [ ] **Step 3: Implement fail-closed transactional cancel**

Replace `cancelVotingSession` in `workflow.service.ts` with:

```ts
export async function cancelVotingSession(req: AuthedRequest, sessionId: string) {
  const actor = ensureActor(req);
  requireBoardChairActor(actor);
  const existing = await VotingSessionModel.findOne({ id: sessionId }).lean();
  if (!existing) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  return runWorkflowTransaction(async (tx) => {
    const session = await VotingSessionModel.findOne({ id: sessionId }).session(tx);
    if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
    if (!["OPEN", "TIE_BREAK_REQUIRED"].includes(String((session as any).status))) {
      throw new AppError(409, "Only an active voting session can be cancelled.", "INVALID_TRANSITION");
    }
    const proposal = await ProposalModel.findOne({ id: (session as any).proposalId }).session(tx);
    if (!proposal || String((proposal as any).status) !== "BOARD_REVIEW") {
      throw new AppError(409, "Proposal is not in a cancellable Board review state.", "INVALID_TRANSITION");
    }
    (session as any).status = "CANCELLED";
    (session as any).cancelledAt = new Date();
    await session.save({ session: tx });
    (proposal as any).status = "PENDING_BOARD";
    await proposal.save({ session: tx });
    await audit(req, "voting_session.cancel", "voting_session", sessionId, { proposalId: (session as any).proposalId }, tx);
    return toObject(session);
  });
}
```

- [ ] **Step 4: Run focused test to green**

Run: `npx vitest run src/__tests__/voting-cancel.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Run regression + lint**

Run: `npm run lint` then `npx vitest run src/__tests__/board.test.ts src/__tests__/p0-workflow-refactor.test.ts`
Expected: PASS. If `p0-workflow-refactor.test.ts` has a cancel test asserting the old behavior (session `CANCELLED`, proposal unchanged), update it to expect Proposal `PENDING_BOARD`. Note the change.

- [ ] **Step 6: Update the CT-02 docs**

- `docs/CODE-TODO.md`: CT-02 **Status: Done/Implemented**; compliance matrix *VotingSession cancellation* row FAIL → **PASS (implemented — transactional restore to `PENDING_BOARD`, `workflow.service.ts`)**.
- `docs/business-flows/INDEX.md`: Gap Register FLOW-GAP-02 **Resolved**; invariant 13 ⚠️→✅.
- `docs/business-flows/02-proposal-lifecycle.md` and `06-board-governance.md`: change the FLOW-GAP-02 blocks from "CURRENT: Proposal stays BOARD_REVIEW" to the implemented "cancel restores `PENDING_BOARD` (transactional, fail-closed)"; keep the FLOW-GAP-02 ID marked Resolved.

- [ ] **Step 7: Commit (green)**

```bash
git add backend/src/services/workflow.service.ts backend/src/__tests__/voting-cancel.test.ts docs/CODE-TODO.md docs/business-flows/INDEX.md docs/business-flows/02-proposal-lifecycle.md docs/business-flows/06-board-governance.md
git commit -m "fix(CT-02): voting-session cancel restores Proposal to PENDING_BOARD (transactional, fail-closed)"
```

---

### Task 3: CT-03 — Enforce assigned-Tantou on resolve/reopen + reopen precondition

**Files:**
- Modify: `backend/src/controllers/studio.controller.ts` (`assertEditorCanManageComment` → split; `resolveComment`, `reopenComment` call sites)
- Test: `backend/src/__tests__/comment-authority.test.ts` (extend from Task 1)
- Docs: `docs/business-flows/12-comments.md`, `docs/business-flows/INDEX.md`, `docs/CODE-TODO.md`

**Interfaces:**
- Consumes: `isTantouBlockingComment`, `resolveCommentSeries`, `requireActor`.
- Produces: `assertCanResolveTantouBlockingComment(req, comment)`, `assertCanReopenTantouBlockingComment(req, comment)`.
- Caller audit (already done): `assertEditorCanManageComment` is called only at `resolveComment` (`:462`) and `reopenComment` (`:488`) — safe to split.

- [ ] **Step 1: Write the failing test**

Append to `comment-authority.test.ts`. Create a Tantou blocking comment (author `u-editor`) directly, plus a second Series with **no** `editorId`:

```ts
describe("CT-03 resolve/reopen authority", () => {
  beforeEach(async () => {
    await StudioCommentModel.create({ id: "cmt-ct03", seriesId: "s-ct01", chapterId: "ch-ct01", targetType: "CHAPTER", targetId: "ch-ct01", authorId: "u-editor", authorName: "Tantou", authorRole: "EDITOR", body: "block", text: "block", isBlocking: true, status: "OPEN", createdAt: new Date(), updatedAt: new Date() });
  });
  it("rejects an EDITOR who is not the assigned Tantou (403 TANTOU_ASSIGNMENT_REQUIRED)", async () => {
    // series s-ct01 has editorId u-editor; log in as a different editor if seeded, else use unset-editor series.
    await SeriesModel.create({ id: "s-noeditor", slug: "s-noeditor", title: "NoEd", authorId: "u-mangaka", authorName: "Inoue", status: "ONGOING" });
    await StudioCommentModel.create({ id: "cmt-noed", seriesId: "s-noeditor", targetType: "CHAPTER", targetId: "ch-x", authorId: "u-editor", authorName: "T", authorRole: "EDITOR", body: "b", text: "b", isBlocking: true, status: "OPEN", createdAt: new Date(), updatedAt: new Date() });
    const editor = await loginAs("editor@mangaflow.local");
    const res = await request(createApp()).post("/api/comments/cmt-noed/resolve")
      .set("Authorization", `Bearer ${editor.accessToken}`).send({}).expect(403);
    expect(res.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
  });
  it("lets the assigned Tantou resolve a blocking comment", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const res = await request(createApp()).post("/api/comments/cmt-ct03/resolve")
      .set("Authorization", `Bearer ${editor.accessToken}`).send({}).expect(200);
    expect(res.body.data.status).toBe("RESOLVED");
  });
  it("rejects reopen from OPEN (409 INVALID_TRANSITION) and allows reopen from RESOLVED", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    await request(createApp()).post("/api/comments/cmt-ct03/reopen")
      .set("Authorization", `Bearer ${editor.accessToken}`).send({}).expect(409);
    await request(createApp()).post("/api/comments/cmt-ct03/resolve")
      .set("Authorization", `Bearer ${editor.accessToken}`).send({}).expect(200);
    const res = await request(createApp()).post("/api/comments/cmt-ct03/reopen")
      .set("Authorization", `Bearer ${editor.accessToken}`).send({}).expect(200);
    expect(res.body.data.status).toBe("REOPENED");
  });
});
```

Note: `s-noeditor` has no `editorId`, so even the correct Tantou role is rejected — proving the "editorId must be set" strictness. The `cmt-ct03` on `s-ct01` (editorId `u-editor`) is manageable by `editor@mangaflow.local`.

- [ ] **Step 2: Run the test and confirm expected failure**

Run: `npx vitest run src/__tests__/comment-authority.test.ts`
Expected: FAIL — resolve on `s-noeditor` currently returns 200 (permissive when `editorId` unset); reopen from OPEN currently returns 200.

- [ ] **Step 3: Implement the split guards + reopen precondition**

In `studio.controller.ts`, replace `assertEditorCanManageComment` (lines 133-149) with:

```ts
async function assertTantouManagesBlockingComment(req: AuthedRequest, comment: any) {
  const actor = requireActor(req);
  if (actor.role !== "EDITOR") {
    throw new AppError(403, "Only Tantou can resolve or reopen blocking comments.", "FORBIDDEN");
  }
  if (!isTantouBlockingComment(comment)) {
    throw new AppError(403, "Only Tantou blocking comments can be resolved or reopened here.", "FORBIDDEN");
  }
  const series = (await resolveCommentSeries(comment)) as any;
  if (!series?.editorId || series.editorId !== actor.id) {
    throw new AppError(403, "Only the assigned Tantou can manage this comment.", "TANTOU_ASSIGNMENT_REQUIRED");
  }
}

async function assertCanResolveTantouBlockingComment(req: AuthedRequest, comment: any) {
  await assertTantouManagesBlockingComment(req, comment);
}

async function assertCanReopenTantouBlockingComment(req: AuthedRequest, comment: any) {
  await assertTantouManagesBlockingComment(req, comment);
  if (!["ADDRESSED", "RESOLVED"].includes(String(comment.status))) {
    throw new AppError(409, "A comment can only be reopened from ADDRESSED or RESOLVED.", "INVALID_TRANSITION");
  }
}
```

In `resolveComment` (`:462`) change the call to `await assertCanResolveTantouBlockingComment(req, comment);`
In `reopenComment` (`:488`) change the call to `await assertCanReopenTantouBlockingComment(req, comment);`

- [ ] **Step 4: Run focused test to green**

Run: `npx vitest run src/__tests__/comment-authority.test.ts`
Expected: PASS (Task 1 + Task 3 cases).

- [ ] **Step 5: Run regression + lint + full suite**

Run: `npm run lint` then `npm test`
Expected: full suite PASS. Update any test that resolved/reopened a comment on a series without `editorId` (now 403) to use a Tantou-assigned series; note each change.

- [ ] **Step 6: Update the CT-03 docs**

- `docs/CODE-TODO.md`: CT-03 **Status: Done/Implemented**; compliance matrix *Comment resolve/reopen authorization* row FAIL → **PASS (implemented — strict assigned-Tantou guard + reopen source-status precondition)**.
- `docs/business-flows/INDEX.md`: Gap Register FLOW-GAP-03 **Resolved**; invariant 14 fully ✅.
- `docs/business-flows/12-comments.md`: update the FLOW-GAP-03 block to the implemented behavior (strict `editorId` match; reopen only from `ADDRESSED`/`RESOLVED`); keep ID marked Resolved.

- [ ] **Step 7: Commit (green)**

```bash
git add backend/src/controllers/studio.controller.ts backend/src/__tests__/comment-authority.test.ts docs/CODE-TODO.md docs/business-flows/INDEX.md docs/business-flows/12-comments.md
git commit -m "fix(CT-03): enforce assigned-Tantou on comment resolve/reopen + reopen precondition"
```

---

## After the three commits

- [ ] Run the full suite once more: `npm test` (from `backend/`) — must be green; record the command + result.
- [ ] Push `fix/p0-workflow-correctness` and open one PR to `main` summarizing CT-01/02/03, the test command/results, any regression-test updates, and the doc synchronization. Note that historical blocking-comment records are not auto-repaired (CT-01) — a separate data-remediation follow-up if an environment has legacy rows.

## Self-review checklist (run before pushing)

- Three implementation commits, each green, each = test + fix + directly-affected docs. No red commit.
- `TANTOU_ASSIGNMENT_REQUIRED` used consistently (CT-01 create/patch, CT-03 resolve/reopen).
- `findChapterBlockingComments` unchanged; no author-current-assignment coupling.
- CT-02 fails closed (missing/non-`BOARD_REVIEW` Proposal → 409, session unchanged) and runs in one transaction.
- Docs: FLOW-GAP-01/02/03 marked Resolved (IDs kept); compliance matrix rows flipped to PASS; no unrelated docs touched.
