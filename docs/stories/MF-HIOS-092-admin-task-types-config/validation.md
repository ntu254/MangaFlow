# Validation

## Proof Strategy

MF-HIOS-092 is done when Admin TaskType behavior is backend-enforced, used TaskType records are not hard-deleted, `/app/admin/task-types` is wired to real API data, and validation commands pass.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Admin TaskType service creates unique records, updates editable fields, toggles active state, deletes unused records, deactivates used records instead of hard-deleting. |
| Integration | Route protection is covered by existing Admin route guard pattern; no new DB integration test in this story. |
| E2E | Manual QA only. |
| Platform | Server/client build and verification script. |
| Performance | No new performance proof required. |
| Logs/Audit | No new audit persistence in scope. |

## Fixtures

- Active Admin user from existing auth fixtures.
- TaskType test records mocked through repository functions.

## Commands

```powershell
npm run lint --prefix server
npm run build --prefix server
npm run test --prefix server -- admin task
npm run lint --prefix client
npm run build --prefix client
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-092.ps1
scripts/bin/harness-cli.exe story verify MF-HIOS-092
```

## Manual QA

- Admin opens `/app/admin/task-types` and sees backend-loaded task types.
- Admin creates a TaskType with a non-negative base rate.
- Admin edits description and base rate.
- Admin deactivates and reactivates a TaskType.
- Admin deletes an unused TaskType.
- Admin attempts to delete a used TaskType and backend deactivates instead of hard-deleting.

## Acceptance Evidence

- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-092.ps1` passed.
- Server lint and build passed.
- Server admin/task test subset passed: 5 files, 26 tests.
- Client lint and build passed.
