# Validation

## Proof Strategy

MF-013 is done when Task domain validation and route authorization are proven
without relying on live Clerk/Mongo fixtures.

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

Add command results after implementation.
