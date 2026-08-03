# Board Proposal Re-vote and Governance Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tied Board Proposal votes start a fresh auditable voting session, while fixing the transaction, session-integrity, quorum, and API-contract defects in the same flow.

**Architecture:** `VotingSession` remains the vote source of truth. A tie becomes a terminal `TIED` session; the close transaction creates a new `OPEN` session linked by `reVoteOfSessionId`, preserving the Proposal snapshot and electorate. Proposal content and session associations are server-owned and immutable during a round.

**Tech Stack:** Express 5, TypeScript, Mongoose 9, MongoDB transactions, Zod, Vitest, Supertest, React/TanStack Query.

## Global Constraints

- A tied Board vote closes as a historical `TIED` round.
- The same Proposal snapshot and the same snapshotted Board electorate are used for a fresh voting round.
- The new round starts with no votes.
- Previous rounds remain immutable audit history.
- A later tie may be re-voted again; special tie-break voting is removed from the active Proposal path.
- Local Mongo transaction failures return `503 MONGODB_REPLICA_SET_REQUIRED`, not generic `500`.
- Every tied-session transition and new-session creation is one transaction.
- Session `proposalId`, `proposalIds`, `proposalVersionId`, `eligibleVoterIds`, `quorum`, and lifecycle status are not PATCH-mutable.
- Finalization uses the session quorum snapshot.
- Existing historical `TIE_BREAK_REQUIRED` records remain readable.
- Do not modify unrelated dirty files: `src/routeTree.gen.ts`, `claude-howto/`, or `code-review-graph/`.

---

### Task 1: Normalize transaction capability errors

**Files:**

- Modify: `backend/src/services/workflow-support.service.ts`
- Test: `backend/src/__tests__/workflow-support.test.ts` (create if absent)

**Interfaces:**

- Consumes: `runWorkflowTransaction(fn)` and its existing `isTransactionUnsupported` helper.
- Produces: the same transaction helper behavior with wrapped Mongo standalone errors mapped to `AppError(503, ..., "MONGODB_REPLICA_SET_REQUIRED")`.

- [ ] **Step 1: Write the failing test**

Add a unit-level test that passes a callback throwing an error with the driver wrapper message and nested `originalError`:

```ts
it("maps wrapped standalone Mongo transaction errors to 503", async () => {
  const error = Object.assign(
    new Error("This MongoDB deployment does not support retryable writes."),
    { originalError: new Error("Transaction numbers are only allowed on a replica set member or mongos") },
  );
  await expect(runWorkflowTransaction(async () => { throw error; }))
    .rejects.toMatchObject({ status: 503, code: "MONGODB_REPLICA_SET_REQUIRED" });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

```powershell
cd backend
npx vitest run src/__tests__/workflow-support.test.ts
```

Expected: FAIL because only the top-level error message is inspected.

- [ ] **Step 3: Implement the smallest root-cause fix**

Make `isTransactionUnsupported` inspect the error and its nested `originalError`
message, while preserving the existing message checks. Do not add a fallback
that silently executes workflow writes without a transaction.

- [ ] **Step 4: Run the focused test**

```powershell
npx vitest run src/__tests__/workflow-support.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/services/workflow-support.service.ts backend/src/__tests__/workflow-support.test.ts
git commit -m "fix: map unsupported Mongo transactions to 503"
```

### Task 2: Harden session creation, patching, and quorum snapshots

**Files:**

- Modify: `backend/src/controllers/voting.controller.ts`
- Modify: `backend/src/services/proposal-governance.service.ts`
- Modify: `backend/src/services/workflow.service.ts`
- Modify: `backend/src/controllers/mobile.controller.ts`
- Modify: `backend/src/db/models.ts`
- Test: `backend/src/__tests__/board.test.ts`
- Test: `backend/src/__tests__/p0-workflow-refactor.test.ts`

**Interfaces:**

- Consumes: `runWorkflowTransaction`, `expectedVersionFilter`, `activeBoardElectorate`, and current `createVotingSession`/`patchVotingSession`.
- Produces: atomic session creation; immutable session identity/policy; finalization based on `session.quorum`.

- [ ] **Step 1: Add failing API tests**

Add tests asserting PATCH rejects association/policy mutation and creation does
not accept an arbitrary Proposal version:

```ts
await request(createApp())
  .patch(`/api/voting-sessions/${sessionId}`)
  .set("Authorization", `Bearer ${chair.accessToken}`)
  .send({ proposalId: "other-proposal", expectedVersion: 1 })
  .expect(400);

