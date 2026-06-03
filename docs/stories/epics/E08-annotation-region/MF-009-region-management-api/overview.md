# MF-009 Region Management API

## Current Behavior

MangaFlow has Chapter and Page CRUD plus page upload, but there is no concrete
Region module yet. The `server/src/modules/region` folder only contains a
placeholder `index.ts`, and the page workspace currently points to a future
annotation editor.

## Target Behavior

Backend users with the right system role and series membership can create,
list, update, fetch, and delete normalized rectangular Regions for a Page.
Regions are scoped through Page -> Chapter -> Series and stored as MongoDB
records with source/type/shape metadata.

## Affected Users

- Mangaka
- Editor
- Admin
- Assistant/read-only series members for list/detail access

## Affected Product Docs

- `docs/01_complete_spec.md`
- `docs/03_api_endpoints.md`
- `docs/06_mvp_task_breakdown.md`
- `docs/product/workflow.md`
- `docs/product/api-storage-data.md`

## Non-Goals

- Frontend canvas/workspace UI.
- Annotation/comment APIs.
- Task creation from Region.
- AI region detection.
- Browser E2E proof.

