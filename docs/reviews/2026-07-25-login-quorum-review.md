# Login and quorum workflow review

## Scope and method

Reviewed the credential-login, token refresh, and Board-voting flows in:

- `src/shared/auth/auth-store.ts`
- `src/shared/api/auth.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/services/workflow.service.ts`
- `src/entities/proposal/model/proposal-types.ts`

The review traced the frontend request and token storage into the controller and service, then traced voting-session creation, vote submission, and queue projection. It also checked all backend references to `eligibleVoterIds`, `BOARD_QUORUM`, and `BOARD_TOTAL` needed to distinguish defects from fixed training-scope assumptions.

Verification correction: `npm --prefix backend run lint` passed (exit 0): `tsc --noEmit -p tsconfig.json`. `npm --prefix backend test` was started in a PowerShell job with a 115-second maximum and stopped before that cap; it emitted no test-runner output. This does not establish a passing test suite.

## Flow summary

`loginWithCredentials` calls `POST /auth/login`, stores the returned access and refresh tokens, and stores the mapped user in the persisted Zustand auth state (`src/shared/api/auth.ts:40-47`; `src/shared/auth/auth-store.ts:99-130`). The controller validates email and password before delegating to the service (`backend/src/controllers/auth.controller.ts:6-17`). The service authenticates an active user, signs both tokens, hashes the refresh token for storage, and rotates it on refresh (`backend/src/services/auth.service.ts:34-61`, `81-105`).

Opening a Board session snapshots five Board IDs and a backend quorum on the session (`backend/src/controllers/voting.controller.ts:221-232`). A vote validates session state, caller role, and proposal-version freshness; it then upserts a `ProposalVote` before incrementing the session version (`backend/src/services/workflow.service.ts:905-998`). Queue projections deliberately use the fixed five-seat Board total (`backend/src/services/workflow.service.ts:2661-2676`), which matches the session's five-ID training snapshot and is not a defect by itself.

## Findings

### High — session eligibility snapshot is not enforced — Fix now

- **Evidence:** `eligibleVoterIds` is persisted as a five-ID session snapshot in `backend/src/controllers/voting.controller.ts:221-232`. The vote path loads the session and permits any actor with role `BOARD` while the session is open, but never checks `actor.id` against that snapshot (`backend/src/services/workflow.service.ts:905-934`).
- **Observed behavior:** An authenticated Board-role user outside the snapshot can cast a vote for that session.
- **User impact:** A vote can be accepted from someone who was not eligible when the session opened, undermining the frozen voter set and recorded decision.
- **Smallest recommendation:** Before constructing the vote, reject an open-session Board actor whose ID is absent from `session.eligibleVoterIds`; preserve the Board re-vote path.

### High — a stale session conflict can leave a source-of-truth vote behind — Fix now

- **Evidence:** The `ProposalVoteModel.findOneAndUpdate(..., { upsert: true })` source-of-truth write happens before the optimistic `VotingSessionModel.findOneAndUpdate` (`backend/src/services/workflow.service.ts:971-996`). If that session update returns no document, the service returns `VERSION_CONFLICT` after the vote write (`backend/src/services/workflow.service.ts:997-998`).
- **Observed behavior:** A competing update can cause the caller to receive a conflict while the submitted vote remains persisted and appears in later session reads.
- **User impact:** A user can retry after a reported failure, and the stored vote can affect the tally despite the client being told the submission did not succeed.
- **Smallest recommendation:** Wrap the vote upsert and versioned session update in the existing workflow transaction helper so a version conflict rolls back the vote write.

### Medium — frontend advertises a one-vote quorum while the backend defaults to three — Fix now

- **Evidence:** The frontend exports `BOARD_QUORUM = 1` (`src/entities/proposal/model/proposal-types.ts:262-264`) and uses it for vote tallies and Board-facing quorum copy (`src/entities/proposal/model/board-tally.ts:23-39`; `src/features/board/queue/components/board-voting-queue-page.tsx:21-24`). The backend reads `BOARD_QUORUM` from the environment with a default of `3` (`backend/src/services/workflow.service.ts:44-54`).
- **Observed behavior:** With no override, the frontend says one same-direction vote decides while the backend requires three.
- **User impact:** Board users receive incorrect quorum and outcome feedback, and local client-side projections can disagree with the API.
- **Smallest recommendation:** Use the session quorum returned by the backend for Board displays and client-side tallying; remove the hard-coded frontend quorum.

### Medium — refresh-session storage lifetime ignores the configured refresh JWT lifetime — Follow-up

- **Evidence:** Refresh JWTs use `env.JWT_REFRESH_EXPIRES_IN` (`backend/src/services/auth.service.ts:30-31`), whose default is configurable (`backend/src/config/env.ts:11-12`). The backing refresh-session record always expires after seven days (`backend/src/services/auth.service.ts:20-24`, `34-44`) and is checked during refresh (`backend/src/services/auth.service.ts:89-96`).
- **Observed behavior:** Changing `JWT_REFRESH_EXPIRES_IN` does not change the database expiry; a token configured for more than seven days fails once its session record reaches the fixed seven-day limit.
- **User impact:** Operators can configure a refresh-token lifetime that users cannot actually use, resulting in unexpected reauthentication.
- **Smallest recommendation:** Derive the stored expiry from the same refresh-lifetime configuration used to sign the token, with validation for a finite positive duration.

### Reviewed, no finding — fixed five-seat queue projection — Accept for training scope

- **Evidence:** Sessions snapshot exactly five eligible Board IDs (`backend/src/controllers/voting.controller.ts:221-232`), and the queue reports pending, eligible, and total from the same fixed `BOARD_TOTAL` of five (`backend/src/services/workflow.service.ts:53-54`, `2661-2676`).
- **Observed behavior:** The denominator is intentionally five for this fixed Board model.
- **User impact:** None within the stated training scope.
- **Smallest recommendation:** Keep the fixed total. Revisit only if session membership becomes configurable; then derive the queue denominator from the session snapshot.

## Recommended next steps

1. Enforce the frozen eligible-voter list in the shared vote path and add the smallest regression test for an out-of-snapshot Board actor.
2. Make the vote write and versioned session update atomic with the existing transaction helper, then test the conflict path.
3. Make the frontend render the backend session quorum, rather than a local constant.
4. Align refresh-session persistence expiry with `JWT_REFRESH_EXPIRES_IN` when configurable refresh lifetimes are needed.

## Out of scope

This review does not recommend SSO, MFA, distributed transaction infrastructure, enterprise governance, configurable Board membership, or changes to application/test code. The fixed five-member Board is accepted for the current training scope.
