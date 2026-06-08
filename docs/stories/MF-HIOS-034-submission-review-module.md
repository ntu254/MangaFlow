# MF-HIOS-034 - Submission Review Module

## Status

Implemented

## Context

Task assignment exists in `MF-HIOS-033`. Assistants now need to submit immutable
work versions, Mangaka must review internally, and Tantou Editor must perform
production final approval before a task is complete.

## Scope

Backend Submission review module only. No frontend integration in this story.

### Allowed

- `server/src/modules/submission/` model, repository, service, controller,
  routes, validation, and tests.
- `Submission` model using `SUBMISSION_STATUSES` from
  `shared/workflow/status.ts`.
- `POST /api/tasks/:taskId/submissions`.
- `POST /api/submissions/:submissionId/mangaka-approve`.
- `POST /api/submissions/:submissionId/request-revision`.
- `POST /api/submissions/:submissionId/reject`.
- `POST /api/submissions/:submissionId/editor-approve`.
- Service-owned status transition guards for Submission and Task.
- Assistant access enforcement via `Task.assignedTo`.

### Forbidden

- Frontend changes.
- Comment Resolution module implementation.
- PublicationReadinessService implementation.
- Payroll calculation or AssistantEarning creation.
- AI processing.
- Generic `PATCH status` workflow endpoints.
- Merge to `main`.

## Acceptance Criteria

1. Assistant can create a new immutable submission version only for their
   assigned task.
2. New submission version starts as `SUBMITTED` and sets the Task to
   `SUBMITTED`.
3. Revisions create a new Submission version; existing versions are not edited.
4. Mangaka can approve a `SUBMITTED` submission and moves Task to
   `MANGAKA_APPROVED`.
5. Editor final approval is allowed only after Mangaka approval and moves Task
   to `EDITOR_APPROVED`.
6. Wrong role cannot skip Mangaka review.
7. Revision request and rejection follow `workflow-status.md` transitions.
8. Editor final approval is the only boundary that can trigger payroll in a
   later story; this story records no payout.
9. Server build, lint, tests, context, arch-check, trace, and story verify pass.

## Validation

- `npm run build --prefix server`: pass on 2026-06-08.
- `npm run lint --prefix server`: pass on 2026-06-08.
- `npm test --prefix server`: pass on 2026-06-08, 9 test files / 37 tests.
- `git diff --check`: pass on 2026-06-08 with Git line-ending advisory only.
- `scripts/bin/harness-cli.exe context --story MF-HIOS-034`: pass on
  2026-06-08.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-034`: pass on
  2026-06-08.
- `scripts/bin/harness-cli.exe trace ... --story MF-HIOS-034`: recorded trace
  `#36` and met detailed tier.
- `scripts/bin/harness-cli.exe story verify MF-HIOS-034`: pass on
  2026-06-08; server tests and governance gate passed.

## Validation Evidence

- `Submission` model uses `SUBMISSION_STATUSES` from
  `shared/workflow/status.ts`.
- `Submission(taskId, version)` has a unique index so submitted versions are
  append-only by version.
- `POST /api/tasks/:taskId/submissions` creates a new version and moves Task
  to `SUBMITTED`.
- Assistant submission is limited to `Task.assignedTo` and requires system role
  `ASSISTANT` plus active Assistant SeriesMember.
- Mangaka approval requires `SUBMITTED` and moves Task to `MANGAKA_APPROVED`.
- Editor final approval requires Mangaka approval first and moves Task to
  `EDITOR_APPROVED`.
- Revision and rejection actions follow `workflow-status.md` transition limits.
- No payroll calculation, AssistantEarning creation, Comment module, or
  frontend integration was implemented.

## Documentation

- `docs/contracts/submission-review.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/api.md`
- `docs/architecture/database.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Follow-Up

- MF-HIOS-035: Comment Resolution backend module.
- MF-HIOS-036: Payroll MVP calculation after Editor final approval.
- MF-HIOS-041: Client connects real task/submission APIs.
