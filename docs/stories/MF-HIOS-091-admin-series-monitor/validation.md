# Validation

## Proof Strategy

MF-HIOS-091 is done when Admin can view a read-only Series monitor, existing backend access tests prove Admin list behavior, and no Admin workflow override action is introduced.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Admin Series list uses unrestricted monitor filter; Mangaka remains owner-scoped; Assistant remains blocked. |
| Integration | No new integration test in this story. |
| E2E | Manual QA only. |
| Platform | Server/client build and verification script. |
| Performance | No new performance proof required. |
| Logs/Audit | No new audit persistence in scope. |

## Fixtures

- Existing mocked Series repository tests.

## Commands

```powershell
npm run lint --prefix server
npm run build --prefix server
npm run test --prefix server -- series
npm run lint --prefix client
npm run build --prefix client
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-091.ps1
scripts/bin/harness-cli.exe story verify MF-HIOS-091
```

## Manual QA

- Admin opens `/app/admin/series`.
- Admin sees backend-loaded Series records.
- Page does not expose create, submit, approve, reject, publish, or Board decision controls.

## Acceptance Evidence

- `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-091.ps1` passed.
- Server lint and build passed.
- Server series test subset passed: 2 files, 13 tests.
- Client lint and build passed.
