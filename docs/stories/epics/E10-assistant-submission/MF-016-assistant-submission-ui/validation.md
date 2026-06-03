# Validation

## Proof Strategy

MF-016 is complete when client tests prove Submission API calls, typecheck/build
prove route/component contracts, and the Harness story verifier passes.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Submission API client lists, creates, fetches, and surfaces errors. |
| Integration | Client typecheck/build covers Assistant route composition and Task/Page/Region/Submission API contracts. |
| E2E | Deferred until authenticated Google OAuth fixture or callable browser plugin exists. |
| Platform | Vite production build succeeds. |
| Performance | Not applicable for this compact UI slice. |
| Logs/Audit | Not applicable; no new server behavior. |

## Fixtures

- Mocked `fetch` responses for client API tests.
- Existing dev server/Google OAuth environment for manual rendered proof when
  available.

## Commands

```text
npm run typecheck --workspace client
npm run test --workspace client
npm run build --workspace client
.\scripts\bin\harness-cli.exe story verify MF-016
npm run test:quick
```

## Acceptance Evidence

Implemented and verified:

- `npm run typecheck --workspace client` passed.
- `npm run test --workspace client` passed: 8 files, 28 tests.
- `npm run build --workspace client` passed. Vite emitted the existing
  chunk-size warning.
- `.\scripts\bin\harness-cli.exe story verify MF-016` passed.
- `npm run test:quick` passed: client/server typecheck, server tests 22
  files/79 tests, client tests 8 files/28 tests, client/server build. Vite
  emitted the existing chunk-size warning.

Authenticated rendered E2E/screenshot proof remains deferred until Google OAuth
fixtures or a callable browser plugin are available.
