# MF-HIOS-025 Review Queue Shared Component Adoption

## Status

implemented

## Lane

normal

## Product Contract

Replace the `/review` placeholder with a concrete frontend review queue page
that composes MangaFlow shared review, comment, submission, and readiness
presentation components.

This story is presentation-only. It uses local sample state to show review
queues, decision actions, submission versions, comments, and publication
readiness states. It does not fetch reviews, approve manuscripts, approve
submissions, request revisions, reject records, resolve comments, update
publication readiness, trigger payroll, upload files, or call review/comment
APIs.

## Current Frontend Patterns

- Authenticated routes render inside the shared `DashboardLayout`.
- `/review` currently renders a shared `RoutePlaceholderPage`.
- Feature pages use `PageShell` and shared MangaFlow primitives.
- Shared review components exist but are not mounted on a concrete review route.
- Status labels map through `status-ui.ts`.
- Empty, loading, and error states are represented with shared feedback
  components.

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
- `docs/contracts/manuscript-review.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-review.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `/review` renders a concrete shared-component review queue page.
- The page uses `PageShell`, `MFCard`, `MFButton`, and `MFBadge`.
- Review queue items render in a shared `MFTable`.
- The review target preview uses `MFPagePreviewCard`.
- Review actions render through `ReviewDecisionBar`.
- Reject confirmation exists through the shared decision component.
- Decision actions record local preview state only and clearly state that no
  review API is connected.
- Submission versions render through `SubmissionVersionList`.
- Comments render through `CommentThread` with visible unresolved state.
- Publication blockers render through `PublicationReadinessChecklist`.
- Empty, loading, error, resolved, submitted, and revision states are
  represented.
- No review API, manuscript approval, submission approval, revision request,
  rejection, comment lifecycle mutation, publication readiness update, payroll
  trigger, file upload, or signed URL behavior is implemented.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Review decisions are workflow-critical and must not become client-only
  behavior.
- Editor final approval can trigger payroll in the real product and is out of
  scope for this story.
- Comment resolution blocks publication and must not be mutated here.
- Sample review data could be mistaken for API-backed production data.
- Browser E2E is unavailable until a configured browser runner exists.

## Implementation Plan

1. Add a feature review page that composes existing shared components.
2. Use module-level sample queue, comment, submission, and readiness data.
3. Add local decision preview state without calling APIs.
4. Add visible API-disconnected and no-workflow-mutation boundaries.
5. Wire `/review` to the new page.
6. Validate TypeScript, build, static UI review, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual UI review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Review route shows queue table, target preview, decision bar, comments,
  submission versions, and readiness checklist.
- Reject decision opens a confirmation dialog.
- Approve, request revision, and reject actions update only local preview copy.
- Comments show unresolved and resolved lifecycle states as text.
- Readiness checklist identifies blockers.
- Empty, loading, and error previews are visible.

## Evidence

- `cd client && npm run build`: pass; Vite built 820 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass; Git reported the existing CRLF normalization
  warning for `client/src/App.tsx`, but no whitespace errors.
- `harness-cli context --story MF-HIOS-025`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-025`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-025`: pass; trace `#29` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-025`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: `/review` now renders through `PageShell`, `MFCard`,
  `MFButton`, `MFBadge`, `MFTable`, `MFPagePreviewCard`,
  `ReviewDecisionBar`, `CommentThread`, `SubmissionVersionList`,
  `PublicationReadinessChecklist`, `MFEmptyState`, and `MFErrorState`;
  reject confirmation is available through the shared decision component;
  empty, loading, error, resolved, submitted, and revision states are
  represented.
- Static contract review: no review API, manuscript approval, submission
  approval, revision request, rejection, comment lifecycle mutation,
  publication readiness update, payroll trigger, file upload, or signed URL
  behavior was implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
