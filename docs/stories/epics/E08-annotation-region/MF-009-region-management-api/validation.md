# Validation

## Proof Strategy

MF-009 is done when Region domain validation and route authorization are proven
without relying on live Google OAuth/Mongo/R2 fixtures.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Region service validates normalized coordinates, required Page id, source/type defaults, invalid updates, not found behavior. |
| Integration | Region routes allow authorized owners/editors/admins and reject non-members/wrong roles while resolving Page -> Chapter -> Series scope. |
| E2E | Deferred until Page Workspace UI exists. |
| Platform | Local server typecheck/test and root quick validation. |
| Performance | Not required for this slice. |
| Logs/Audit | Deferred until audit module exists. |

## Fixtures

- In-memory user repository with Admin, Mangaka, Editor, Assistant.
- In-memory Page and Chapter repositories.
- In-memory Region repository.

## Commands

```powershell
npm run typecheck --workspace server
npm run test --workspace server
.\scripts\bin\harness-cli.exe story verify MF-009
npm run test:quick
```

## Acceptance Evidence

2026-06-03:

- `npm run typecheck --workspace server` passed.
- `npm run test --workspace server` passed: 16 test files, 57 tests.
- `.\scripts\bin\harness-cli.exe story verify MF-009` passed.
- `npm run test:quick` passed: client/server typecheck, server tests
  16 files/57 tests, client tests 3 files/12 tests, client build, server build.

Implemented proof files:

- `server/src/modules/region/region.service.test.ts`
- `server/src/modules/region/region.routes.test.ts`

Coverage notes:

- Unit proof covers Region defaults, enum validation, normalized rectangle
  bounds, update merge validation, deletion, and not-found behavior.
- Route proof covers Page -> Chapter -> Series scope resolution, owner/editor
  write access, assistant read-only access, non-member rejection, and invalid
  coordinate rejection.
- E2E remains deferred because Page Workspace/canvas UI is not part of MF-009.
