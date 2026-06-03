# 0014 Assistant Submission API Boundary

## Status

Accepted.

## Context

EPIC-10 requires Assistants to upload results and submit them as versioned
Submissions. The current app already has file metadata/upload foundations, but
there is no Assistant submission UI and no completed upload-to-submission
handoff flow.

## Decision

MF-015 implements the Submission API as a backend foundation that accepts an
already uploaded `fileUrl` and optional `previewUrl`. It does not implement
binary upload or preview generation. Each create request produces a new
immutable Submission version for the Task and updates the Task status to
`SUBMITTED`.

Only the assigned Assistant can create a Submission. Admin, assigned-by users,
assigned Assistants, and series members can read visible Submissions.

## Consequences

- EPIC-10 gains a stable API and data model for future Assistant UI work.
- Upload mechanics remain reusable from the existing file module and can be
  connected later without changing the Submission record shape.
- Revision and approval workflows remain explicit future stories.

## Non-Goals

- R2 binary upload inside Submission routes.
- Assistant submission UI.
- Mangaka/editor review transitions.
- Comments/history.
- Payroll.
