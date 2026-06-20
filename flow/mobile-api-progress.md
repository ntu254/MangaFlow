# Mobile API Wiring Progress

## Current Branch

`codex/mobile-api-wiring-progress`

## Goal

Replace the mobile mock data-source boundary with live API reads for the approved mobile roles:

- Tantou Editor
- Board / Board Chair

Mobile still must not own backend permissions, workflow transitions, readiness calculation, ranking formula, payroll, or signed URL access.

## Implemented

- Added `apiMobileWorkflowDataSource` in `mobile/src/services/mobile-workflow-data-source.ts`.
- Added `mobileWorkflowDataSource`, a live-API data source with mock fallback.
- Updated Editor and Board hooks to use `mobileWorkflowDataSource` by default.
- Live API login uses development e2e users:
  - `editor@mangaflow.local`
  - `board@mangaflow.local`
- Live API base URL uses `EXPO_PUBLIC_API_BASE_URL`, falling back to `http://localhost:3001/api`.

## Read Endpoints Wired

### Editor

- `POST /api/auth/login`
- `GET /api/dashboard/editor/summary`
- `GET /api/editor/manuscripts/review-queue`
- `GET /api/submissions/review-queue`

### Board

- `POST /api/auth/login`
- `GET /api/dashboard/board/summary`
- `GET /api/board/queue`
- `GET /api/rankings`

## Mock Fallback Still Intentional

- Editor comments stay mock/empty until a selected task id is exposed from live submission rows.
- Editor readiness stays mock until mobile has a selected live chapter id.
- Board decision history is derived from live review/ranking reads plus mock-safe display shape.

## Mutation Endpoints Not Wired Yet

These remain confirmation-only UI actions because workflow transitions are backend-owned and should be handled in a separate high-risk story:

- `POST /api/manuscripts/:manuscriptId/forward-to-board`
- `POST /api/manuscripts/:manuscriptId/request-revision`
- `POST /api/manuscripts/:manuscriptId/reject`
- `POST /api/submissions/:submissionId/editor-approve`
- `POST /api/submissions/:submissionId/request-revision`
- `POST /api/board/series/:seriesId/votes`
- `POST /api/board/series/:seriesId/finalize-decision`
- `POST /api/board/series/:seriesId/tie-break`
- `POST /api/board/series/:seriesId/at-risk-decisions`

## Verification Notes

### API Smoke Result

Last checked against `http://localhost:3001/api`:

| Endpoint | Result | Notes |
| --- | --- | --- |
| `POST /api/auth/login` as Editor | Passed | `editor@mangaflow.local` |
| `POST /api/auth/login` as Board | Passed | `board@mangaflow.local` |
| `GET /api/dashboard/editor/summary` | Passed | Returned summary object |
| `GET /api/editor/manuscripts/review-queue` | Passed | Returned 3 items |
| `GET /api/submissions/review-queue` | Passed | Returned 0 items in current DB state |
| `GET /api/dashboard/board/summary` | Passed | Returned summary object |
| `GET /api/board/queue` | Passed | Returned 2 items |
| `GET /api/rankings` | Passed | Returned 1 item |

Command used:

```bash
node -e "<inline fetch smoke for Editor and Board mobile endpoints>"
```

Run after changes:

```bash
npm --prefix mobile run lint
npm --prefix mobile run test
npm --prefix mobile run build
```

For live API smoke:

```bash
npm --prefix server run seed:e2e-users
npm --prefix server run dev
npx tsx server/scripts/test-e2e.ts
```
