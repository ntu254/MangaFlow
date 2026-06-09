# Exec Plan

## Goal

Implement the smallest read-only Admin dashboard summary slice required by the Admin Dashboard contract.

## Scope

In scope:

- `GET /api/dashboard/admin/sidebar-summary`.
- Backend count aggregation for active users, series, active tasks, Board members, and active task types.
- Admin-only route middleware.
- Admin page API loading, loading/error states, and backend data display.

Out of scope:

- Admin mutation routes.
- User, Board member, or Task Type management.
- Audit log persistence.
- Board decision overrides.

## Risk Classification

Risk flags:

- Authorization.
- Public contracts.
- Weak proof.

Hard gates:

- Authorization route protection.

## Work Phases

1. Discovery: read Admin dashboard/auth/security/UI docs and inspect existing Admin WIP.
2. Design: isolate read-only dashboard module from unrelated Admin mutation WIP.
3. Validation planning: service unit test, TypeScript lint, root build, harness story verify.
4. Implementation: add dashboard backend module and frontend Admin API wiring.
5. Verification: run tests/lint/build/diff-check and story gate.
6. Harness update: intake, decision, trace, and story evidence.

## Stop Conditions

Pause if implementation needs role model changes, Admin mutation authorization changes, Board decision behavior, database schema migration, or validation weakening.
