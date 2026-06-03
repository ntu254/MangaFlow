# Execution Plan - MF-020 Editor Approval Workflow UI

## Step 1: Update Backend Series Endpoint System-Role Constraints
- Modify system role checks on `GET /api/series` and `GET /api/series/:seriesId` in `series.routes.ts` to allow Editors and Assistants.

## Step 2: Add Approval Frontend APIs
- Implement `editorApprovePage` and `requestPageRevision` in `client/src/features/page/api/page.ts`.
- Implement `approveChapter` and `requestChapterRevision` in `client/src/features/chapter/api/chapter.ts`.

## Step 3: Implement Editor Dashboard
- Create `EditorDashboardPage.tsx` under `client/src/features/dashboard/routes/`.
- Fetch assigned series, manuscripts, and chapters.
- List pending items with appropriate review and details links.

## Step 4: Adapt Router Configuration
- Update `client/src/App.tsx` to register dashboard and page workspace paths for Editors.
- Add redirect for Editors to point to the new Editor Dashboard.

## Step 5: Extend Chapter Pages and Workspace Views
- Update `ChapterPagesPage.tsx` to handle `/app/editor` path, display chapter approval/revision controls, and hide mangaka uploads.
- Update `PageWorkspacePage.tsx` to handle page approvals and dynamically route navigation back links.

## Step 6: Test & Verify
- Implement frontend test suites for dashboard, chapter pages, and workspace pages.
- Verify typescript compilation and test passes.
