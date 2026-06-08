# Validation

## Proof Strategy

Prove publication create/schedule/publish service behavior and readiness gating, then rerun full repo validation.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Create publication, schedule publication, block publish when readiness fails, publish when readiness passes. |
| Integration | Deferred; no live Mongo/auth fixture in CI. |
| E2E | Not configured. |
| Platform | Root build. |
| Performance | N/A for MVP. |
| Logs/Audit | Trace + decision record. |

## Fixtures

Repository and readiness service mocks.

## Commands

```text
npm run test --prefix server
npm run lint --prefix server
npm run lint --prefix client
npm run build
git diff --check
scripts\bin\harness-cli arch-check --story MF-HIOS-047
scripts\bin\harness-cli story verify MF-HIOS-047
```

## Acceptance Evidence

- `npm run test --prefix server` -> pass, 20 files / 88 tests.
- `npm run lint --prefix server` -> pass.
- `npm run lint --prefix client` -> pass.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass.
