# 0012 Task Assignment API Boundary

Date: 2026-06-03

## Status

Accepted

## Context

EPIC-09 requires Tasks assigned to Assistants after Page, Region, and
Annotation foundations exist. The full Task domain includes submission upload,
reviews, revisions, comments, history, and payroll, but those workflows need
their own proof and UI/API boundaries.

## Decision

MangaFlow implements Task assignment as a backend foundation slice first.
Tasks are page-scoped and can optionally reference a Region. The server derives
`seriesId` and `chapterId` from Page -> Chapter, and validates optional Region
ownership against the same Page.

Task creation is allowed to Admin, Mangaka owner/co-mangaka, and assigned
Editor roles. Task reads are allowed to Admin, assigned Assistant, assigning
user, or series members. Assigned Assistants can start `TODO` Tasks, moving
them to `IN_PROGRESS`.

`POST /api/regions/:regionId/create-task` is included in this slice. Since
Region supports `BUBBLE` but Task types do not, a `BUBBLE` Region defaults to
Task type `OTHER` unless the caller supplies another valid Task type.

## Alternatives Considered

1. Implement submission and review endpoints in the same story. Rejected
   because file upload, approval states, and payroll need separate validation.
2. Add `BUBBLE` as a Task type. Rejected to keep Task type aligned with the
   current product Task schema.

## Consequences

Positive:

- Assistants can receive and start assigned production work.
- Region-to-task workflow now has a backend contract.
- Later submission and payroll stories can build on stable Task ids.

Tradeoffs:

- Task UI, submission, approvals, history, comments, and payroll remain out of
  scope.
- Region `BUBBLE` tasks are represented as `OTHER` unless explicitly typed.

## Follow-Up

- Add Page Workspace task assignment UI.
- Add Assistant task list/detail UI.
- Add submission upload and review workflow.
- Add task history/comments and payroll calculation.
