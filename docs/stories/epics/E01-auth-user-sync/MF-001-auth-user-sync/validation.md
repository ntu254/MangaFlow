# Validation

## Proof Strategy

This story cannot be considered implemented by build checks alone. It needs
proof at the auth boundary, data sync boundary, API contract boundary, and
minimal client auth state boundary.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Role/status parsing; redirect mapping; Clerk claim to internal user DTO; API success/error envelope helpers; onboarding input validation. |
| Integration | Missing token returns `401`; invalid token returns `401`; valid token with no local user follows accepted sync behavior; sync is idempotent by `clerkId`; suspended user returns `403`; `/api/auth/me` returns standard envelope. |
| E2E | Signed-out user sees public auth route; signed-in user without role lands on onboarding; role-bearing user redirects to the correct app dashboard placeholder. |
| Platform | `npm run typecheck`; `npm run build`; backend health still passes; auth routes boot with required env validation. |
| Performance | Auth middleware does not duplicate Clerk verification or database reads in one request path. |
| Logs/Audit | Auth failures are logged without token leakage; sync/onboarding audit events are emitted or explicitly deferred with a follow-up story. |

## Fixtures

Required deterministic fixtures:

- Clerk subject `clerk_admin_001`.
- Clerk subject `clerk_mangaka_001`.
- Clerk subject `clerk_pending_001`.
- Clerk subject `clerk_suspended_001`.
- User email/profile payloads for each subject.

Accepted integration strategy:

- Mock the Clerk verifier at the backend boundary for deterministic tests.
- Use repository-level fakes for auth service behavior in this slice while
  keeping runtime Mongoose/MongoDB wiring in place. Live/disposable Mongo proof
  is deferred until the database test harness exists.

## Commands

```text
npm run typecheck
npm run build
npm run test:quick
npm run test --workspace server
npm run test --workspace client
```

## Acceptance Evidence

Implemented deterministic proof:

- `npm run test --workspace server` passed.
  - Auth service syncs Clerk profiles idempotently.
  - Redirect mapping covers pending, role-bearing, and suspended users.
  - Onboarding can request `MANGAKA` without assigning `systemRole`.
  - Onboarding rejects privileged role requests.
  - Auth routes cover missing token `401`, invalid token `401`, and sync-user
    success envelope.
- `npm run test --workspace client` passed.
  - Client redirect helper covers signed-out, pending, role-bearing, and
    suspended states.
- `npm run test:quick` passed.
  - Root typecheck, tests, and build all pass.
- HTTP smoke passed on local dev ports:
  - `GET http://localhost:5001/api/health` returned success envelope.
  - `GET http://localhost:5001/api/auth/me` without token returned `401`.
  - `GET http://localhost:5174` returned Vite HTML.

Deferred proof:

- Live Clerk sign-in E2E is not run because no Clerk project keys were provided.
- Live/disposable Mongo integration is deferred until database test
  infrastructure exists; this slice uses repository-level fakes per decision
  `0008-auth-user-sync-boundary`.
- Sync/onboarding audit records are deferred to the audit/role administration
  story; operational auth verification failures are logged without token data.

Durable proof status for this slice:

```text
scripts/bin/harness-cli story update --id MF-001 --status implemented --unit 1 --integration 1 --e2e 0 --platform 1
```
