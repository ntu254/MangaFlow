# MF-HIOS-014 Create Series Proposal Frontend

## Status

implemented

## Lane

normal

## Product Contract

Implement the authenticated Mangaka create-Series proposal flow against the
existing `POST /api/series` endpoint.

This story does not implement Series list/detail fetching because no GET
endpoint exists. It does not add `publicationType` because the backend schema
does not define it. It does not submit a proposal because initial manuscript
upload is not implemented.

## Current Frontend Patterns

- React 19, strict TypeScript, React Router, and the shared dashboard shell.
- Authenticated API requests use `apiRequest` with JWT refresh behavior.
- Shared form, dialog, button, card, badge, feedback, and domain components.
- Page titles use `PageTitleContext`.
- Backend role enforcement already protects Series creation for Mangaka.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- Backend/API integration
- HI-OS Governance
- Validation

## Selected Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/series-proposal.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-series-chapter.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `/app/series` renders a real Series proposal page instead of a placeholder.
- Mangaka can open an accessible create-Series dialog.
- Form fields exactly match the backend schema: title, synopsis, and genres.
- Client validation matches backend limits without adding business fields.
- Successful create calls `POST /api/series` and displays the returned draft
  Series in the current page session.
- Loading, API error, validation error, empty, and success states are visible.
- Non-Mangaka users do not see the create CTA; backend remains the enforcement
  boundary.
- Series status uses the canonical status mapping with support for
  `EDITOR_REVIEW` and `REJECTED`.
- The UI clearly states that list persistence requires the future Series query
  endpoint.
- No submit action is exposed before manuscript upload exists.
- Existing uncommitted shell/dashboard/build-info changes are not modified or
  committed.
- Client build/lint and server series tests/build/lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- The page cannot reload or list created Series without a GET endpoint.
- API/network errors may not contain structured field errors.
- Frontend role visibility must not be mistaken for authorization.
- Existing uncommitted changes must remain outside the story commit.

## Implementation Plan

1. Add Series API types and create request helper.
2. Add an accessible create-Series dialog with local validation.
3. Add a Series page with honest empty, error, loading, and created states.
4. Replace the `/app/series` placeholder route.
5. Align Series status presentation with backend status values.
6. Validate client, server, UI review, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Server Series service tests and strict TypeScript lint |
| Integration | Client and server production builds |
| E2E | Not configured; manual create flow remains inconclusive |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Mangaka opens the dialog from `/app/series`.
- Empty title and synopsis show local errors.
- More than 10 genres or a genre over 40 characters is blocked locally.
- Valid submission shows loading and then a draft Series card.
- API failure remains in the dialog with a recoverable message.
- Non-Mangaka users see no create action.
- The page does not claim to list persisted Series after reload.

## Evidence

- `cd client && npm run build`: pass; Vite built 794 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `cd server && npm test`: pass; 3 Series service tests passed.
- `cd server && npm run build`: pass.
- `cd server && npm run lint`: pass.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-014`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-014`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-014`: pass; trace `#18` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-014`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: shared dialog/form/card/badge/empty-state components are
  used; validation and API errors are visible; actions are keyboard-focusable;
  no unsupported list, publication type, manuscript, or submit behavior is
  implied.
- Browser E2E and live MongoDB integration are not configured and remain
  inconclusive rather than passed.
