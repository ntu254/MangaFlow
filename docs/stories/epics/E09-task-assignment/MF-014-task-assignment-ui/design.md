# Design

## Domain Model

The UI consumes the Task contract introduced in MF-013:

- `Task` belongs to a series, chapter, page, and optionally a region.
- `assignedTo` stores the Assistant user id.
- Creation starts at `TODO`.
- Assigned Assistants can move `TODO` tasks to `IN_PROGRESS`.

No new domain model is introduced in this story.

## Application Flow

Page Workspace:

1. Load page, regions, annotations, and visible tasks in parallel.
2. Select a region from the existing workspace overlay/list.
3. Fill title, description, Assistant id, type, priority, due date, base rate,
   and bonus amount.
4. POST to `/api/regions/:regionId/create-task`.
5. Append the returned Task to the workspace task list and keep the selected
   region visible.

Assistant dashboard:

1. Load `/api/tasks`.
2. Render assigned tasks grouped as a compact list.
3. POST `/api/tasks/:taskId/start` for `TODO` tasks.
4. Replace the updated Task in local state.

## Interface Contract

Frontend API client:

- `listTasks(token)`
- `createTaskFromRegion(token, regionId, payload)`
- `startTask(token, taskId)`
- `deleteTask(token, taskId)`

The client follows the existing `region` and `annotation` API response parser
pattern.

## Data Model

No schema changes. MF-014 only consumes the existing Task API.

## UI / Platform Impact

- Adds Page Workspace task panel inside the existing Mangaka workspace route.
- Adds `/app/assistant/dashboard` route guarded by the Assistant system role.
- Uses the existing compact card/sidebar visual language and shadcn-style
  `Button`/`Badge` components.

## Observability

No new runtime logs. Harness trace and story validation capture proof.

## Alternatives Considered

1. Build a full Assistant selector backed by a new series member API. Rejected
   for this slice because the API does not exist and would expand MF-014 into a
   backend membership directory story.
2. Only show task creation in the workspace. Rejected because TASK-09.3 requires
   Tasks to appear in an Assistant dashboard.
