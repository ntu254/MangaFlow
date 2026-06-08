# Validation

## Proof Strategy

Unit tests prove service authorization logic. Integration tests prove route middleware composition. Manual QA proves frontend states render correctly.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | ✅ Mangaka lists only owned Series<br>✅ Board lists Board-visible statuses<br>✅ Assistant list blocked with 403<br>✅ Non-owner Mangaka detail blocked<br>✅ Board can view Board-stage Series<br>✅ Admin/Editor can view all Series |
| Integration | ⏳ `GET /api/series` returns 200 for Mangaka with owned list<br>⏳ `GET /api/series` returns 403 for Assistant<br>⏳ `GET /api/series/:seriesId` returns 200 for owner<br>⏳ `GET /api/series/:seriesId` returns 403 for non-owner Mangaka |
| E2E | ⚠️ Out of scope (no E2E infrastructure exists) |
| Platform | N/A |
| Performance | N/A |
| Logs/Audit | N/A (no audit logging for read-only Series access in MVP) |

## Fixtures

- `user-mangaka-1` owns `series-1` (status: DRAFT).
- `user-mangaka-2` owns `series-2` (status: EDITOR_REVIEW).
- `series-3` (status: BOARD_REVIEW, owner: user-mangaka-1).
- `user-board-1` (role: BOARD).
- `user-assistant-1` (role: ASSISTANT).

## Commands

```bash
npm run test --prefix server
npm run build
```

## Acceptance Evidence

- `npm run test --prefix server`: 9 files passed, 41 tests passed.
- `npm run build`: server TypeScript build passed; client TypeScript + Vite build passed.
