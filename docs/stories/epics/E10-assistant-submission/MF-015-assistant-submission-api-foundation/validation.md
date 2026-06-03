# Validation

## Proof Strategy

MF-015 is complete when service tests prove version/status/immutability rules,
route tests prove authorization and API shape, and the server typecheck/test
suite passes.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Submission create assigns next version, validates file URL/note/status, blocks non-submittable Task states. |
| Integration | Assistant creates and lists Task submissions; non-assigned users cannot create; series members/admin can read; old submissions have no mutation route. |
| E2E | Deferred until Assistant submission UI exists. |
| Platform | Server typecheck/build through root quick suite. |
| Performance | Not applicable for this compact CRUD slice. |
| Logs/Audit | Not applicable; no audit log model exists yet. |

## Fixtures

- In-memory Task and Submission repositories for service tests.
- Supertest route fixtures for Admin, Mangaka, Editor, assigned Assistant, and
  stranger users.

## Commands

```text
npm run typecheck --workspace server
npm run test --workspace server
.\scripts\bin\harness-cli.exe story verify MF-015
npm run test:quick
```

## Acceptance Evidence

Pending implementation and verification.
