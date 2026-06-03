# Design

## Models & Schemas

### 1. BoardMember
```typescript
interface BoardMemberDocument extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User model
  role: "BOARD_MEMBER" | "BOARD_CHAIR";
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. BoardVote
```typescript
interface BoardVoteDocument extends Document {
  seriesId: mongoose.Types.ObjectId; // Reference to Series model
  boardMemberId: mongoose.Types.ObjectId; // Reference to BoardMember model
  vote: "APPROVE" | "REJECT" | "NEEDS_REVISION";
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
- A composite index or unique constraint on `{ seriesId: 1, boardMemberId: 1 }` to ensure each member can vote only once per series.

### 3. BoardDecision
```typescript
interface BoardDecisionDocument extends Document {
  seriesId: mongoose.Types.ObjectId; // Reference to Series model
  decision: "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "CONTINUE" | "CANCEL";
  voteSummary: {
    approve: number;
    reject: number;
    needsRevision: number;
  };
  decidedBy: mongoose.Types.ObjectId; // Reference to User model
  isTieBreak: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## API Endpoints & Authorization Rules

### 1. List Board Members
- `GET /api/board/members`
  - **Authorization**: Only users with system role `BOARD` or `ADMIN`.
  - **Response**: Array of active `BoardMember` records populated with user details.

### 2. Submit/Update Vote
- `POST /api/series/:seriesId/votes`
  - **Authorization**: User must have system role `BOARD` and be registered as an `ACTIVE` `BoardMember`.
  - **Body**:
    ```json
    {
      "vote": "APPROVE" | "REJECT" | "NEEDS_REVISION",
      "reason": "optional reason string"
    }
    ```
  - **Behavior**: Creates a new vote or updates the existing vote cast by this member for the series.

### 3. Get Votes list
- `GET /api/series/:seriesId/votes`
  - **Authorization**: Accessible to Admins, Board Members, or the Series Owner (Mangaka).

### 4. Get Vote Summary
- `GET /api/series/:seriesId/votes/summary`
  - **Authorization**: Accessible to Admins, Board Members, or Series Members.
  - **Response**:
    ```json
    {
      "approve": number,
      "reject": number,
      "needsRevision": number,
      "totalVotes": number
    }
    ```

### 5. Finalize Decision (Majority Rule)
- `POST /api/series/:seriesId/decisions/finalize`
  - **Authorization**: Board Chair or Admin.
  - **Behavior**: 
    - Fetches all votes for the series.
    - Resolves decision by majority vote:
      - If `approve` > `reject` + `needsRevision` -> `APPROVED`.
      - If `reject` > `approve` + `needsRevision` -> `REJECTED`.
      - If `needsRevision` > `approve` + `reject` -> `NEEDS_REVISION`.
      - If there is a tie or no clear majority -> Fails with `400 Bad Request` and message indicating a tie-break is required.
    - If majority is achieved, records a `BoardDecision` and transitions the series/manuscript status.

### 6. Finalize Tie-Break Decision
- `POST /api/series/:seriesId/decisions/tie-break`
  - **Authorization**: Only Board Chair.
  - **Body**:
    ```json
    {
      "decision": "APPROVED" | "REJECTED" | "NEEDS_REVISION",
      "reason": "mandatory tie-break explanation"
    }
    ```
  - **Behavior**: Manually registers `BoardDecision` with `isTieBreak: true`.
