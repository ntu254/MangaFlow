# MF-015 Assistant Submission API Foundation

## Current Behavior

MF-013 and MF-014 let Mangakas assign Tasks and Assistants start assigned work.
There is no Submission model or API for Assistants to submit completed task
outputs.

## Target Behavior

Assigned Assistants can create immutable, versioned Submissions for their
Tasks. Authorized users can list visible Submissions, list Submissions for a
specific Task, and fetch Submission detail. New Submissions start at
`PENDING_MANGAKA_REVIEW`, carry a version number, and move the related Task to
`SUBMITTED`.

## Affected Users

- Assistant.
- Mangaka.
- Editor.
- Admin.

## Affected Product Docs

- `docs/06_mvp_task_breakdown.md`
- `docs/02_database_schema.md`
- `docs/product/workflow.md`
- `docs/product/mvp-roadmap.md`

## Non-Goals

- Uploading binary files to R2.
- Assistant submission UI.
- Mangaka/editor approval and revision endpoints.
- Comments/history.
- Payroll.
