# Story Packet: [MF-007] Chapter & Page Management CRUD

## Metadata
- Story ID: MF-007
- Intake ID: 10
- Epic: EPIC-06
- Type: Feature
- Lane: normal
- Required Tier: standard
- Status: VERIFIED

## Context
Provide Mangakas with the ability to manage Chapters and Pages within their Series, laying the groundwork for Region Annotation and Task Assignment.

## Requirements
- Chapter Model (seriesId, title, chapterNumber, status, deadline)
- Page Model (chapterId, pageNumber, originalFileUrl, width, height, status)
- Backend endpoints for Chapter and Page CRUD operations
- Frontend UI: Chapters tab on Series Detail page with Create Chapter dialog
- ChapterPagesPage showing page list in a thumbnail grid
- Multipart page uploads backed by EPIC-07 storage/FileAsset foundation
- Ability to delete pages and chapters (in DRAFT status)

## Architecture Decisions
- Multipart page upload is now backed by EPIC-07 storage and image resize.
- Utilizing compound unique indexes (`seriesId` + `chapterNumber`, `chapterId` + `pageNumber`) to prevent order duplicates.
- Reusing auth and RBAC middlewares (`requireAuth`, `requireSystemRole`, `requireSeriesRole`) to guard mangaka actions.

## Execution Plan
1. Create Chapter and Page data models and repositories.
2. Implement Chapter and Page validation services.
3. Wire routers and register them in server index routes.
4. Implement frontend API clients.
5. Create CreateChapterDialog and update SeriesDetailPage to display chapters list.
6. Create ChapterPagesPage grid with mock upload dialog.
7. Configure routes in App.tsx.

## Test Cases
- [x] Mangaka can create chapters in a series.
- [x] Mangaka cannot create duplicate chapter numbers in the same series.
- [x] Mangaka can upload page image files into a chapter.
- [x] Mangaka cannot upload duplicate page numbers in the same chapter.
- [x] Mangaka can delete pages and chapters.
- [x] Unauthenticated users or wrong roles get 403 Forbidden.
- [x] Chapter list routes load `localUser` before series-role checks.
- [x] Page detail/list/delete routes enforce series membership.

## Review Notes
Backend typecheck and tests pass. Frontend rendering remains covered by build/typecheck, with browser E2E deferred until reusable Google OAuth/Mongo fixtures exist.

## Validation Evidence

- `npm run typecheck --workspace server` passes.
- `npm run test --workspace server` passes: 13 server source test files, 45 tests.
- Added `server/src/modules/chapter/chapter.service.test.ts`.
- Added `server/src/modules/chapter/chapter.routes.test.ts`.
- Added `server/src/modules/page/page.service.test.ts`.
- Expanded `server/src/modules/page/page.routes.test.ts`.
- Fixed `server/src/modules/chapter/chapter.routes.ts` so chapter list routes load `localUser` before `requireSeriesRole`.
