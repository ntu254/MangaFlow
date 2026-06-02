# MF-004 Series Management

## Status

implemented

## Lane

normal

## Product Contract

Mangakas need a way to create and manage Manga Series.
This story implements the foundational Series and SeriesMember data models, as well as the CRUD API and frontend UI for Series Management. It ensures that a Series is atomically created alongside a SeriesMember entry granting the creator `OWNER_MANGAKA` role.

## Relevant Product Docs

- `docs/02_database_schema.md`
- `docs/06_mvp_task_breakdown.md`

## Acceptance Criteria

- Series model is defined with correct schema.
- SeriesMember model is defined to track RBAC per series.
- Transactional creation of Series and SeriesMember.
- API endpoints for CRUD series operations.
- Frontend UI allows creating a new series and viewing the list of owned series.
- Typechecking passes seamlessly.

## Design Notes

- Commands: `npm run typecheck`
- Queries: Fetch series for authenticated user via API.
- API: `POST /api/series`, `GET /api/series`, `GET /api/series/:seriesId`
- Tables: MongoDB collections `series`, `seriesmembers`
- Domain rules: Slugs are auto-generated from titles, must be unique. Only owners can delete a series in DRAFT state.
- UI surfaces: `SeriesListPage`, `CreateSeriesPage`, `SeriesDetailPage`

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Series service validates title input, slug generation, owner-only deletion, and draft-only deletion. |
| Integration | Series API route tests cover Mangaka create/list, RBAC rejection, owner update/delete, and non-member detail access denial. |
| E2E | Not yet implemented |
| Platform | Typecheck/test/build commands run locally. |
| Release | Not yet implemented |

## Harness Delta

- Added React Router context to `App.tsx` and `main.tsx` for proper frontend routing.
- Recorded Intake #7 and Trace #11.

## Evidence

- `npm run typecheck --workspace server` passes.
- `npm run test --workspace server` passes: 8 server source test files, 27 tests.
- Added `server/src/modules/series/series.service.test.ts`.
- Added `server/src/modules/series/series.routes.test.ts`.
- Browser E2E remains deferred until reusable Clerk/Mongo demo fixtures exist.