await request(createApp())
  .post("/api/voting-sessions")
  .set("Authorization", `Bearer ${chair.accessToken}`)
  .send({ proposalId, proposalVersionId: "999" })
  .expect(409);
```

Add a finalization test that sets `session.quorum = 2` and verifies two
APPROVE votes finalize as APPROVED and `BoardDecision.quorumSnapshot` is `2`.

- [ ] **Step 2: Run the focused tests and verify the new assertions fail**

```powershell
cd backend
npx vitest run src/__tests__/board.test.ts src/__tests__/p0-workflow-refactor.test.ts
```

- [ ] **Step 3: Make creation transactional**

Move ProposalVersion upsert, VotingSession creation, Proposal transition, and
creation audit into one `runWorkflowTransaction`. Derive the current Proposal
version on the server; reject a supplied version that does not equal it. Check
the Proposal update result and throw `409 PROPOSAL_STATE_CHANGED` when its
`PENDING_BOARD` predicate no longer matches.

- [ ] **Step 4: Restrict PATCH**

Keep only title, mode, scheduledFor, and closesAt writable. Reject
`proposalId`, `proposalIds`, `proposalVersionId`, `eligibleVoterIds`, `quorum`,
and status through the strict schema with a validation error. Reject updates
to terminal sessions and keep optimistic `expectedVersion` behavior.

- [ ] **Step 5: Use the session policy during finalization and reads**

Use `Number(session.quorum ?? BOARD_QUORUM)` for close, board queue, and board
votes response. Store the same value in `BoardDecision.quorumSnapshot`.

- [ ] **Step 6: Run the focused tests**

```powershell
npx vitest run src/__tests__/board.test.ts src/__tests__/p0-workflow-refactor.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add backend/src/controllers/voting.controller.ts backend/src/services/proposal-governance.service.ts backend/src/db/models.ts backend/src/__tests__/board.test.ts backend/src/__tests__/p0-workflow-refactor.test.ts
git commit -m "fix: harden Board voting session integrity"
```

### Task 3: Implement tied-session re-vote

**Files:**

- Modify: `backend/src/db/models.ts`
- Modify: `backend/src/services/proposal-governance.service.ts`
- Modify: `backend/src/services/workflow.service.ts`
- Modify: `backend/src/controllers/voting.controller.ts`
- Modify: `backend/src/types.ts`
- Test: `backend/src/__tests__/p0-workflow-refactor.test.ts`
- Test: `backend/src/__tests__/board.test.ts`

**Interfaces:**

- Consumes: session transaction helpers and the session source-of-truth vote collection from Tasks 1-2.
- Produces: `TIED` terminal sessions, `reVoteOfSessionId`, and a fresh `OPEN` session with zero votes.

- [ ] **Step 1: Add failing re-vote tests**

Replace the current special tie-break expectation with assertions for a new session:

```ts
const closed = await closeSession(sessionId);
expect(closed.body.data.status).toBe("TIED");

