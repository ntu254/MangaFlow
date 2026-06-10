# Validation

## Proof Strategy

MF-HIOS-098 is done when `/app/admin/system-health` renders a real Admin page backed by existing health endpoints, without adding workflow actions or direct storage/AI access.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | TypeScript compile covers hook/page/API wiring. |
| Integration | Existing backend endpoints are reused; no new route integration test in this story. |
| E2E | Manual QA only. |
| Platform | Client/server lint and build through story verification script. |

## Commands

```powershell
npm run lint --prefix client
npm run build --prefix client
npm run lint --prefix server
npm run build --prefix server
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-098.ps1
```

## Manual QA

- Admin opens `/app/admin/system-health`.
- Page shows API, Database, Storage, and AI status cards.
- Refresh reloads backend-owned health data.
- Page does not fetch signed URLs or call the AI service directly.
- Page copy does not imply Admin can override Board or workflow decisions.

## Acceptance Evidence

- Story verification script passes.
- Client lint/build passes.
- Server lint/build passes.
