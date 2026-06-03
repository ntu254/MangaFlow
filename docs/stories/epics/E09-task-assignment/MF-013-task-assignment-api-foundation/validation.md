# Validation

## Proof Strategy

MF-013 is done when Task domain validation and route authorization are proven
without relying on live Google OAuth/Mongo fixtures.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Task service validates required fields, task type/priority/status, money/date values, start transition, update metadata, deletion status gate, and not-found behavior. |
| Integration | Task routes allow creator roles to create Tasks, assigned Assistants to list/detail/start, reject non-members, reject wrong assignee roles, and create Tasks from Regions. |
| E2E | Deferred until frontend task assignment UI exists. |
| Platform | Server typecheck/test and root quick validation. |
| Performance | Not required for this slice. |
| Logs/Audit | Deferred until task history/audit module exists. |

## Fixtures

- In-memory user repository with Admin, Mangaka, Editor, Assistant.
- In-memory Page, Chapter, Region, and Task repositories.

## Commands

```powershell
npm run typecheck --workspace server
npm run test --workspace server
.\scripts\bin\harness-cli.exe story verify MF-013
npm run test:quick
```

## Acceptance Evidence

2026-06-03:

- `npm run typecheck --workspace server` passed.
- `npm run test --workspace server` passed: 20 test files, 73 tests.
- `.\scripts\bin\harness-cli.exe story verify MF-013` passed.
- `npm run test:quick` passed: client/server typecheck, server tests
  20 files/73 tests, client tests 6 files/21 tests, client build, server build.

Implemented proof files:

- `server/src/modules/task/task.service.test.ts`
- `server/src/modules/task/task.routes.test.ts`

Coverage notes:

- Unit proof covers required fields, task type/priority/status validation,
  non-negative money values, due date parsing, `TODO -> IN_PROGRESS`, deletion
  status gates, metadata updates, and not-found behavior.
- Route proof covers owner Mangaka create/list/detail/update/delete, assigned
  Assistant list/detail/start, assigned Editor create-from-region, `BUBBLE`
  Region defaulting to `OTHER` Task type, non-member rejection, and invalid
  assignee rejection.
- E2E remains deferred because task assignment UI is not part of MF-013.
