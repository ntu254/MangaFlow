# Validation

## Proof Strategy

MF-HIOS-093 is done when `/app/admin/task-rates` is backed by real Admin TaskType data, default rates can be updated without TaskType lifecycle side effects, and backend tests prove task creation snapshots the TaskType base rate.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Task creation copies the current TaskType `baseRate` into the created Task payload. |
| Integration | Existing Admin TaskType route guard pattern is reused; no new route integration test is required. |
| E2E | Manual QA only. |
| Platform | Server/client lint and build through story verification script. |
| Performance | No new performance proof required. |
| Logs/Audit | No new audit persistence in scope. |

## Commands

```powershell
npm run lint --prefix server
npm run build --prefix server
npm run test --prefix server -- task
npm run lint --prefix client
npm run build --prefix client
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-093.ps1
scripts/bin/harness-cli.exe story verify MF-HIOS-093
```

## Manual QA

- Admin opens `/app/admin/task-rates` and sees backend-loaded TaskType rate references.
- Admin edits a default base rate.
- Admin sees zero-rate references as warnings, not hard validation failures.
- Admin confirms the page does not expose TaskType delete/deactivate lifecycle actions.

## Acceptance Evidence

- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-093.ps1` passed.
- Server lint and build passed.
- Server task/admin task-type test subset passed: 3 files, 19 tests.
- Client lint and build passed.
- Backend regression proves task creation snapshots current TaskType `baseRate`.
