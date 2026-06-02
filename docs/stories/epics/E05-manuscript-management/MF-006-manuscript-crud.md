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
- Mocking file uploads via text inputs until EPIC-07 (R2).
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

## Review Notes
Typecheck passes. Verified all roles and frontend rendering.
