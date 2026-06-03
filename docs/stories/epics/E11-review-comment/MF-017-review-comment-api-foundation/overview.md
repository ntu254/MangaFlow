# MF-017 Review & Comment API Foundation

## Current Behavior

Users can create pages, visual regions, tasks, and submissions, but there is no comment model or endpoint. Reviewers cannot leave comments or track resolution workflows on manuscripts, chapters, pages, tasks, or submissions.

## Target Behavior

Implement a structured Comment model and API. Comments can target Manuscripts, Chapters, Pages, Tasks, and Submissions. Comments transition through a formal workflow:
`OPEN` -> `FIXED_BY_ASSISTANT` -> `VERIFIED_BY_MANGAKA` -> `RESOLVED_BY_EDITOR`.
The API supports creating, listing (with target filter), fetching, updating, and deleting comments, alongside transitioning states via `/mark-fixed`, `/verify-fixed`, `/resolve`, and `/reopen` endpoints.

## Affected Users

- Assistant
- Mangaka
- Editor
- Admin

## Affected Product Docs

- `docs/06_mvp_task_breakdown.md`
- `docs/02_database_schema.md`
- `docs/03_api_endpoints.md`

## Non-Goals

- Frontend comment UI panel (deferred to MF-018).
- Blocking publish readiness based on unresolved comments (deferred to editor/publishing flow).
- In-app or email notifications for comments (deferred to notifications).
