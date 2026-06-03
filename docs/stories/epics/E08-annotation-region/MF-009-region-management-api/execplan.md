# Exec Plan

## Goal

Implement a verified backend Region API foundation for normalized rectangle
selection on manga pages.

## Scope

In scope:

- Region model, repository, service, route, and exports.
- Region API registration.
- Coordinate/type/source validation.
- Series-scoped authorization through Page and Chapter.
- Unit and route integration tests.
- Harness matrix/story/trace proof.

Out of scope:

- Browser workspace/canvas UI.
- Annotation/comment APIs.
- AI detect/save region.
- Create task from region.

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

1. Discovery: inspect current page/chapter authorization patterns.
2. Design: define Region model and normalized-coordinate rules.
3. Validation planning: service tests plus route integration tests.
4. Implementation: model/repository/service/routes/router wiring.
5. Verification: server typecheck/test, story verify, full quick if needed.
6. Harness update: matrix, durable story flags, trace.

## Stop Conditions

Pause for human confirmation if:

- Region ownership rules conflict with product docs.
- Data migration/deletion risk appears.
- Validation requirements need to be weakened.
- Task creation or annotation scope becomes necessary for correctness.