const sessions = await VotingSessionModel.find({ proposalId }).sort({ openedAt: 1 }).lean();
expect(sessions).toHaveLength(2);
expect(sessions[0].status).toBe("TIED");
expect(sessions[1]).toMatchObject({
  status: "OPEN",
  reVoteOfSessionId: sessions[0].id,
  proposalId,
  proposalVersionId: sessions[0].proposalVersionId,
  eligibleVoterIds: sessions[0].eligibleVoterIds,
  quorum: sessions[0].quorum,
});
expect(await ProposalVoteModel.countDocuments({ sessionId: sessions[1].id })).toBe(0);
```

Add a second-tie test proving the second `TIED` session creates a third
`OPEN` session and does not mutate either historical session or its votes.
Add a vote test proving the old `TIED` session returns `409 SESSION_NOT_ACTIVE`.

- [ ] **Step 2: Run the new tests and verify they fail**

```powershell
cd backend
npx vitest run src/__tests__/p0-workflow-refactor.test.ts src/__tests__/board.test.ts
```

- [ ] **Step 3: Extend the session model**

Add `TIED` to the supported status contract and add optional
`reVoteOfSessionId` with an index on Proposal/session lookup. Keep old
`TIE_BREAK_REQUIRED` readable for seed/history compatibility.

- [ ] **Step 4: Change close behavior**

When all eligible voters have voted and APPROVE equals REJECT, update the
current session to `TIED`, create the next `OPEN` session with the exact
snapshot fields, keep the Proposal `BOARD_REVIEW` pointers on the new session,
and write audit/outbox records in the same transaction. Do not copy
`ProposalVote` rows.

- [ ] **Step 5: Remove active special tie-break behavior**

Reject new Proposal tie-break commands with an explicit retired-route error.
Ensure `VOTE` only accepts `OPEN` sessions for Board actors; `TIED`,
`CANCELLED`, and historical `TIE_BREAK_REQUIRED` sessions cannot receive new
votes.

- [ ] **Step 6: Run the focused tests**

```powershell
npx vitest run src/__tests__/p0-workflow-refactor.test.ts src/__tests__/board.test.ts src/__tests__/voting-cancel.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add backend/src/db/models.ts backend/src/services/proposal-governance.service.ts backend/src/services/workflow.service.ts backend/src/controllers/voting.controller.ts backend/src/__tests__/p0-workflow-refactor.test.ts backend/src/__tests__/board.test.ts
git commit -m "feat: re-vote tied Board proposals"
```

### Task 4: Align Board client and business documentation

**Files:**

- Modify: `src/features/board/api/board-queries.ts`
- Modify: `src/features/board/api/use-active-voting-session.ts`
- Modify: `src/entities/board/model/voting-types.ts`
- Modify: `src/features/board/vote/components/board-vote-page.tsx`
- Modify: `src/features/board/sessions/components/voting-panel.tsx`
- Modify: `src/features/board/sessions/components/tie-break-panel.tsx`
- Modify: `docs/business-flows/06-board-governance.md`
- Modify: `docs/business-flows/02-proposal-lifecycle.md`

**Interfaces:**

- Consumes: the `TIED`/new-`OPEN` API contract from Task 3.
- Produces: Board UI that shows the active re-vote session and no longer sends
  special tie-break requests for new ties.

- [ ] **Step 1: Update active-session projection**

Treat only `OPEN` as a voteable Board session. Treat `TIED` as historical and
use the new `OPEN` session returned for the same Proposal. Remove new UI calls
to `/decisions/tie-break`; preserve historical display labels where needed.

- [ ] **Step 2: Update vote/finalize payloads**

Always send `sessionId` and `expectedVersion` from the active session for Board
votes. Keep finalize pointed at the active session id. Map `TIED` to a
re-vote-needed message rather than a special-role action.

- [ ] **Step 3: Update docs**

Change the flowchart, status table, quorum notes, and role-access table to say
that ties create a fresh voting session. Document `TIED` as terminal history and
remove special tie-break as the active Proposal path. Keep historical compatibility
notes explicit.

- [ ] **Step 4: Run checks**

```powershell
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/board docs/business-flows/06-board-governance.md docs/business-flows/02-proposal-lifecycle.md
git commit -m "feat: align Board UI and docs with proposal re-votes"
```

### Task 5: Whole-branch verification

**Files:**

- Test: `backend/src/__tests__/board.test.ts`
- Test: `backend/src/__tests__/p0-workflow-refactor.test.ts`
- Test: `backend/src/__tests__/workflow-support.test.ts`

- [ ] **Step 1: Run focused backend verification**

```powershell
cd backend
npx vitest run src/__tests__/workflow-support.test.ts src/__tests__/board.test.ts src/__tests__/p0-workflow-refactor.test.ts src/__tests__/voting-cancel.test.ts
```

- [ ] **Step 2: Run the full backend suite**

```powershell
npm test
```

- [ ] **Step 3: Run frontend checks**

```powershell
cd ..
npm run lint
npm run typecheck
```

- [ ] **Step 4: Confirm only scoped files changed**

```powershell
git status --short
git diff --check
```

The existing unrelated dirty files must remain untouched.
