# Exec Plan

## Goal

Implement verified backend Task assignment foundations for Page/Region scoped
assistant work.

## Scope

In scope:

- Task model, repository, service, routes, and exports.
- Task API registration.
- Direct Task creation and Region create-task route.
- Assistant start endpoint.
- Series-scoped authorization.
- Unit and route integration tests.
- Harness matrix/story/trace proof.

Out of scope:

- Frontend task assignment UI.
- Submission upload and review workflow.
- Revision/reject/approval endpoints.
- Payroll.
- Task comments/history.

## Risk Classification

Risk flags:

- Authorization
- Data model
- Public contracts
- Existing behavior
- Weak proof

Hard gates:

- Authorization

Lane: high-risk.

## Work Phases

1. Discovery: inspect Task spec and current Region/Page auth patterns.
2. Design: define Task MVP status and create/start boundaries.
3. Validation planning: service tests plus route integration tests.
4. Implementation: model/repository/service/routes/router wiring.
5. Verification: server typecheck/test, story verify, root quick if needed.
6. Harness update: matrix, durable story flags, trace.

## Stop Conditions

Pause for human confirmation if:

- Full submission/approval workflow becomes required for correctness.
- Task type/status contract conflicts with product docs.
- Validation requirements need to be weakened.
- Data migration/deletion risk appears.
