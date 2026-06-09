# MF-HIOS-051 Chapter Detail Page API Integration

## Status

implemented

## Lane

normal

## Product Contract

Chapter Detail must show live page metadata from the backend without fetching protected artwork or changing signed file access rules.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Chapter Detail fetches pages through `GET /api/chapters/:chapterId/pages`.
- Page list loading, empty, and recoverable error states are visible.
- Page status display uses shared status UI components.
- The UI clearly states that page artwork and signed URL access are not fetched in this slice.
- Task/review/context panels remain clearly labeled as sample-only until their APIs are wired.

## Design Notes

- Commands: no new backend command.
- Queries: `GET /api/chapters/:chapterId/pages`.
- API: add client helper only; backend route already exists.
- Tables: no database changes.
- Domain rules: no file access or Assistant workspace rules change.
- UI surfaces: `ChapterDetailPage`.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id MF-HIOS-051 --unit 0 --integration 0 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Existing server tests continue to pass. |
| Integration | Deferred; no live HTTP auth fixture in CI. |
| E2E | Not configured. |
| Platform | Client lint/build and root build pass. |
| Release | Not applicable. |

## Harness Delta

No harness updates planned.

## Evidence

- `npm run lint --prefix client` -> pass.
- `npm run test --prefix server` -> pass, 20 files / 90 tests.
- `npm run lint --prefix server` -> pass.
- `npm run build` -> pass; Vite chunk-size warning only.
- `git diff --check` -> pass.
- `scripts\bin\harness-cli.exe trace ... --story MF-HIOS-051` -> trace #52, standard tier, meets lane requirement.
