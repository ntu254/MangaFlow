# Design

## Domain Model

Submission fields:

- `taskId`
- `submittedBy`
- `fileUrl`
- optional `previewUrl`
- optional `note`
- `version`
- `status`
- timestamps

Allowed statuses in this slice:

- `PENDING_MANGAKA_REVIEW`
- `REVISION_REQUESTED`
- `MANGAKA_APPROVED`
- `EDITOR_APPROVED`
- `REJECTED`

Creation always starts at `PENDING_MANGAKA_REVIEW`. The service assigns
`version` as the next integer for the Task. Existing Submissions are immutable
through this API.

## Application Flow

1. Assistant starts or owns an assigned Task.
2. Assistant posts a Submission with an already uploaded `fileUrl`.
3. Server checks that the local user is the assigned Assistant and the Task is
   in a submittable state.
4. Server creates the next version and updates the Task to `SUBMITTED`.
5. Authorized readers can list or fetch Submissions.

## Interface Contract

Routes:

- `GET /api/submissions`
- `GET /api/tasks/:taskId/submissions`
- `POST /api/tasks/:taskId/submissions`
- `GET /api/submissions/:submissionId`

Read access:

- Admin can read all.
- Assigned Assistant can read their own task submissions.
- Assigned-by user and series members can read submissions in their series.

Create access:

- Only the assigned Assistant can create Submissions for the Task.

## Data Model

Mongo collection: `submissions`

Indexes:

- `{ taskId: 1, version: -1 }`
- `{ submittedBy: 1, createdAt: -1 }`
- unique `{ taskId: 1, version: 1 }`

## UI / Platform Impact

No UI change in MF-015. Assistant submission screens are a future story.

## Observability

No new logs. Durable Harness trace records the API boundary and validation
proof.

## Alternatives Considered

1. Implement binary upload in this story. Rejected because R2 upload and preview
   generation need separate validation and UI.
2. Allow patching old Submissions. Rejected because the spec says Assistants
   must not edit old Submissions after submit; revisions are represented as new
   versions.
