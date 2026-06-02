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
- Mock page uploads using image URLs
- Ability to delete pages and chapters (in DRAFT status)

## Architecture Decisions
- Mocking file uploads via text inputs until EPIC-07 (R2).
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
- [x] Mangaka can upload pages with URLs into a chapter.
- [x] Mangaka cannot upload duplicate page numbers in the same chapter.
- [x] Mangaka can delete pages and chapters.
- [x] Unauthenticated users or wrong roles get 403 Forbidden.

## Review Notes
Typecheck passes. Verified all roles and frontend rendering.
