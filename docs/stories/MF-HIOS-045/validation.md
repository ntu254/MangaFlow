# Validation

## Proof Strategy

Prove backend summary aggregation, TypeScript compile safety, frontend build safety, and Harness governance gates.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Dashboard service returns expected counts and Board override warning. |
| Integration | Deferred; no live Mongo/auth fixture in CI. Route uses shared `requireAuth` + `requireRole("ADMIN")`. |
| E2E | Not configured. |
| Platform | Root build. |
| Performance | N/A for MVP count summary. |
| Logs/Audit | Trace + story evidence; persistent audit log future scope. |

## Fixtures

Service test mocks count repositories.

## Commands

```text
npm run test --prefix server
npm run lint --prefix server
npm run lint --prefix client
npm run build
git diff --check
scripts\bin\harness-cli arch-check --story MF-HIOS-045
scripts\bin\harness-cli story verify MF-HIOS-045
```

## Acceptance Evidence

- `npm run test --prefix server` -> pass, 18 files / 81 tests.
- `npm run lint --prefix server` -> pass.
- `npm run lint --prefix client` -> pass after replacing unsupported `replaceAll`.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass.
