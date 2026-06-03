# Validation

## Proof Strategy

MF-011 is done when Annotation domain validation and route authorization are
proven without relying on live Clerk/Mongo fixtures.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Annotation service validates normalized coordinates, page target rules, status/type values, update merge behavior, and not-found behavior. |
| Integration | Annotation routes allow authorized creators/editors/admins, allow read for series members, reject unauthorized mutation, and resolve Page -> Chapter -> Series scope. |
| E2E | Deferred until frontend annotation UI exists. |
| Platform | Server typecheck/test and root quick validation. |
| Performance | Not required for this slice. |
| Logs/Audit | Deferred until audit module exists. |

## Fixtures

- In-memory user repository with Admin, Mangaka, Editor, Assistant.
- In-memory Page, Chapter, Region, and Annotation repositories.

## Commands

```powershell
npm run typecheck --workspace server
npm run test --workspace server
.\scripts\bin\harness-cli.exe story verify MF-011
npm run test:quick
```

## Acceptance Evidence

2026-06-03:

- `npm run typecheck --workspace server` passed.
- `npm run test --workspace server` passed: 18 test files, 65 tests.
- `.\scripts\bin\harness-cli.exe story verify MF-011` passed.
- `npm run test:quick` passed: client/server typecheck, server tests
  18 files/65 tests, client tests 5 files/18 tests, client build, server build.

Implemented proof files:

- `server/src/modules/annotation/annotation.service.test.ts`
- `server/src/modules/annotation/annotation.routes.test.ts`

Coverage notes:

- Unit proof covers Annotation defaults, page target validation, status/type
  validation, normalized rectangle bounds, update merge validation, deletion,
  and not-found behavior.
- Route proof covers Page -> Chapter -> Series scope resolution, owner create
  and creator mutation, editor mutation, assistant read-only access,
  non-member rejection, and region/page mismatch rejection.
- E2E remains deferred because frontend annotation UI is not part of MF-011.
