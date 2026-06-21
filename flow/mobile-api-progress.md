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
- `GET /api/auth/me`
- `GET /api/dashboard/editor/summary`
- `GET /api/editor/manuscripts/review-queue`
- `GET /api/submissions/review-queue`
- `GET /api/tasks/:taskId`
- `GET /api/chapters/:chapterId`
- `GET /api/chapters/:chapterId/pages`
- `GET /api/series/:seriesId/summary`
- `GET /api/comments/task/:taskId`
- `GET /api/chapters/:chapterId/readiness`

### Board

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/board/summary`
- `GET /api/board/queue`
- `GET /api/series/:seriesId/summary`
- `GET /api/rankings`

## Mutation Endpoints Wired

### Editor

- `POST /api/auth/logout`
- `POST /api/editor/series/:seriesId/start-review`
- `POST /api/editor/series/:seriesId/request-revision`
- `POST /api/editor/series/:seriesId/reject`
- `POST /api/editor/series/:seriesId/forward-to-board`
- `POST /api/submissions/:submissionId/editor-approve`
- `POST /api/submissions/:submissionId/request-revision`
- `POST /api/comments`
- `POST /api/comments/:commentId/resolve`
- `POST /api/comments/:commentId/reopen`

### Board

- `POST /api/auth/logout`
- `POST /api/board/series/:seriesId/votes`
- `POST /api/board/series/:seriesId/decisions/finalize`
- `POST /api/board/series/:seriesId/decisions/tie-break`
- `POST /api/board/series/:seriesId/at-risk-decisions`

Mutation calls go to the live API directly and surface backend errors in the confirmation panel. They do not silently fall back to mock behavior.

## Mock Fallback Still Intentional

- Editor comments fall back to mock only when the live submission queue does not expose a task id or the comments API fails.
- Editor readiness falls back to mock only when the live submission queue does not expose a chapter id or the readiness API fails.
- Board decision history is derived from live review/ranking reads plus mock-safe display shape.
- Series proposal summary on mobile falls back to queue-card metadata if `/api/series/:seriesId/summary` fails.

## Mutation Endpoints Not Wired Yet

These remain outside the current mobile slice:

- legacy aliases such as `/api/board/series/:seriesId/finalize-decision`, `/api/board/series/:seriesId/tie-break`, and `/api/board/series/:seriesId/vote`
- manuscript-id legacy aliases under `/api/manuscripts/:manuscriptId/*`; mobile currently uses the live Editor series endpoints exposed by the backend.

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

Latest MF-HIOS-108 verification:

```bash
npm --prefix mobile run test
npm --prefix server run test -- src/modules/board/board.service.test.ts src/modules/manuscript/manuscript.service.test.ts src/modules/series/series.service.test.ts
npm --prefix mobile run lint
npm --prefix mobile run build
```

Notes:
- Mobile tests passed 23/23.
- Targeted server scope passed 27/27.
- Full `npm --prefix server run test` still has pre-existing failures in `accessPolicy.service.test.ts` and `submission.service.test.ts`; MF-HIOS-108 Board service test passed inside that run.

Latest MF-HIOS-109 polish:

```bash
npm --prefix mobile run test
npm --prefix mobile run lint
npm --prefix mobile run build
```

Notes:
- Editor Comments `Open blockers` now toggles a blocking-comments filter instead of acting as a placeholder.
- Editor Readiness `Open blockers` now toggles failed-check filtering.
- `Schedule publication mock` was replaced with a non-action boundary card; publication scheduling stays a follow-up workflow slice.
- Mobile shell/loading copy now describes live API + local reference fallback rather than mock-only flows.

For live API smoke:

```bash
npm --prefix server run seed:e2e-users
npm --prefix server run dev
npx tsx server/scripts/test-e2e.ts
```
