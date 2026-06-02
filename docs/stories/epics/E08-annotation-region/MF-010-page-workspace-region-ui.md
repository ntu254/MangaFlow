# MF-010 Page Workspace Region UI

## Status

implemented

## Lane

normal

## Product Contract

Mangaka workspace users can open a page workspace from a chapter page card,
view the page image with existing rectangular Regions, create a normalized
rectangular Region from a drag selection, and delete Regions through the
MF-009 Region API.

## Relevant Product Docs

- `docs/product/ui-direction.md`
- `docs/product/workflow.md`
- `docs/product/api-storage-data.md`
- `docs/03_api_endpoints.md`
- `docs/06_mvp_task_breakdown.md`

## Acceptance Criteria

- Page cards route to a real workspace instead of the previous placeholder.
- Workspace loads Page metadata and Regions from the backend API.
- Users can drag on the page image to produce normalized rectangle coordinates.
- Users can choose a Region type and save/delete Regions.
- Region overlays remain positioned relative to the image when the viewport
  changes.

## Design Notes

- UI surface: `client/src/features/page/routes/PageWorkspacePage.tsx`
- API: `GET/POST /api/pages/:pageId/regions`,
  `GET/PATCH/DELETE /api/regions/:regionId`
- Region MVP shape: `RECTANGLE`
- Non-goals: annotation comments, task creation from Region, AI detect regions,
  authenticated browser E2E fixture.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Region workspace coordinate helper and API URL/body behavior. |
| Integration | Client route and typecheck prove workspace wiring compiles. |
| E2E | Deferred until an authenticated browser fixture exists. |
| Platform | Client build/test, root quick when feasible. |
| Release | Not required. |

## Harness Delta

- Durable story `MF-010` added.
- Intake #14 recorded.

## Evidence

2026-06-03:

- `npm run typecheck --workspace client` passed.
- `npm run test --workspace client` passed: 5 test files, 18 tests.
- `npm run build --workspace client` passed.
- `.\scripts\bin\harness-cli.exe story verify MF-010` passed.
- `npm run test:quick` passed: client/server typecheck, server tests
  16 files/57 tests, client tests 5 files/18 tests, client build, server build.
- Frontend dev server started and returned HTTP 200 at
  `http://127.0.0.1:5174/`.

Browser plugin was not available as a callable tool in this session, so
authenticated rendered E2E remains deferred until a Clerk-backed browser fixture
is available.
