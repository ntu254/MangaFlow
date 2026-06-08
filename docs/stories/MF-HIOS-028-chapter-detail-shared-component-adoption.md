# MF-HIOS-028 Chapter Detail Shared Component Adoption

## Status

implemented

## Lane

normal

## Product Contract

Replace the `/app/chapters/:id` placeholder with a concrete Chapter Detail
screen composed from existing MangaFlow shared UI, layout, and domain
components.

This story is presentation-only. It must not fetch persisted Chapter records,
create chapters, upload pages, create regions, assign tasks, submit reviews,
resolve comments, schedule publication, enforce role permissions, or call
MangaFlow APIs.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/page-workspace.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `/app/chapters/:id` renders a concrete Chapter Detail page instead of
  `RoutePlaceholderPage`.
- The screen uses shared MangaFlow components before feature-specific layout:
  `PageShell`, `MFCard`, `MFButton`, `MFBadge` or `StatusBadge`,
  `ChapterProgressCard`, `ActionItemList`, `MFTable`, `MFPagePreviewCard`,
  `PublicationReadinessChecklist`, `CommentThread`, and feedback states where
  appropriate.
- The page follows Clean Pastel Creative SaaS styling: light theme, rounded
  bento cards, soft purple shadows, Plus Jakarta Sans token classes, and
  responsive grid behavior.
- Chapter title, status, parent Series, page progress, page list, assigned task
  sample, review/comment state, publication readiness, loading, empty, and
  error states are visible.
- The UI clearly labels all local-only/sample behavior and disconnected API,
  storage, review, publication, and workspace permission surfaces.
- The implementation does not add API calls, persisted mutations, page upload,
  region creation, task assignment, comment resolution, publication scheduling,
  permission enforcement, or Assistant full-chapter access.

## Design Notes

- Commands: none added.
- Queries: none added.
- API: no API calls are added in this story.
- Tables: no database tables are changed.
- Domain rules: Chapter readiness, task assignment, and page workspace access
  are displayed as sample state only; backend enforcement is out of scope.
- UI surfaces: authenticated Chapter Detail route under the existing dashboard
  app shell.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id MF-HIOS-028 --unit 1 --integration 1 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | `cd client && npm run build` |
| Integration | `cd client && npm run lint`; static UI contract review |
| E2E | Browser E2E is not configured; mark inconclusive, not pass |
| Platform | `scripts/bin/harness-cli.exe context --story MF-HIOS-028`; `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-028`; `scripts/bin/harness-cli.exe story verify MF-HIOS-028` |
| Release | Not applicable |

## Harness Delta

No harness behavior changes are planned for this story.

## Evidence

- `cd client && npm run build` passed on 2026-06-08. Vite emitted the existing
  chunk-size advisory; build exited 0.
- `cd client && npm run lint` passed on 2026-06-08.
- `git diff --check` passed on 2026-06-08 with a Git line-ending advisory for
  `client/src/App.tsx`; command exited 0.
- `scripts/bin/harness-cli.exe context --story MF-HIOS-028` passed and wrote
  `.harness/context/MF-HIOS-028-context.md`.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-028` passed.
- `scripts/bin/harness-cli.exe trace ... --story MF-HIOS-028` recorded trace
  `#32` and met the required standard tier.
- `scripts/bin/harness-cli.exe story verify MF-HIOS-028` passed both the
  mechanical build command and governance gate.
- Browser E2E is not configured; E2E remains inconclusive, not pass.
