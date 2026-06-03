# Validation - MF-020 Editor Approval Workflow UI

## Proof Strategy

MF-020 is verified when:
1. Client unit/integration tests prove that the Editor Dashboard, Chapter Pages Page, and Page Workspace render the correct buttons, status indicators, and permissions.
2. TypeScript compilation passes on the client and server.
3. Tests run and pass successfully.
4. Harness CLI registers story verification for `MF-020`.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | - `EditorDashboardPage` lists series, pending manuscripts, and pending chapters.<br>- `ChapterPagesPage` hides upload/delete options for Editors and shows approve/revision controls.<br>- `PageWorkspacePage` shows page approval/revision buttons for Editors and hides edit tools. |
| Integration | - Endpoints mapping for page and chapter approvals works correctly.<br>- Backend series listing endpoint returns success for Editors/Assistants. |
| Platform | Client builds successfully, typecheck succeeds. |

## Commands

```text
npm run typecheck --workspace server
npm run typecheck --workspace client
npm run test --workspace server
npm run test --workspace client
npm run test:quick
.\scripts\bin\harness-cli.exe story verify MF-020
```

## Acceptance Evidence

All validation steps completed successfully:
1. **TypeScript Typecheck**:
   - `npm run typecheck --workspace server` passed successfully.
   - `npm run typecheck --workspace client` passed successfully.
2. **Automated Unit & Integration Tests**:
   - Backend tests: 100/100 tests passed (25 test files).
   - Frontend tests: 42/42 tests passed (12 test files), including new unit tests for:
     - `EditorDashboardPage.test.tsx` (verified series card rendering, pending manuscripts, and pending chapters list).
     - `ChapterPagesPage.test.tsx` (verified conditional rendering of Editor buttons and hiding of Mangaka upload/delete controls).
     - `PageWorkspacePage.test.tsx` (verified page approval/revision buttons and hiding of annotation tools/task assigners for Editors).
3. **Durable Harness Verification**:
   - Updated Harness database entry status of `MF-020` to `implemented`.
