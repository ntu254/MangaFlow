# Voting Session Majority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove vote-session scheduling and make the Board resolve only with three matching votes out of five.

**Architecture:** The backend owns the session quorum and final outcome. The session form creates an immediate session with no date payload. Vote responses expose the session quorum so the frontend stops using its conflicting hard-coded value.

**Tech Stack:** Express, Mongoose, Vitest, React, TanStack Query.

## Global Constraints

- No new dependencies, scheduler, workflow states, or automatic close behavior.
- A session opens immediately; only the Board Chair closes it.
- `APPROVED` needs at least three approve votes; `REJECTED` needs at least three reject votes.
- All five votes with equal approve/reject counts close the round and open a fresh Board re-vote.
- All remaining closed outcomes are `NO_QUORUM` and return the proposal to `PENDING_BOARD`.
- Every eligible Board member must choose APPROVE or REJECT; there is no ABSTAIN decision.
- The frontend reads the server-provided session quorum.

---

### Task 1: Align immediate voting UI and canonical 3/5 resolution

**Files:**
- Modify: `backend/src/services/workflow.service.ts:388-450,2737-2945`
- Modify: `backend/src/controllers/mobile.controller.ts:24-46`
- Modify: `backend/src/__tests__/p0-workflow-refactor.test.ts`
- Modify: `src/features/board/sessions/components/session-form.tsx`
- Modify: `src/features/board/vote/components/board-vote-page.tsx`
- Modify: `src/features/board/api/board-queries.ts`
- Modify: `src/entities/proposal/model/proposal-types.ts`
- Modify: `src/shared/api/services.ts`
- Modify: `src/routes/app.board.sessions.new.tsx`

**Interfaces:**
- Consumes: `VotingSession.quorum`, `ProposalVoteModel`, and `closeVotingSession(req, sessionId)`.
- Produces: `GET /board/series/:seriesId/votes` includes `quorum` and `eligibleVoterIds`; no frontend vote tally imports a separate quorum constant.

- [ ] **Step 1: Write failing backend outcome tests**

Add one focused test block to `p0-workflow-refactor.test.ts`. Create a `PENDING_BOARD` proposal, create a session as `board@beachread.jp`, cast seeded board-member votes through `POST /api/board/series/:id/votes`, and close as the chair. Assert:

```ts
expect(closed.body.data.status).toBe("FINALIZED");
expect(closed.body.data.result).toBe("APPROVED"); // three APPROVE

expect(closed.body.data.status).toBe("FINALIZED");
expect(closed.body.data.result).toBe("REJECTED"); // three REJECT

expect(closed.body.data.status).toBe("NO_QUORUM");
expect(proposal.status).toBe("PENDING_BOARD"); // fewer than three submitted votes

expect(closed.body.data.status).toBe("TIED"); // all eligible voters split evenly; fresh re-vote opens
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm.cmd test -- --run src/__tests__/p0-workflow-refactor.test.ts`

Expected: the abstention and tie cases expose the old count/constant behavior.

- [ ] **Step 3: Implement the backend rule and response contract**

Make the close decision use this exact order for each single-proposal session:

```ts
const approved = tally.approve >= quorum;
const rejected = tally.reject >= quorum;
const allEligibleVoted = proposalVotes.length >= eligibleVoterIds.length;
const tied = allEligibleVoted && tally.approve === tally.reject;
const decision = approved ? "APPROVED" : rejected ? "REJECTED" : tied ? "TIE_BREAK_REQUIRED" : "NO_QUORUM";
```

Use the session's `quorum` and `eligibleVoterIds` (falling back to the existing five-member defaults only for legacy sessions). Add `quorum` and `eligibleVoterIds` to the board-votes response. Do not change vote scheduling behavior on the backend because it is already immediate.

- [ ] **Step 4: Remove scheduling UI and consume server quorum**

Delete the session form date state, date imports, date inputs, mode selection, and `scheduledFor`/`closesAt` request fields. Submit only a title and one proposal with `mode: "AD_HOC"`; update the new-session copy to say it opens immediately. Remove the frontend `BOARD_QUORUM` constant and calculate UI vote completion from `voteData.quorum`.

- [ ] **Step 5: Run verification**

Run:

```powershell
cd backend; npm.cmd test -- --run src/__tests__/p0-workflow-refactor.test.ts
cd ..; npm.cmd run build
```

Expected: focused backend tests and frontend production build pass.

- [ ] **Step 6: Commit**

```powershell
git add backend/src/services/workflow.service.ts backend/src/controllers/mobile.controller.ts backend/src/__tests__/p0-workflow-refactor.test.ts src/features/board/sessions/components/session-form.tsx src/features/board/vote/components/board-vote-page.tsx src/features/board/api/board-queries.ts src/entities/proposal/model/proposal-types.ts src/shared/api/services.ts src/routes/app.board.sessions.new.tsx
git commit -m "fix: enforce three-vote board decisions"
```

## Self-review

- Spec coverage: Task 1 removes time selection, keeps manual close, implements 3/5 approval/rejection, tie-break, no-quorum, and makes the frontend consume server quorum.
- Placeholder scan: no deferred requirements or unspecified implementation steps.
- Type consistency: the board-votes response fields are named `quorum` and `eligibleVoterIds` across backend and frontend.
