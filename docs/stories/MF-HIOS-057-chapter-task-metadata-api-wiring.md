# MF-HIOS-057 Chapter Task Metadata API Wiring

## Status

implemented

## Lane

normal

## Product Contract

Chapter Detail must show chapter task metadata from backend task endpoints while keeping Assistant workspace access, submission review, comments, and file access backend-owned and out of this UI slice.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Chapter Detail fetches chapter tasks through `GET /api/tasks/chapter/:chapterId`.
- Featured task and pending action summaries use backend task metadata when available.
- Task loading, empty, and recoverable error states are visible.
- Assistant access remains enforced by backend task services; no frontend-only permission shortcut is added.
- Submission/comment/context panels remain clearly bounded until their read APIs are selected.
- Protected artwork and signed URL access remain out of scope.

## Design Notes

- Commands: no new backend command.
- Queries: `GET /api/tasks/chapter/:chapterId`.
- API: add client helper only; backend route already exists.
- Tables: no database changes.
- Domain rules: no task assignment, review, payroll, or file access rule changes.
- UI surfaces: `ChapterDetailPage`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing server tests continue to pass. |
| Integration | Deferred; no live HTTP auth fixture in CI. |
| E2E | Not configured. |
| Platform | Client lint/build and root build pass. |
| Release | Not applicable. |

## Evidence

- `npm run lint --prefix client` -> pass.
- `npm run test --prefix server` -> pass, 20 files / 90 tests.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass; LF-to-CRLF warnings only.
