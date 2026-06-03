# MF-029 Missing UI Pages

## Current Behavior

The frontend has registered routes and files for the missing list views (`TaskList`, `Submissions`, `AssignedSeries`), but we need to ensure that their UI and backend integrations are 100% correct, beautiful, and fully working.

## Target Behavior

Ensure full high-fidelity support for the following pages:
- **TaskList** (`/app/assistant/tasks` and `/app/mangaka/tasks`): Allow Assistants to view, search, and filter their assigned tasks. Allow Mangakas to view all tasks created for their series.
- **Submissions** (`/app/mangaka/submissions`): Display a queue of pending submissions for Mangakas to review.
- **AssignedSeries** (`/app/editor/series`): Allow Editors to view and track all series assigned to them.

## Affected Users

- Assistant
- Mangaka
- Editor

## Affected Product Docs

- `docs/04_frontend_routes_ui_screens.md`
- `docs/06_mvp_task_breakdown.md`
- `docs/product/mvp-roadmap.md`
