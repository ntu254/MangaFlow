# Board Proposal Re-vote and Governance Hardening

## Goal

Align the Board Proposal voting flow with the approved rule:

- A tied Board vote closes as a historical `TIED` round.
- The same Proposal snapshot and the same snapshotted Board electorate are
  used for a fresh voting round.
- The new round starts with no votes.
- Previous rounds remain immutable audit history.
- A later tie may be re-voted again; EIC tie-break is removed from the active
  Proposal voting path.

The change also fixes the confirmed runtime and integrity defects around the
same flow:

- Local Mongo transaction failures must be reported as a controlled
  `503`, not a generic `500`.
- Voting-session creation must update the Proposal and session atomically.
- A session's Proposal/version association is immutable after creation.
- Finalization must use the session's quorum snapshot.
- The tie-break route must address the session in its URL and body
  consistently.

## Current contract and selected approach

Keep `VotingSession` as the source of truth for votes. Represent a tied round
with a terminal session status `TIED` and create a new `OPEN` session for the
same Proposal. The new session gets:

- the same `proposalId`;
- the same `proposalVersionId`;
- the same `eligibleVoterIds`;
- the same quorum snapshot;
- a `reVoteOfSessionId` reference to the tied session.

The Proposal remains `BOARD_REVIEW` while the new session is open and retains
its active-session pointers. A tied historical session is not an active
session and cannot accept further votes.

The current EIC tie-break endpoints become unavailable for Proposal voting.
They should return a clear `409`/`410` response rather than silently creating a
different decision path. Existing historical tie-break data remains readable.

## Data flow

```text
OPEN session
  -> Board votes (transactional upsert, one voter/session)
  -> Chair closes
      -> APPROVED / REJECTED: terminal session + Proposal decision
      -> NO_QUORUM: terminal session + Proposal PENDING_BOARD
      -> TIED: terminal TIED session + new OPEN re-vote session
```

The close operation must make the tied-session transition and new-session
creation one transaction. If the transaction fails, neither session status nor
Proposal pointers change.

The partial unique active-session index remains the final guard against two
open sessions for one Proposal.

## API and validation changes

`PATCH /api/voting-sessions/:id` may update presentation/scheduling fields only.
It must reject changes to `proposalId`, `proposalIds`, `proposalVersionId`,
`eligibleVoterIds`, `quorum`, and lifecycle status.

`POST /api/voting-sessions` derives the current Proposal version on the server.
Caller-provided version identifiers cannot select an arbitrary snapshot.
Creation uses the existing workflow transaction helper and verifies the
Proposal update matched the expected `PENDING_BOARD` state.

The old tie-break URL must not accept a body `proposalId` that can redirect the
command to another Proposal. The implementation either removes the route from
the active UI/API contract or validates that URL session, body session, and
Proposal all match before returning the explicit retired-route error.

`runWorkflowTransaction` must recognize wrapped Mongo errors whose nested cause
indicates standalone Mongo/unsupported transactions. It returns
`503 MONGODB_REPLICA_SET_REQUIRED`, preserving the docs' operational contract.

## Compatibility and audit

Historical `TIE_BREAK_REQUIRED` sessions remain readable for old seeded data,
but no new session enters that state. Historical `ProposalVote` rows remain
scoped to their original session. No vote rows are copied into a re-vote
session.

Every re-vote records:

- the tied source session;
- the new session id;
- the snapshotted electorate and quorum;
- the Chair actor and timestamps.

## Testing

Add focused backend tests for:

1. A five-vote split closes the old session as `TIED`, creates a new `OPEN`
   session, and keeps Proposal pointers on the new session.
2. The new session has zero votes and accepts one vote per snapshotted Board
   member.
3. A second tie creates another re-vote round without mutating earlier rounds.
4. A stale/cancelled tied session cannot receive votes.
5. Session association/version/quorum fields cannot be changed through PATCH.
6. Session creation rolls back both documents when the Proposal update cannot
   match.
7. Finalization uses the session quorum snapshot.
8. Standalone-Mongo transaction errors return `503`, not `500`.
9. The retired tie-break route cannot target a different Proposal/session.

Run the focused Board/workflow tests on `MongoMemoryReplSet`, then run the
backend test suite. Local live smoke testing must use a real Mongo replica set.

## Non-goals

- No redesign of the broader Proposal lifecycle.
- No new voting policy beyond re-voting ties.
- No deletion of historical vote/session records.
- No frontend visual redesign; only API payload/status handling needed for the
  new session state.
