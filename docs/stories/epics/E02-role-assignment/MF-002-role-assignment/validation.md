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

Add exact commands after implementation.

Expected minimum:

```text
npm run test --workspace server
npm run test --workspace client
npm run test:quick
```

## Acceptance Evidence

Add results after implementation. Do not mark implemented until durable proof
has at least unit, integration, and platform evidence.

