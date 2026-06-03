# Validation

## Proof Strategy

MF-026 is complete when payroll service tests cover calculation and transition
rules, route tests prove authorization and API behavior, server typecheck/test
suite passes, and Harness verification records the story proof.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Early/on-time/late calculations, rejected/unapproved task blocks, confirm/mark-paid transitions. |
| Integration | Admin task-rate CRUD, Assistant self earnings, Mangaka series payroll, calculate/confirm, Admin mark-paid. |
| E2E | Deferred until payroll UI exists. |
| Platform | Server typecheck/build through root quick suite. |
| Performance | Not applicable for this compact API slice. |
| Logs/Audit | Not applicable; no audit log model exists yet. |

## Fixtures

- In-memory Task, Series, TaskRate, and AssistantEarning repositories.
- Supertest users for Admin, Mangaka, Assistant, and stranger.

## Commands

```text
npm run typecheck --workspace server
npm run test --workspace server
.\scripts\bin\harness-cli.exe story verify MF-026
npm run test:quick
```

## Acceptance Evidence

All implementation phases of MF-026 (Payroll API Foundation) are complete.
Verification was completed successfully:

1. **TypeScript check**:
   ```bash
   npm run typecheck --workspace server
   ```
   Completed without errors.

2. **Automated Tests**:
   The payroll tests passed successfully under:
   - `server/src/modules/payroll/payroll.service.test.ts` (5/5 tests passed)
   - `server/src/modules/payroll/payroll.routes.test.ts` (4/4 tests passed)
   
   Running `npm run test --workspace server` output:
   ```text
   ✓ src/modules/payroll/payroll.service.test.ts (5 tests) 12ms
   ✓ src/modules/payroll/payroll.routes.test.ts (4 tests) 750ms
   ```

3. **Harness verification**:
   The story status has been updated to `implemented` and verified inside the Harness DB.
