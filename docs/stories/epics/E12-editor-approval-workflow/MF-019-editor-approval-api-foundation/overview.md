# MF-019 Editor Approval API Foundation

## Current Behavior

The backend supports basic manuscript submission and review workflows via series-scoped endpoints. However, there are no dedicated endpoints at the root level for Editor approval of manuscripts, chapters, and pages. Furthermore, there is no validation to block approval when unresolved comments exist on pages or chapters.

## Target Behavior

Implement the Editor review and approval REST API foundation:
1. **Manuscripts**:
   - `POST /api/manuscripts/:manuscriptId/approve` -> Transitions status to `APPROVED`.
   - `POST /api/manuscripts/:manuscriptId/request-revision` -> Transitions status to `REVISION_REQUESTED`.
2. **Pages**:
   - `POST /api/pages/:pageId/editor-approve` -> Transitions status to `EDITOR_APPROVED`.
     - *Validation*: Reject with `400 Bad Request` if there are any unresolved comments on the page (comments where `status !== "RESOLVED_BY_EDITOR"`).
   - `POST /api/pages/:pageId/request-revision` -> Transitions status to `NEEDS_REVISION`.
3. **Chapters**:
   - `POST /api/chapters/:chapterId/approve` -> Transitions status to `EDITOR_APPROVED` or `READY_TO_PUBLISH`.
     - *Validation*: Reject with `400 Bad Request` if any page inside the chapter has unresolved comments.
   - `POST /api/chapters/:chapterId/request-revision` -> Transitions status to `NEEDS_REVISION` or `REVISION_REQUESTED`.

Endpoints must enforce proper permissions (Editor of the series or Admin system role).

## Affected Users

- Editor
- Admin
- Mangaka (receives revision requests)

## Non-Goals

- Frontend UI screens or dashboard (covered in MF-020).
- Automatic notification emails.
