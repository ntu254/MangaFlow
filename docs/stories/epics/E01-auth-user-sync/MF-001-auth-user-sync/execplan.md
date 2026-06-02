# Exec Plan

## Goal

Create the first authenticated MangaFlow slice with Clerk verification,
internal user sync, current-user API, and client redirect/onboarding state.

## Scope

In scope:

- Clerk client setup.
- Clerk backend verification.
- MongoDB connection for the user collection.
- User model/repository/service for auth sync.
- `GET /api/auth/me`.
- `POST /api/auth/sync-user`.
- A constrained `POST /api/auth/complete-onboarding` flow that cannot grant
  unauthorized privileged roles.
- Minimal client auth shell and onboarding state.
- Unit and integration tests for auth boundaries.

Out of scope:

- Full permission matrix.
- Series-level roles.
- Admin user management.
- Domain CRUD beyond user sync.
- File/storage authorization.
- Deployment.

## Risk Classification

Risk flags:

- Auth.
- Authorization.
- Data model.
- Audit/security.
- External systems.
- Public contracts.
- Weak proof.

Hard gates:

- Auth.
- Authorization.
- External provider behavior.
- Audit/security.

Lane:

- high-risk

## Work Phases

1. Resolve open decisions for pending role persistence and onboarding role
   assignment.
2. Add or update product docs if the decisions change the contract.
3. Define deterministic Clerk/Mongo test strategy.
4. Implement backend auth boundary and user sync.
5. Implement client Clerk provider and redirect/onboarding shell.
6. Add validation for unit, integration, and minimal E2E or browser smoke.
7. Update story evidence, durable Harness proof, and trace.

## Stop Conditions

Pause for human confirmation if:

- The onboarding flow would let users assign their own privileged role.
- A live Clerk project or production credentials are required for tests.
- The story needs a database migration that can delete or rewrite existing
  data.
- Validation cannot cover missing/invalid token, suspended user, and sync
  idempotency.
- The story expands into full role/permission management.
