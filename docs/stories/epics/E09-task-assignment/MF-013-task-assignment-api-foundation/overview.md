# MF-013 Task Assignment API Foundation

## Current Behavior

MangaFlow has verified Page, Region, and Annotation foundations, but the Task
module is still a placeholder. Region APIs expose no task creation route, and
Assistants cannot yet receive or start assigned production work.

## Target Behavior

Mangaka owners/co-mangakas, assigned Editors, and Admins can create Tasks for a
Page or Region and assign them to active Assistant users. Authorized users can
list and fetch Tasks by scope. Assigned Assistants can start `TODO` Tasks.

## Affected Users

- Mangaka
- Editor
- Admin
- Assistant

## Affected Product Docs

- `docs/01_complete_spec.md`
- `docs/03_api_endpoints.md`
- `docs/06_mvp_task_breakdown.md`
- `docs/product/workflow.md`
- `docs/product/roles-permissions.md`

## Non-Goals

- Assistant submission upload.
- Mangaka/editor approval workflow.
- Revision request/reject endpoints.
- Task comments/history.
- Payroll calculation.
- Frontend task assignment UI.
