# Validation

## Proof Strategy

MF-014 is complete when the client can call the MF-013 Task API, the Page
Workspace can create a region Task and render it locally, and the Assistant
dashboard can list and start assigned Tasks.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Task API client builds correct requests and surfaces API errors. |
| Integration | Client build validates route and component type contracts. |
| E2E | Deferred until authenticated Google OAuth fixtures or callable browser plugin exist. |
| Platform | Vite production build succeeds. |
| Performance | Not applicable for this compact UI slice. |
| Logs/Audit | Not applicable; no new server behavior. |

## Fixtures

- Mocked `fetch` responses for client API tests.
- Existing Google OAuth-authenticated dev server for manual/browser proof when
  available.

## Commands

```text
npm run typecheck --workspace client
npm run test --workspace client
npm run build --workspace client
.\scripts\bin\harness-cli.exe story verify MF-014
npm run test:quick
```

## Acceptance Evidence

Implemented and verified:

- `npm run typecheck --workspace client` passed.
- `npm run test --workspace client` passed: 7 files, 24 tests.
- `npm run build --workspace client` passed. Vite emitted the existing bundle
  size warning for a chunk over 500 kB.
- `.\scripts\bin\harness-cli.exe story verify MF-014` passed.
- `npm run test:quick` passed: server tests 20 files/73 tests, client tests
  7 files/24 tests, client/server typecheck, client/server build.

Rendered authenticated E2E/screenshot proof remains deferred until Google OAuth
fixtures or a callable browser plugin are available. An unauthenticated
Playwright screenshot smoke was attempted against
`http://127.0.0.1:5174/app/assistant/dashboard`, but the local Playwright
browser binary was not installed.
