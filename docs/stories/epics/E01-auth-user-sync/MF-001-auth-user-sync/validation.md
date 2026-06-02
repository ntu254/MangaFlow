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

Preferred integration strategy:

- Mock the Clerk verifier at the backend boundary for deterministic tests.
- Use a disposable Mongo test database or repository-level fake only if the
  selected strategy is documented before implementation.

## Commands

Add exact commands after implementation scripts exist.

Expected minimum:

```text
npm run typecheck
npm run build
npm run test:quick
```

Expected additions during implementation:

```text
npm run test --workspace server
npm run test --workspace client
```

## Acceptance Evidence

Add results after verification.

Before marking implemented, update durable proof status with:

```text
scripts/bin/harness-cli story update --id MF-001 --status implemented --unit 1 --integration 1 --e2e 1 --platform 1
```
