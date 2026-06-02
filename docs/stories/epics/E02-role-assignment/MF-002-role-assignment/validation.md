# Validation

## Proof Strategy

This story changes authorization behavior, so build checks alone are not
enough. Proof must cover admin-only access, invalid inputs, role/status state
transitions, and the client routing effect after assignment.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Role/status validators; admin actor checks; requested role clearing; self-assignment rejection if included. |
| Integration | Missing token `401`; non-admin caller `403`; admin can list pending users; admin assigns role; admin suspends/reactivates user; invalid role/status returns `400`. |
| E2E | Pending user stays on onboarding; after admin assignment, same user redirects to role dashboard. |
| Platform | `npm run test:quick`; backend health still passes; auth routes still pass. |
| Performance | User review list is paginated or bounded. |
| Logs/Audit | Role/status changes emit audit-worthy events without leaking tokens. |

## Fixtures

Required deterministic fixtures:

- Admin actor: `clerk_admin_001`.
- Pending target: `clerk_pending_001`.
- Mangaka target: `clerk_mangaka_001`.
- Suspended target: `clerk_suspended_001`.
- Non-admin actor: `clerk_assistant_001`.

## Commands

```text
npm run test --workspace server
npm run test --workspace client
npm run test:quick
```

## Acceptance Evidence

Implemented deterministic proof:

- `npm run test --workspace server` passed.
  - Role assignment service rejects non-admin actors.
  - Active admins can list pending users.
  - Active admins can assign `systemRole` and clear `requestedSystemRole`.
  - Active admins can suspend and reactivate users.
  - Invalid role input returns `INVALID_ROLE`.
  - Admin routes return `403 ADMIN_REQUIRED` for non-admin callers.
  - Admin routes list pending users, assign roles, update status, and reject
    invalid role input.
- `npm run test --workspace client` passed.
  - Admin role review helper identifies pending requested-role users.
  - Admin role review route helper returns `/app/admin/users/role-review`.
- `npm run test:quick` passed.
  - Root typecheck, tests, and build all pass.

Deferred proof:

- Browser E2E for pending user -> admin assignment -> role dashboard redirect is
  deferred until a live Clerk browser session and seeded first admin are
  available.
- Persistent audit-log storage is deferred; this slice defines audit-worthy
  events but does not introduce an audit collection.

Durable proof status for this slice:

```text
scripts/bin/harness-cli story update --id MF-002 --status implemented --unit 1 --integration 1 --e2e 0 --platform 1
```
