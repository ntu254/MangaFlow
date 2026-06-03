# Exec Plan

## Goal

Implement a verified backend Annotation API foundation for page-level rectangle
review markers.

## Scope

In scope:

- Annotation model, repository, service, routes, and exports.
- Annotation API registration.
- Coordinate/type/status/target validation.
- Series-scoped read/write authorization.
- Creator/Editor/Admin update/delete authorization.
- Unit and route integration tests.
- Harness matrix/story/trace proof.

Out of scope:

- Browser annotation UI.
- Annotation comment endpoint.
- Full comment lifecycle.
- Task/submission annotation targets.
- AI annotation generation.

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

1. Discovery: inspect Annotation spec, Region API, and Page/Chapter RBAC.
2. Design: define Annotation model and page-only target rules.
3. Validation planning: service tests plus route integration tests.
4. Implementation: model/repository/service/routes/router wiring.
5. Verification: server typecheck/test, story verify, root quick if needed.
6. Harness update: matrix, durable story flags, trace.

## Stop Conditions

Pause for human confirmation if:

- Product behavior requires comment lifecycle in the same slice.
- Task/submission target support becomes necessary for correctness.
- Validation requirements need to be weakened.
- Data migration/deletion risk appears.
