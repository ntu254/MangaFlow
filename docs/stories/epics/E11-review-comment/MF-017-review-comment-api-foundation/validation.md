# Validation

## Proof Strategy

MF-017 is complete when backend unit tests cover Comment state transitions and validation rules, integration tests prove endpoint operations and series membership boundary enforcement, type checking passes, and the Harness CLI registers story verification.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Comment schema validation; `/mark-fixed`, `/verify-fixed`, `/resolve`, `/reopen` methods enforce starting states and role permissions. |
| Integration | - Create comment for valid target (manuscript, page, task, etc.).<br>- List comments by target (filtered and authorized).<br>- Restrict update/delete to creator/admin.<br>- Verify state transitions through endpoints under valid roles (Assistant, Mangaka, Editor).<br>- Block transitions from unauthorized roles. |
| E2E | Deferred until Comment Panel UI exists (MF-018). |
| Platform | Server typecheck and build through root quick suite. |

## Commands

```text
npm run typecheck --workspace server
npm run test --workspace server
.\scripts\bin\harness-cli.exe story verify MF-017
npm run test:quick
```

## Acceptance Evidence

Implemented and verified:

- `npm run typecheck --workspace server` passed.
- `npm run test --workspace server` passed: 24 files, 93 tests.
- `.\scripts\bin\harness-cli.exe story verify MF-017` passed.
- `npm run test:quick` passed: client/server typecheck, server tests 24 files/93 tests, client tests 8 files/28 tests, client/server build.
- `harness.db` updated to mark `MF-017` as `implemented`.

