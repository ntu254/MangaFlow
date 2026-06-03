# Design

## Data Model

### Comment Schema

```typescript
interface Comment {
  targetType: "MANUSCRIPT" | "CHAPTER" | "PAGE" | "TASK" | "SUBMISSION";
  targetId: ObjectId;      // References target model
  pageId?: ObjectId;       // Optional, contextual page link
  annotationId?: ObjectId; // Optional, link to a rectangular annotation
  content: string;
  createdBy: ObjectId;     // References User
  status: "OPEN" | "FIXED_BY_ASSISTANT" | "VERIFIED_BY_MANGAKA" | "RESOLVED_BY_EDITOR";
  
  fixedBy?: ObjectId;      // Assistant who marked it fixed
  fixedAt?: Date;
  
  verifiedBy?: ObjectId;   // Mangaka who verified it
  verifiedAt?: Date;
  
  resolvedBy?: ObjectId;   // Editor who resolved it
  resolvedAt?: Date;
  
  reopenedBy?: ObjectId;   // Editor who reopened it
  reopenedAt?: Date;
  reopenReason?: string;
}
```

## API Endpoints

### CRUD Routes
- `POST /api/comments`: Create a comment.
- `GET /api/comments/target/:targetType/:targetId`: List comments targeting a specific object.
- `GET /api/comments/:commentId`: Fetch details of a specific comment.
- `PATCH /api/comments/:commentId`: Edit comment content (only author/admin allowed).
- `DELETE /api/comments/:commentId`: Delete a comment (only author/admin allowed).

### Workflow State Transitions
- `POST /api/comments/:commentId/mark-fixed`: Move status to `FIXED_BY_ASSISTANT` (only assigned Assistant or Admin).
- `POST /api/comments/:commentId/verify-fixed`: Move status to `VERIFIED_BY_MANGAKA` (only Mangaka or Admin).
- `POST /api/comments/:commentId/resolve`: Move status to `RESOLVED_BY_EDITOR` (only Editor or Admin).
- `POST /api/comments/:commentId/reopen`: Move status back to `OPEN` (only Editor or Admin, requires `reason`).

## Authorization & Business Rules

1. **Access Permissions**:
   - Only users belonging to the series containing the target object (or Admins) can read or create comments.
2. **Transition Rules**:
   - `mark-fixed`: Allowed for the Assistant assigned to the target Task/Submission. Status changes from `OPEN` to `FIXED_BY_ASSISTANT`.
   - `verify-fixed`: Allowed for the Series Owner/Co-Creator Mangaka. Status changes from `FIXED_BY_ASSISTANT` to `VERIFIED_BY_MANGAKA`.
   - `resolve`: Allowed for the Series Editor or Admin. Status changes from any state to `RESOLVED_BY_EDITOR`.
   - `reopen`: Allowed for the Series Editor or Admin. Status changes back to `OPEN`.
