# Validation

## Proof Strategy

Prove item-level readiness evaluation for blocked and passing states, then compile/build the full app and pass Harness gates.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Readiness blocked reasons; all checks pass. |
| Integration | Deferred; no live Mongo/auth fixture in CI. |
| E2E | Not configured. |
| Platform | Root build. |
| Performance | N/A for MVP query. |
| Logs/Audit | Trace + decision record. |

## Fixtures

Service tests mock repository readiness data.

## Commands

```text
npm run test --prefix server
npm run lint --prefix server
npm run lint --prefix client
npm run build
git diff --check
scripts\bin\harness-cli arch-check --story MF-HIOS-046
scripts\bin\harness-cli story verify MF-HIOS-046
```

## Acceptance Evidence

- `npm run test --prefix server` -> pass, 19 files / 83 tests.
- `npm run lint --prefix server` -> pass.
- `npm run lint --prefix client` -> pass.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass.
