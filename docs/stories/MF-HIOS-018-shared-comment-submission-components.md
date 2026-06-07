# MF-HIOS-018 Shared Comment and Submission Review Components

## Status

implemented

## Lane

normal

## Product Contract

Add reusable comment-thread and submission-version presentation components for
MangaFlow review screens.

The components render caller-supplied comments, versions, statuses, and
callbacks only. They do not fetch data, enforce roles, advance comment
lifecycle states, approve submissions, or decide publication readiness.

## Current Frontend Patterns

- Shared domain components compose typed MangaFlow UI primitives.
- Review actions and readiness displays are presentation-only and
  caller-controlled.
- Status labels map through `status-ui.ts` and are visible as text.
- Empty states use shared feedback components.
- Layouts wrap at mobile width and preserve long manga/task names.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-review.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `CommentThread` accepts typed caller-supplied comments.
- Comment status uses centralized status mapping and visible labels.
- Unresolved comments are easy to find with text, badges, and item metadata.
- Empty comment state uses a shared honest empty state.
- Optional comment actions are caller-supplied callbacks only.
- `SubmissionVersionList` accepts typed caller-supplied submission versions.
- Version status uses centralized status mapping and visible labels.
- Current/selected version is visually and textually distinct.
- Empty version state uses a shared honest empty state.
- Components use shared MangaFlow primitives, design tokens, and responsive
  layouts.
- Components contain no API calls, permission checks, lifecycle transitions,
  submission approval, or publication-readiness business rules.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Caller callbacks could be mistaken for frontend-enforced lifecycle rules.
- Color-only comment state would violate accessibility requirements.
- A selected version could imply editability after submission.
- Browser E2E is unavailable until a concrete review screen mounts these
  shared components.

## Implementation Plan

1. Add centralized comment and submission status UI mappings.
2. Implement typed `CommentThread` with empty state, metadata, status badges,
   unresolved emphasis, and optional actions.
3. Implement typed `SubmissionVersionList` with empty state, selected/current
   version treatment, metadata, status badges, and optional selection.
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

- Empty comment and version lists render honest empty states.
- Comment lifecycle statuses are visible as text badges.
- Unresolved comments include a visible unresolved marker.
- Comment actions render as buttons and invoke only caller callbacks.
- Selected/current versions are distinguishable without color alone.
- Long body text, filenames, and task labels wrap on mobile width.

## Evidence

- `cd client && npm run build`: pass; Vite built 796 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-018`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-018`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-018`: pass; trace `#22` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-018`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: comment statuses and unresolved state are visible as text
  and badges; version current/selected states are visible as text and badges;
  empty states use shared feedback components; long text wraps on mobile.
- Static contract review: components accept caller-supplied data and callbacks
  only; no API calls, permission checks, comment lifecycle transitions,
  submission approvals, or publication readiness rules are implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
