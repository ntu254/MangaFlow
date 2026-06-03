# Execution Plan

## Step 1: Query Helpers & Comment Count in Repository/Service
- In `server/src/modules/comment/comment.repository.ts`, check if there's any utility to count unresolved comments, or directly query in the services/endpoints.
- Add `hasUnresolvedComments(pageId: string): Promise<boolean>` to `comment` service or use the Mongoose `CommentModel` query directly.

## Step 2: Page Module Updates
- Update `server/src/modules/page/page.service.ts` to implement:
  - `editorApprovePage(pageId: string, commentService: CommentService)`: checks for unresolved comments, transitions page status to `EDITOR_APPROVED`.
  - `requestPageRevision(pageId: string)`: transitions page status to `NEEDS_REVISION`.
- Update `server/src/modules/page/page.routes.ts` to add endpoints:
  - `POST /:pageId/editor-approve`
  - `POST /:pageId/request-revision`
  - Implement role verification checking if user is system `ADMIN` or system `EDITOR` + series `EDITOR`.

## Step 3: Chapter Module Updates
- Update `server/src/modules/chapter/chapter.service.ts` to implement:
  - `editorApproveChapter(chapterId: string, pageService: PageService, commentService: CommentService)`: checks pages inside the chapter, verifies unresolved comments, transitions status to `READY_FOR_PUBLICATION`.
  - `requestChapterRevision(chapterId: string)`: transitions chapter status to `IN_PROGRESS`.
- Update `server/src/modules/chapter/chapter.routes.ts` to add endpoints:
  - `POST /:chapterId/approve`
  - `POST /:chapterId/request-revision`
  - Implement role verification.

## Step 4: Manuscript Module Updates
- Update `server/src/modules/manuscript/manuscript.routes.ts` to add endpoints:
  - `POST /:manuscriptId/approve`
  - `POST /:manuscriptId/request-revision`
  - Ensure root-level endpoints `/api/manuscripts/:manuscriptId/approve` and `/api/manuscripts/:manuscriptId/request-revision` are mounted correctly.
  - Implement role verification.

## Step 5: Global Router Configuration
- Update `server/src/routes/index.ts` to mount root-level `/api/manuscripts` router if needed, or register root paths correctly.
