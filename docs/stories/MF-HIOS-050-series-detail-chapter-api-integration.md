# MF-HIOS-050 Series Detail Chapter API Integration

## Status

implemented

## Lane

normal

## Product Contract

Series Detail must show live chapter records from the backend while keeping chapter creation and page upload gates backend-owned.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Acceptance Criteria

- Series Detail fetches chapters through `GET /api/chapters/series/:seriesId`.
- Chapter list loading, empty, and recoverable error states are visible.
- Chapter status display uses shared status UI components.
- Chapter creation messaging still reflects backend approval gate and does not add frontend-only permission logic.
- Page previews remain clearly out of scope for protected artwork and page file access.

## Design Notes

- Commands: no new backend command.
- Queries: `GET /api/chapters/series/:seriesId`.
- API: add client helper only; backend route already exists.
- Tables: no database changes.
- Domain rules: backend remains source of truth for chapter creation gate.
- UI surfaces: `SeriesDetailPage`.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id MF-HIOS-050 --unit 0 --integration 0 --e2e 0 --platform 0`.

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
- `scripts\bin\harness-cli.exe arch-check --story MF-HIOS-050` -> pass.
- `scripts\bin\harness-cli.exe trace ... --story MF-HIOS-050` -> trace #51, standard tier, meets lane requirement.
