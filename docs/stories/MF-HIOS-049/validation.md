# Validation

## Proof Strategy

Prove the route fix compiles, backend tests still pass, client TypeScript passes, and full build passes.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Existing Board service tests still pass after route/controller wiring. |
| Integration | Deferred; no live HTTP auth fixture in CI. |
| E2E | Not configured. |
| Platform | Root build. |
| UI Review | Shared components, clear confirmation copy, API-backed status text. |

## Commands

```text
npm run test --prefix server
npm run lint --prefix server
npm run lint --prefix client
npm run build
git diff --check
scripts\bin\harness-cli arch-check --story MF-HIOS-049
scripts\bin\harness-cli story verify MF-HIOS-049
```

## Acceptance Evidence

- `npm run test --prefix server` -> pass, 20 files / 90 tests.
- `npm run lint --prefix server` -> pass.
- `npm run lint --prefix client` -> pass.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass.
