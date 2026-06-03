# Design

## Domain Model

MF-016 consumes existing Task, Page, Region, and Submission API contracts. No
new client-visible domain model is introduced.

## Application Flow

Task list:

1. Assistant opens `/app/assistant/tasks` or `/app/assistant/dashboard`.
2. Client loads assigned Tasks with `/api/tasks`.
3. Assistant can start `TODO` Tasks.
4. Assistant can open a Task detail route.

Task detail:

1. Client loads Task detail from `/api/tasks/:taskId`.
2. Client loads Page preview from `/api/pages/:pageId`.
3. Client loads Regions from `/api/pages/:pageId/regions` and highlights the
   Task region when present.
4. Client loads Task Submissions from `/api/tasks/:taskId/submissions`.
5. Assistant submits `fileUrl`, optional `previewUrl`, and note to
   `/api/tasks/:taskId/submissions`.
6. The returned Submission appears in the local submission list and Task status
   is refreshed.

## Interface Contract

Client additions:

- `getTask(token, taskId)`
- `listSubmissions(token)`
- `listTaskSubmissions(token, taskId)`
- `createTaskSubmission(token, taskId, payload)`

Routes:

- `/app/assistant/tasks`
- `/app/assistant/tasks/:taskId`

## Data Model

No schema changes. MF-016 consumes MF-015 Submission records.

## UI / Platform Impact

The UI follows the existing compact Assistant workspace style: white work
surfaces, restrained borders, Geist typography, `Button`/`Badge` primitives,
and semantic form controls.

## Observability

No new runtime logs. Harness trace captures validation proof and known rendered
QA limits.

## Alternatives Considered

1. Implement binary upload in the browser now. Rejected because the MF-015
   boundary accepts already-uploaded URLs and R2 multipart/asset ownership needs
   a dedicated story.
2. Keep only `/app/assistant/dashboard`. Rejected because TASK-10.3 specifies
   `/app/assistant/tasks` and `/app/assistant/tasks/:taskId`.
