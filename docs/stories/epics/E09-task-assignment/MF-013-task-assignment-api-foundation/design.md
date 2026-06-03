# Design

## Domain Model

`Task` is assigned production work for an Assistant.

Fields:

- `seriesId`
- `chapterId`
- `pageId`
- `regionId?`
- `assignedBy`
- `assignedTo`
- `title`
- `description`
- `type`: `BACKGROUND | INKING | SCREENTONE | CLEANUP | EFFECT | OTHER`
- `priority`: `LOW | MEDIUM | HIGH | URGENT`
- `status`: MVP foundation supports create/update plus `TODO -> IN_PROGRESS`
- `revisionRound`
- `baseRate`
- `bonusAmount`
- `dueDate?`

Business rules:

- Task `seriesId` and `chapterId` are derived from the Page's Chapter.
- Optional `regionId` must belong to the same Page.
- `assignedTo` must be an active Assistant when the user repository can resolve
  the assignee.
- `POST /regions/:regionId/create-task` derives page/region scope and maps a
  `BUBBLE` Region to `OTHER` unless the caller supplies an explicit valid Task
  type.
- Assigned Assistants can start only `TODO` Tasks.

## Application Flow

Commands:

- Create Task directly from page/region payload.
- Create Task from a Region route.
- Update Task editable metadata.
- Delete Task before submitted workflow states.
- Start assigned Task.

Queries:

- List Tasks by caller scope.
- Get Task by id.

Authorization flow:

1. Resolve Page -> Chapter -> Series.
2. Resolve caller internal user.
3. Admin is globally allowed.
4. Creators must be Mangaka/Editor with owner/co-mangaka/editor membership.
5. Assistant read/start access is limited to assigned Tasks.

## Interface Contract

Routes:

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `POST /api/tasks/:taskId/start`
- `POST /api/regions/:regionId/create-task`

Out-of-scope routes:

- `POST /api/tasks/:taskId/submit`
- `POST /api/tasks/:taskId/request-revision`
- `POST /api/tasks/:taskId/mangaka-approve`
- `POST /api/tasks/:taskId/editor-approve`
- `POST /api/tasks/:taskId/reject`

## Data Model

Mongo collection:

- `tasks`

Indexes:

- `{ assignedTo: 1, status: 1 }`
- `{ seriesId: 1, status: 1 }`
- `{ pageId: 1, createdAt: -1 }`
- `{ regionId: 1 }` sparse

No migration is required because Task records do not exist yet.

## UI / Platform Impact

No UI changes in this slice. Page Workspace task assignment controls are a
future story.

## Observability

Uses normal API response errors. Audit/task history is deferred to a future
workflow story.

## Alternatives Considered

1. Implement full submission and approval workflow now. Rejected because file
   submission, comments, payroll, and review states need separate proof.
2. Let `POST /regions/:regionId/create-task` infer `BUBBLE` task type. Rejected
   as a direct type because Task spec does not include `BUBBLE`; default maps
   to `OTHER`.
