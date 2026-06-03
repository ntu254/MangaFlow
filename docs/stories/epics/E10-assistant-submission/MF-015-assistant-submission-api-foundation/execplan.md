# Exec Plan

## Goal

Implement the backend foundation for Assistant Submissions on top of the MF-013
Task API.

## Scope

In scope:

- Submission model, repository, service, and routes.
- Version assignment per Task.
- Create/list/detail API routes.
- Authorization checks for assigned Assistant, Admin, assigned-by user, and
  series members.
- Task status update to `SUBMITTED` after successful create.
- Unit and integration tests.

Out of scope:

- R2 file upload flow.
- Assistant UI.
- Approval/revision endpoints.
- Comments/history.
- Payroll.

## Risk Classification

Risk flags:

- Authorization.
- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Authorization.

## Work Phases

1. Discovery of EPIC-10 spec and adjacent Task/File route patterns.
2. Story packet and durable story creation.
3. Submission model/repository/service implementation.
4. Submission route authorization and API wiring.
5. Service and route tests.
6. Validation and Harness updates.

## Stop Conditions

Pause for human confirmation if:

- Binary file upload becomes required for this API foundation.
- Task status semantics conflict with existing Task tests.
- Authorization needs to be weakened.
- Data migration or destructive behavior appears.
