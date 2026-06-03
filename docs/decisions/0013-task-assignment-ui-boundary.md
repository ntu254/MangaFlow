# 0013 Task Assignment UI Boundary

## Status

Accepted.

## Context

TASK-09.3 requires a UI for creating Tasks from Regions and making assigned
Tasks visible to Assistants. MF-013 already provides the Task API, but the
current product does not expose a series Assistant directory endpoint for a
proper dropdown selector.

## Decision

MF-014 implements the frontend over the existing MF-013 API without adding a new
backend directory contract. The Page Workspace form accepts an Assistant user id
for `assignedTo`, then relies on the Task API to validate that the assignee is
an active Assistant and belongs to the series.

MF-014 also adds a minimal Assistant dashboard at `/app/assistant/dashboard`
that lists assigned Tasks and lets the Assistant start `TODO` Tasks.

## Consequences

- EPIC-09 gets an end-to-end browser surface for assignment and Assistant start.
- The task creation form is functionally correct but not yet the final UX for
  choosing Assistants.
- A future story should add a series member/assistant directory endpoint and
  replace the id text field with a real selector.

## Non-Goals

- Submission upload.
- Approval/revision workflow.
- Task comments/history.
- Payroll.
- Backend membership directory.
