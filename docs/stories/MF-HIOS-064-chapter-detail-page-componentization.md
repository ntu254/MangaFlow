# MF-HIOS-064 Chapter Detail Page Componentization

## Status

implemented

## Lane

normal

## Product Contract

Chapter Detail keeps current pages, tasks, readiness, and publication API behavior while separating route composition, data hook, mappers, tabs, panels, and state preview.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/publication-ranking.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract `useChapterDetail` for page/task/readiness/publication loading and mutation state.
- Extract `chapter-detail.mappers.tsx` for page rows, static bounded preview data, and task labels/actions.
- Extract `ChapterDetailPanels.tsx` for overview, tabs, pages, review, readiness, and state preview panels.
- Preserve existing API behavior:
  - `GET /api/chapters/:chapterId/pages`
  - `GET /api/tasks/chapter/:chapterId`
  - `GET /api/chapters/:chapterId/readiness`
  - `POST /api/publications`
  - `POST /api/publications/:publicationId/schedule`
  - `POST /api/publications/:publicationId/publish`

Out of scope:

- Signed URL/file preview wiring.
- Comment/Submission live read wiring.
- Backend permission/workflow changes.
- UI redesign.

## Acceptance Criteria

- `ChapterDetailPage.tsx` is a thin route composition page.
- Data loading and publication actions live in `useChapterDetail`.
- Page table columns and row mapping leave the page file.
- Pages, review, readiness, overview, tabs, and state preview are componentized.
- Existing backend API calls and copy boundaries are preserved.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not required; frontend componentization only. |
| Integration | Not required; no backend behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client` and `npm run build --prefix client`. |
| Release | Not applicable. |

## Evidence

- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- `ChapterDetailPage.tsx` reduced from 358 lines to 86 lines.
