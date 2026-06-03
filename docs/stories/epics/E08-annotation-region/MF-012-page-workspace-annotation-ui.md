# MF-012 Page Workspace Annotation UI

## Status

implemented

## Lane

normal

## Product Contract

Mangaka workspace users can load, create, select, resolve, and delete
page-scoped rectangular Annotations in the Page Workspace using the MF-011
Annotation API.

## Relevant Product Docs

- `docs/product/ui-direction.md`
- `docs/product/workflow.md`
- `docs/product/api-storage-data.md`
- `docs/03_api_endpoints.md`
- `docs/06_mvp_task_breakdown.md`

## Acceptance Criteria

- Page Workspace loads Annotations alongside Regions.
- Users can switch between Region and Annotation creation modes.
- Users can drag a normalized rectangle and save it as an Annotation with a
  comment.
- Annotation overlays remain positioned relative to the page image.
- Users can mark annotations resolved/open and delete annotations from the
  workspace panel.

## Design Notes

- UI surface: `client/src/features/page/routes/PageWorkspacePage.tsx`
- API: `GET/POST /api/pages/:pageId/annotations`,
  `PATCH/DELETE /api/annotations/:annotationId`
- Region and Annotation overlays share normalized coordinate helpers.
- Non-goals: full comment lifecycle, browser E2E, task/submission annotation
  targets.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Annotation API URL/body behavior and workspace helper reuse. |
| Integration | Client route and typecheck prove workspace wiring compiles. |
| E2E | Deferred until authenticated browser fixture exists. |
| Platform | Client build/test, root quick when feasible. |
| Release | Not required. |

## Harness Delta

- Durable story `MF-012` added.
- Intake #16 recorded.

## Evidence

2026-06-03:

- `npm run typecheck --workspace client` passed.
- `npm run test --workspace client` passed: 6 test files, 21 tests.
- `npm run build --workspace client` passed.
- `.\scripts\bin\harness-cli.exe story verify MF-012` passed.
- `npm run test:quick` passed: client/server typecheck, server tests
  18 files/65 tests, client tests 6 files/21 tests, client build, server build.

Implemented proof files:

- `client/src/features/annotation/api/annotation.test.ts`

Browser plugin was not available as a callable tool in this session, so
authenticated rendered E2E remains deferred until a Clerk-backed browser fixture
is available.
