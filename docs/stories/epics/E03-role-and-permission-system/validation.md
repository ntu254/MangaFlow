# Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Backend RBAC middleware tests cover system-role and series-role allow/deny behavior. Frontend RoleGuard tests cover allowed, missing, unassigned, and disallowed users. |
| Integration | Existing protected route tests exercise RBAC through Series, Manuscript, Chapter, Page, and Admin APIs. |
| E2E | Browser E2E remains deferred until reusable Clerk/Mongo fixtures exist. |
| Platform | Typecheck/test/build commands run locally. |
| Release | Verify Mangakas can still access their Series. |

## Evidence

- Added `server/src/modules/auth/rbac.middleware.test.ts`.
- Added `client/src/shared/components/RoleGuard.test.tsx`.
- `npm run typecheck --workspace server` passes.
- `npm run test --workspace server` passes: 14 server source test files, 49 tests.
- `npm run typecheck --workspace client` passes.
- `npm run test --workspace client` passes: 3 client test files, 12 tests.
