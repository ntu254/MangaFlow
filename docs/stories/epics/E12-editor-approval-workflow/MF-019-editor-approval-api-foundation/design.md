# Design

## API Endpoints

### 1. Manuscripts
- `POST /api/manuscripts/:manuscriptId/approve`
  - Transitions manuscript status from `EDITOR_REVIEW` to `APPROVED`.
  - **Permissions**: User must be system `ADMIN`, or system `EDITOR` with series role `EDITOR` for the containing series.
- `POST /api/manuscripts/:manuscriptId/request-revision`
  - Transitions manuscript status from `EDITOR_REVIEW` to `REVISION_REQUESTED`.
  - **Permissions**: User must be system `ADMIN`, or system `EDITOR` with series role `EDITOR` for the containing series.

### 2. Pages
- `POST /api/pages/:pageId/editor-approve`
  - Transitions page status from `MANGAKA_APPROVED` to `EDITOR_APPROVED`.
  - **Validation**: Reject with `400 Bad Request` if there are any unresolved comments on the page (comments where `status !== "RESOLVED_BY_EDITOR"`).
  - **Permissions**: User must be system `ADMIN`, or system `EDITOR` with series role `EDITOR` for the containing series.
- `POST /api/pages/:pageId/request-revision`
  - Transitions page status to `NEEDS_REVISION`.
  - **Permissions**: User must be system `ADMIN`, or system `EDITOR` with series role `EDITOR` for the containing series.

### 3. Chapters
- `POST /api/chapters/:chapterId/approve`
  - Transitions chapter status from `EDITOR_REVIEW` to `READY_FOR_PUBLICATION`.
  - **Validation**: Reject with `400 Bad Request` if any page inside the chapter has unresolved comments (comments where `status !== "RESOLVED_BY_EDITOR"`).
  - **Permissions**: User must be system `ADMIN`, or system `EDITOR` with series role `EDITOR` for the containing series.
- `POST /api/chapters/:chapterId/request-revision`
  - Transitions chapter status from `EDITOR_REVIEW` to `IN_PROGRESS`.
  - **Permissions**: User must be system `ADMIN`, or system `EDITOR` with series role `EDITOR` for the containing series.

---

## Authorization & Business Rules

1. **System & Series Roles Enforcement**:
   - Only system `ADMIN` users or users with system `EDITOR` + series-level `EDITOR` membership role can call these approval or revision endpoints.
   - For any target object (Manuscript, Chapter, Page), the backend must resolve the containing `seriesId` to verify the series member role of the calling user.
2. **Unresolved Comment Validation**:
   - Comments block approval if they are associated with the target page (or pages within the chapter) and do not have the status `RESOLVED_BY_EDITOR`.
   - Comment lookup query:
     - For Pages: `{ $or: [{ pageId: pageId }, { targetType: "PAGE", targetId: pageId }], status: { $ne: "RESOLVED_BY_EDITOR" } }`.
     - For Chapters: Find all pages in the chapter, then find unresolved comments for all those pages.
