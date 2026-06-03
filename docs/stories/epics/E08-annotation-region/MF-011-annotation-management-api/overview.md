# MF-011 Annotation Management API

## Current Behavior

MangaFlow now has Region backend APIs and a Page Workspace Region UI, but there
is no concrete Annotation backend module. The `server/src/modules/comment`
folder is still a placeholder and annotation/comment APIs from the product spec
are not implemented.

## Target Behavior

Authorized series members can list and fetch page Annotations. Mangaka
owners/co-mangakas, assigned Editors, and Admins can create rectangular page
Annotations. Creators, assigned Editors, and Admins can update or delete them.

Annotations use normalized rectangle coordinates and can carry an optional
review comment plus an `OPEN | RESOLVED` status.

## Affected Users

- Mangaka
- Editor
- Admin
- Assistant/read-only series members for list/detail access

## Affected Product Docs

- `docs/01_complete_spec.md`
- `docs/03_api_endpoints.md`
- `docs/06_mvp_task_breakdown.md`
- `docs/product/api-storage-data.md`
- `docs/product/roles-permissions.md`

## Non-Goals

- Frontend annotation UI.
- `/annotations/:annotationId/comment`.
- Full `/comments/*` lifecycle endpoints.
- Task/submission annotations.
- AI annotation generation.
