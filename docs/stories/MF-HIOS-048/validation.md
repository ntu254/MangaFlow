# Validation

## Proof Strategy

Prove Board at-risk decision creation and status transition, and prove non-AT_RISK Series are blocked.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | CANCEL creates decision and cancels Series; non-AT_RISK blocked. |
| Integration | Deferred; no live Mongo/auth fixture in CI. |
| E2E | Not configured. |
| Platform | Root build. |
| Logs/Audit | At-risk decision record + trace. |

## Commands

```text
npm run test --prefix server
npm run lint --prefix server
npm run lint --prefix client
npm run build
git diff --check
scripts\bin\harness-cli arch-check --story MF-HIOS-048
scripts\bin\harness-cli story verify MF-HIOS-048
```

## Acceptance Evidence

- `npm run test --prefix server` -> pass, 20 files / 90 tests.
- `npm run lint --prefix server` -> pass.
- `npm run lint --prefix client` -> pass.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass.
