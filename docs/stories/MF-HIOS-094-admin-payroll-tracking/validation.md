# Validation

## Proof Strategy

MF-HIOS-094 is done when `/app/admin/payroll` is backed by real payroll earnings data, Admin actions use existing backend endpoints, and backend tests prove Admin list scope without changing formula behavior.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Admin list payroll earnings calls repository with unrestricted query; existing payroll formula/action tests remain green. |
| Integration | Existing route middleware is reused; no new route integration test in this story. |
| E2E | Manual QA only. |
| Platform | Server/client lint and build through story verification script. |
| Performance | No new performance proof required. |
| Logs/Audit | No new audit persistence in scope. |

## Commands

```powershell
npm run lint --prefix server
npm run build --prefix server
npm run test --prefix server -- payroll
npm run lint --prefix client
npm run build --prefix client
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-094.ps1
scripts/bin/harness-cli.exe story verify MF-HIOS-094
```

## Manual QA

- Admin opens `/app/admin/payroll` and sees backend-loaded earnings.
- Admin confirms a pending earning only after the browser confirmation prompt.
- Admin marks a confirmed earning paid only after the browser confirmation prompt.
- Admin cannot use this page to calculate/recalculate payroll or add revision fees.

## Acceptance Evidence

- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-094.ps1` passed.
- Server lint and build passed.
- Server payroll test subset passed: 2 files, 10 tests.
- Client lint and build passed.
- Backend regression proves Admin list payroll scope uses all earnings.
