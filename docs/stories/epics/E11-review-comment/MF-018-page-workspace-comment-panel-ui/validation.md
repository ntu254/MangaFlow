# Validation

## Proof Strategy

MF-018 is complete when client unit tests prove correct API mapping and conditional role button rendering, type checking passes on the client, the client builds successfully, and the Harness CLI registers story verification.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | - Comment list displays comments, authors, dates correctly.<br>- Buttons (`Mark Fixed`, `Verify Fixed`, `Resolve`, `Reopen`) render conditionally according to comment status and mock user roles. |
| Integration | - Client router compiles workspace successfully with Comment panel mounted.<br>- API mock hooks fetch and submit comments correctly. |
| E2E | Deferred. |
| Platform | Client build, root quick test suite check. |

## Commands

```text
npm run typecheck --workspace client
npm run test --workspace client
.\scripts\bin\harness-cli.exe story verify MF-018
npm run test:quick
```

## Acceptance Evidence

This section will be updated with logs once the implementation is complete and verified.
