# MF-HIOS-022 Series Page Shared Component Adoption

## Status

implemented

## Lane

normal

## Product Contract

Refactor the existing `SeriesPage` session-created Series state to compose the
shared Series/Chapter presentation components.

This story keeps the existing create-Series API behavior unchanged. It does not
add a persisted Series query endpoint, submit proposals, upload manuscript
files, write storage records, create chapters, enforce permissions, or enforce
the chapter approval gate.

## Current Frontend Patterns

- `SeriesPage` already uses `PageShell`, `MFCard`, `MFButton`, and
  `MFEmptyState`.
- `CreateSeriesDialog` owns the current `POST /series` workflow.
- Shared `SeriesSummaryCard`, `ChapterCreationGateCard`, and
  `ManuscriptUploadPanel` exist but are not yet mounted on a concrete screen.
- Existing backend response does not include publication type or persisted list
  data.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/chapter-production.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- Session-created Series state renders through `SeriesSummaryCard`.
- Series status, title, genre, and publication type placeholder are visible.
- Chapter creation gate renders through `ChapterCreationGateCard`.
- Non-approved Series shows disabled chapter creation state with a reason.
- Manuscript upload surface renders through `ManuscriptUploadPanel`.
- Selected manuscript filenames can be shown locally without uploading files.
- Upload surface clearly states that upload/storage is not connected yet.
- Empty state remains honest when no Series exists in the current session.
- Existing `CreateSeriesDialog` create flow remains unchanged.
- No Series query endpoint, proposal submission, file upload/storage,
  permission enforcement, or chapter creation is implemented.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Chapter gate display could be mistaken for backend enforcement.
- Local file selection could be mistaken for upload/storage.
- Publication type is absent from current API response and must be labeled
  honestly.
- Browser E2E is unavailable until a configured browser runner exists.

## Implementation Plan

1. Add local manuscript filename state to `SeriesPage`.
2. Replace the session-created Series bespoke card with `SeriesSummaryCard`.
3. Add `ChapterCreationGateCard` with caller-supplied gate state and reason.
4. Add `ManuscriptUploadPanel` with visible constraints and local filename
   display.
5. Preserve existing create-dialog API behavior.
6. Validate TypeScript, build, static UI review, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual UI review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Create Series button and dialog still open from the hero and empty state.
- Session-created Series renders status, title, synopsis, genres, and metadata.
- Chapter creation shows a disabled reason while Series is not approved.
- Manuscript panel shows upload constraints beside the upload zone.
- Selecting files only displays filenames locally and does not upload them.

## Evidence

- `cd client && npm run build`: pass; Vite built 813 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-022`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-022`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-022`: pass; trace `#26` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-022`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: session-created Series now renders through shared summary,
  chapter gate, and manuscript upload components; disabled chapter creation
  reason and local-only upload messaging are text-visible.
- Static contract review: create-Series API behavior is unchanged; no Series
  query endpoint, proposal submission, file upload/storage, permission
  enforcement, or chapter creation is implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
