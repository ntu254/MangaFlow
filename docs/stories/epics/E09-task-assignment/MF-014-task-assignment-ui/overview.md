# MF-014 Task Assignment UI

## Current Behavior

MF-013 exposes Task APIs for creating page or region tasks and lets assigned
Assistants list and start their tasks. The browser workspace can create
Regions and Annotations, but it does not create Tasks or show assigned work.
There is no Assistant task dashboard route.

## Target Behavior

Mangakas can select a Page Workspace Region, fill a compact task assignment
form, create a Task through the MF-013 API, and see the Task in the workspace
task list with initial `TODO` status. Assistants can open
`/app/assistant/dashboard`, see their assigned Tasks, and start a `TODO` Task.

## Affected Users

- Mangaka.
- Assistant.

## Affected Product Docs

- `docs/06_mvp_task_breakdown.md`
- `docs/04_frontend_routes_ui_screens.md`
- `docs/product/mvp-roadmap.md`
- `docs/product/workflow.md`

## Non-Goals

- Assistant upload/submission.
- Mangaka/editor approval and revision flow.
- Comments, history, and audit feed.
- Payroll calculation.
- A full assistant directory picker. The form accepts an Assistant user id until
  a series member directory API exists.
