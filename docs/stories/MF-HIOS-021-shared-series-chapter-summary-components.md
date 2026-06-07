# MF-HIOS-021 Shared Series and Chapter Summary Components

## Status

implemented

## Lane

normal

## Product Contract

Add reusable Series and Chapter presentation components for MangaFlow
series/chapter management screens.

The components render caller-supplied series, chapter-gate, and manuscript
upload presentation data only. They do not fetch data, enforce permissions,
validate required proposal fields, decide manuscript submit blockers, calculate
chapter approval gates, upload files, write storage records, or create
chapters.

## Current Frontend Patterns

- Shared domain components compose typed MangaFlow UI primitives.
- Status labels map through `status-ui.ts` and are visible as text.
- Upload presentation uses `MFUploadBox`.
- Interactive shared components expose caller-controlled callbacks, loading,
  and disabled states.
- Business workflow decisions stay outside shared display components.

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

- `SeriesSummaryCard` accepts typed caller-supplied series summary data.
- Series status uses centralized series status mapping and visible labels.
- Series title, genre, and publication type are visible.
- Optional owner, description, and metadata labels wrap gracefully.
- `ChapterCreationGateCard` accepts caller-supplied chapter gate state and
  reason.
- Disabled chapter creation state is visible with a clear reason.
- Enabled chapter creation action invokes only a caller-supplied callback.
- `ManuscriptUploadPanel` uses `MFUploadBox` and shows upload constraints near
  the upload zone.
- Upload panel invokes only caller-supplied file-selection callbacks.
- Components contain no API calls, permission checks, proposal required-field
  validation, manuscript submit blockers, chapter gate calculation, file
  upload/storage logic, or chapter creation logic.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Chapter creation gating is high-risk business logic and must remain
  caller/backend supplied.
- Upload presentation could be mistaken for storage implementation.
- Series submit blockers must remain contract/backend workflow logic.
- Browser E2E is unavailable until concrete Series/Chapter screens mount these
  components.

## Implementation Plan

1. Implement typed `SeriesSummaryCard`.
2. Implement typed `ChapterCreationGateCard`.
3. Implement typed `ManuscriptUploadPanel`.
4. Export components and public types from the domain barrel.
5. Validate TypeScript, build, static UI review, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual interaction review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Series summary renders status, title, genre, publication type, and metadata.
- Chapter gate enabled state exposes a reachable create action.
- Chapter gate disabled state shows a text reason and disables the action.
- Upload constraints are visible near the upload zone.
- Upload panel handles empty constraints and disabled/loading states.
- Components do not fetch, upload, create chapters, or enforce permissions.

## Evidence

- `cd client && npm run build`: pass; Vite built 796 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-021`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-021`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-021`: pass; trace `#25` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-021`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: series status, genre, publication type, and metadata are
  visible as text; chapter creation enabled/blocked states are visible as text
  and action state; upload constraints render next to the shared upload zone.
- Static contract review: components accept caller-supplied values and
  callbacks only; no API calls, permission checks, required-field validation,
  manuscript submit blockers, chapter gate calculation, upload/storage logic,
  or chapter creation logic are implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
