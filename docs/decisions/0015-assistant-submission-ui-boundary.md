# 0015 Assistant Submission UI Boundary

## Status

Accepted.

## Context

TASK-10.3 requires Assistant task screens, page/region preview, result upload,
and submission. MF-015 intentionally established a backend Submission API that
accepts already-uploaded `fileUrl` values while deferring binary upload and R2
handoff to a later story.

## Decision

MF-016 implements Assistant submission screens over MF-015 without adding a
binary upload picker. The submission form accepts `fileUrl`, optional
`previewUrl`, and note, then posts to `/api/tasks/:taskId/submissions`.

`/app/assistant/tasks` becomes the assigned-task list and
`/app/assistant/tasks/:taskId` becomes the detail/submit screen.

## Consequences

- Assistants get a real submission workflow using current API contracts.
- The UI is functionally correct for URL-based uploaded assets, but not final
  for production file upload ergonomics.
- A future story should connect file picker/R2 upload and pass the resulting
  asset URL into the Submission form.

## Non-Goals

- Binary upload and R2 file ownership.
- Review/approval/revision actions.
- Comments/history.
- Payroll.
