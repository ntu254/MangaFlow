# MF-HIOS-060 Review Page Componentization

## Status

implemented

## Lane

normal

## Product Contract

Review Page keeps the current backend review queue read and explicit submission review action behavior while extracting the smallest safe componentization slice. This story is frontend-only and must not change API behavior, route paths, permissions, workflow rules, or backend refresh semantics.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-review.md`
- `docs/design/component-system.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Scope

In scope:

- Extract `ReviewQueuePanel` from `ReviewPage.tsx`.
- Extract `ReviewDecisionPanel` from `ReviewPage.tsx`.
- Extract `useReviewQueue` for queue fetch, loading, error, and refresh.
- Extract `review-queue.mappers.ts` for backend submission-to-UI row/action/version mapping.
- Extract static review previews into `review-static-content.ts`.
- Extract page layout sections into `ReviewHeroPanel`, `ReviewQueueSection`, `ReviewDecisionSection`, and `ReviewStatePreview`.
- Keep existing API calls, request payloads, response handling, error copy, confirmation behavior, and refresh-after-action behavior unchanged.

Out of scope:

- New backend endpoints or API shape changes.
- Permission, role, or workflow-rule changes.
- Signed URL/file preview wiring.
- Comment action wiring.
- Publication readiness API wiring.
- Table redesign, route changes, or broad visual redesign.
- Additional extractions beyond the four named artifacts unless required for TypeScript compile only.

## Acceptance Criteria

- `ReviewPage.tsx` becomes a thinner route-level component focused on page title, memoized queue view models, and layout composition.
- `useReviewQueue` owns `GET /api/submissions/review-queue` loading, error, queue state, and `refresh` behavior.
- `ReviewQueuePanel` renders the review queue table plus loading, empty, and error/retry states.
- `ReviewDecisionPanel` renders the submission id input, reviewer note input, final-approval toggle, decision preview, and `ReviewDecisionBar`.
- `review-queue.mappers.ts` contains the current `submissionId`, submitted-by label, file label, review rows, review actions, and submission version mapping behavior.
- Review approve/request-revision/reject/editor-final-approve endpoints remain unchanged.
- Existing rejection confirmation copy and backend refresh after a successful action remain intact.
- No backend code, API contract, DB schema, permission rule, status transition, or business rule is changed.

## Design Notes

- Commands: no backend command changes.
- Queries: keep `GET /api/submissions/review-queue` behavior unchanged.
- Actions: keep explicit submission review action endpoints unchanged.
- Tables: no database changes.
- Domain rules: backend remains source of truth for Mangaka-before-Editor review, Editor final approval, payroll trigger, permissions, and readiness.
- UI surfaces: `client/src/features/review/pages/ReviewPage.tsx`, `client/src/features/review/components/*`, `client/src/features/review/hooks/*`, `client/src/features/review/utils/*`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing server/client unit tests continue to pass if invoked by root test command or package tests. |
| Integration | Not required; no backend behavior changes. |
| E2E | Not configured. |
| Platform | `npm run lint --prefix client`, `npm run build --prefix client`, and root build if feasible. |
| Release | Not applicable. |

Manual QA:

- Open `/app/review` as an authenticated Mangaka/Editor-capable user.
- Confirm queue loading, empty/error retry, and table row rendering match pre-refactor behavior.
- Enter a real submission id, run each available action for the correct role, and confirm success refreshes the queue.
- Confirm rejection still requires confirmation.
- Confirm unsupported/invalid submission id still shows backend rejection copy.

## Evidence

- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- `ReviewPage.tsx` reduced to 39 lines.
- Extracted `useReviewQueue`, `ReviewQueuePanel`, `ReviewDecisionPanel`, `ReviewHeroPanel`, `ReviewQueueSection`, `ReviewDecisionSection`, `ReviewStatePreview`, `review-static-content.ts`, and `review-queue.mappers.ts`.
- Existing backend review action API behavior preserved.

