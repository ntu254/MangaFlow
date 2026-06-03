# Validation

## Proof Strategy

Proof should cover client API helper behavior, protected UI routing, and basic
runtime smoke. Backend authorization remains enforced by `MF-002`.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Admin API URL builders; pending role-review identification; assignable role list. |
| Integration | Client calls admin endpoints with bearer token; failed responses surface an error state. |
| E2E | Signed-in seeded admin opens role-review UI and sees pending users. |
| Platform | `npm run test:quick`; local Vite route smoke. |
| Performance | Pending list stays bounded by backend limit. |
| Logs/Audit | Backend events remain the audit source. |

## Fixtures

- Seeded admin user from `MF-002`.
- Optional pending user with `requestedSystemRole`.

## Commands

```text
npm run test --workspace client
npm run test:quick
```

## Acceptance Evidence

Implemented deterministic proof:

- `npm run test --workspace client` passed.
  - Admin role-review route helper returns `/app/admin/users/role-review`.
  - Pending role-review helper identifies active users with requested roles.
  - Admin API URL helpers build role-review, role update, and status update
    endpoints.
  - Assignable system roles exclude `ADMIN`.
- `npm run test:quick` passed.
  - Root typecheck, tests, and build all pass.
  - Server tests: 8 files, 34 tests passed.
  - Client tests: 2 files, 9 tests passed.
- Local Vite/API smoke passed:
  - `GET http://localhost:5174/app/admin/users/role-review` returned `200`.
  - Vite served `src/App.tsx` containing the role-review UI.
  - Vite served `src/features/auth/admin-flow.ts` containing admin endpoint
    helpers.
  - Admin API preflight from `http://localhost:5174` returned `204` with
    `Access-Control-Allow-Origin=http://localhost:5174`.

Deferred proof:

- Browser click-through E2E for assigning a pending user from the UI is deferred
  because `agent-browser` is not available in PATH and the agent cannot reuse
  the live browser session token.

Durable proof status for this slice:

```text
scripts/bin/harness-cli story update --id MF-003 --status implemented --unit 1 --integration 1 --e2e 0 --platform 1
```
