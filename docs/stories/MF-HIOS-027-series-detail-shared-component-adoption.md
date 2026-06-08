# MF-HIOS-027 Series Detail Shared Component Adoption

## Status

implemented

## Lane

normal

## Product Contract

Replace the `/app/series/:id` placeholder with a concrete Series Detail screen
composed from existing MangaFlow shared UI, layout, and domain components.

This story is presentation-only. It must not fetch persisted Series records,
submit proposals, create chapters, upload files to storage, enforce role
permissions, enforce Board approval, or call MangaFlow APIs.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/chapter-production.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `/app/series/:id` renders a concrete Series Detail page instead of
  `RoutePlaceholderPage`.
- The screen uses shared MangaFlow components before feature-specific layout:
  `PageShell`, `MFCard`, `MFButton`, `MFBadge` or `StatusBadge`,
  `SeriesSummaryCard`, `ChapterCreationGateCard`,
  `ManuscriptUploadPanel`, `ChapterProgressCard`, `ActionItemList`,
  `MFTable`, and feedback states where appropriate.
- The page follows Clean Pastel Creative SaaS styling: light theme, rounded
  bento cards, soft purple shadows, Plus Jakarta Sans token classes, and
  responsive grid behavior.
- Series title, status, genre, publication type, owner metadata, chapter gate,
  manuscript upload boundary, chapter progress, page previews, pending actions,
  loading, empty, and error states are visible.
- The UI clearly labels all local-only/sample behavior and disconnected API or
  storage surfaces.
- The implementation does not add API calls, persisted mutations, file storage,
  permission enforcement, Board decision logic, or real chapter creation.

## Design Notes

- Commands: none added.
- Queries: none added.
- API: no API calls are added in this story.
- Tables: no database tables are changed.
- Domain rules: Board approval and chapter creation gates are displayed as
  sample state only; backend enforcement is out of scope.
- UI surfaces: authenticated Series Detail route under the existing dashboard
  app shell.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id MF-HIOS-027 --unit 1 --integration 1 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | `cd client && npm run build` |
| Integration | `cd client && npm run lint`; static UI contract review |
| E2E | Browser E2E is not configured; mark inconclusive, not pass |
| Platform | `scripts/bin/harness-cli.exe context --story MF-HIOS-027`; `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-027`; `scripts/bin/harness-cli.exe story verify MF-HIOS-027` |
| Release | Not applicable |

## Harness Delta

No harness behavior changes are planned for this story.

## Evidence

- `cd client && npm run build` passed on 2026-06-08. Vite emitted the existing
  chunk-size advisory; build exited 0.
- `cd client && npm run lint` passed on 2026-06-08.
- `git diff --check` passed on 2026-06-08 with a Git line-ending advisory for
  `client/src/App.tsx`; command exited 0.
- `scripts/bin/harness-cli.exe context --story MF-HIOS-027` passed and wrote
  `.harness/context/MF-HIOS-027-context.md`.
- `scripts/bin/harness-cli.exe arch-check --story MF-HIOS-027` passed.
- `scripts/bin/harness-cli.exe trace ... --story MF-HIOS-027` recorded trace
  `#31` and met the required standard tier.
- `scripts/bin/harness-cli.exe story verify MF-HIOS-027` passed both the
  mechanical build command and governance gate.
- Browser E2E is not configured; E2E remains inconclusive, not pass.
