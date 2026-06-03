# MF-021 Board Voting API Foundation

## Current Behavior
The backend does not support Board voting, decisions, or board member membership tracking. The `Board` system role is defined in user synchronization but there are no backend Mongoose models or REST endpoints to enable Board members to vote on series, view vote summaries, or finalize approval decisions.

## Target Behavior
Implement the REST API foundation for the Board Voting workflow:
1. **BoardMember Model**:
   - Manages board members (`BOARD_MEMBER` or `BOARD_CHAIR`) linked to local users.
   - Restricts voting to active board members.
2. **BoardVote Model**:
   - Tracks board votes (`APPROVE`, `REJECT`, `NEEDS_REVISION`) cast by members for a given series.
3. **BoardDecision Model**:
   - Logs the final approval decision (`APPROVED`, `REJECTED`, `NEEDS_REVISION`, `CONTINUE`, `CANCEL`) along with vote counts, decided by, and tie-breaker flag.
4. **Endpoints**:
   - `GET /api/board/members` -> List all active board members.
   - `POST /api/series/:seriesId/votes` -> Board Member submits/updates a vote.
   - `GET /api/series/:seriesId/votes` -> View all votes cast on a series.
   - `GET /api/series/:seriesId/votes/summary` -> Get the aggregate count of votes.
   - `POST /api/series/:seriesId/decisions/finalize` -> Calculate majority vote and finalize decision.
   - `POST /api/series/:seriesId/decisions/tie-break` -> Allow Board Chair to cast a tie-breaking decision when votes are tied.

## Affected Users
- Board Members
- Board Chair
- Mangakas (their series receive board decisions)
- Admins

## Non-Goals
- Frontend UI screens (handled in MF-022).
- Automatic publishing actions upon approval.
