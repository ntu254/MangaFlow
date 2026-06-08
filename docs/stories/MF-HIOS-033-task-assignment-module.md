# MF-HIOS-033 — Task/Assignment Module with requireSeriesRole Middleware

## Status

Implemented

## Context

Chapter, Page, Region, FileAsset modules exist (MF-HIOS-031/032). Need Task/TaskType/Assignment module with proper authorization: `requireSeriesRole` middleware to enforce SeriesMember access, Task creation gated by Series status and role, Assistant assignment eligibility via SeriesMember + Task.assignedTo.

## Scope

Backend Task/TaskType/Assignment module with authorization middleware. No frontend integration in this story.

### Allowed

- New `server/src/modules/task/` folder with model, repository, service, controller, routes, validation, middleware
- TaskType config model (active/task types with base rates)
- Task model with status enum from `shared/workflow/status.ts`
- `requireSeriesRole` middleware for SeriesMember role enforcement
- Assignment: only Mangaka/Editor can assign, only active SeriesMember Assistants eligible
- Task.assignedTo = actual workspace access
- Proper error handling with AppError

### Forbidden

- Frontend API/client changes
- Submission/Comment modules
- Publication/Readiness logic
- AI service integration
- Merge to `main`
- Commit `.env`

## Acceptance Criteria

1. TaskType model: name, description, baseRate, isActive
2. Task model with TaskStatus enum, assignedTo, dueDate, baseRate snapshot, contextPageIds
3. requireSeriesRole middleware checks SeriesMember role + status
5. Create task: only MANGAKA/EDITOR, Series must be APPROVED/ONGOING/AT_RISK
6. Assistant must be active SeriesMember with role=ASSISTANT
7. Task creation requires valid TaskType (active)
8. Assistant assignment grants Task.assignedTo workspace access
9. Build + test pass

## Validation

- `npm run build --prefix server`: pass on 2026-06-08.
- `npm run lint --prefix server`: pass on 2026-06-08.
- `npm test --prefix server`: pass on 2026-06-08, 7 test files / 27 tests.

## Validation Evidence

- Task model uses `TASK_STATUSES` and `TASK_PRIORITIES` from `shared/workflow/status.ts`.
- SeriesMember model supports `accessScope=TASK_ONLY` for Assistant eligibility.
- Task creation checks Series status, Chapter ownership, TaskType active state, Assistant system role, active Assistant SeriesMember, and `TASK_ONLY` access scope.
- Task read/list/update service tests prove Assistant access is task-based and manager updates require active Mangaka/Editor SeriesMember.
- `/api/tasks` routes are mounted and task type routes are ordered before `/:taskId`.
- No frontend integration, Submission/Comment workflow, PublicationReadinessService, AI, or payroll calculation was implemented.

## Documentation

- `docs/contracts/task-assignment.md`
- `docs/contracts/production-team.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Follow-Up

- MF-HIOS-034: Submission/Review module
- MF-HIOS-041: Client connect real task API
