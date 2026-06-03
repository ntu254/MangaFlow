# Story Packet: [MF-006] Manuscript Management CRUD

## Metadata
- Story ID: MF-006
- Intake ID: 9
- Epic: EPIC-05
- Type: Feature
- Lane: normal
- Required Tier: standard
- Status: VERIFIED

## Context
Provide Mangaka with the ability to upload and submit manuscripts, and Editor to review and approve/reject them.

## Requirements
- Manuscript Model (seriesId, uploadedBy, status, currentVersion, fileUrls)
- Backend endpoints for upload, submit, review
- Frontend UI with Manuscript Tab on Series Detail Page
- Upload Manuscript Dialog (mock text inputs for URLs)
- Editor Review Page UI

## Architecture Decisions
- Multipart upload is now backed by the EPIC-07 storage/FileAsset foundation.
- Utilizing Tabs component from shadcn for Series page organization.
- Reusing RBAC middlewares (`requireSeriesRole`) to guard editor/mangaka actions.

## Execution Plan
1. Create Manuscript Data Model and Repository.
2. Implement Business Logic in Service.
3. Hook up routes to express router.
4. Implement Frontend API hooks.
5. Create Upload Dialog and update Series Detail Page.
6. Create Editor Review Page and configure App.tsx.

## Test Cases
- [x] Mangaka can create a draft manuscript.
- [x] Mangaka can submit manuscript.
- [x] Editor can start review and approve/request revision.
- [x] Unauthenticated users or wrong roles get 403 Forbidden.
- [x] Manuscript routes require both system role and series membership.
- [x] Manuscript submit/review actions reject manuscript IDs outside the route series.

## Review Notes
Backend typecheck and tests pass. Frontend rendering remains covered by build/typecheck, with browser E2E deferred until reusable Google OAuth/Mongo fixtures exist.

## Validation Evidence

- `npm run typecheck --workspace server` passes.
- `npm run test --workspace server` passes: 10 server source test files, 34 tests.
- Added `server/src/modules/manuscript/manuscript.service.test.ts`.
- Added `server/src/modules/manuscript/manuscript.routes.test.ts`.
- Fixed `server/src/modules/manuscript/manuscript.routes.ts` so list/detail routes load `localUser` before `requireSeriesRole`.
- Fixed submit/review/detail routes to verify the manuscript belongs to the route `seriesId` before returning or mutating it.
