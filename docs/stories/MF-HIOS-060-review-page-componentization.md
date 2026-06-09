# MF-HIOS-060 Review Page Componentization

## Status

planned

## Lane

normal

## Product Contract

Review Page should keep current backend review queue and review action behavior while separating route layout, data hooks, mappers, table columns, and domain panels so the review workflow can scale safely.

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

## Acceptance Criteria

- `ReviewPage.tsx` becomes a thin route-level component focused on page title and layout composition.
- Review queue loading/error/refresh logic moves into `useReviewQueue`.
- Review decision mutation state moves into `useReviewDecisionActions`.
- Backend submission-to-UI row/action/version mapping moves into `review-queue.mappers.ts`.
- Review table column definitions move into `review-table.columns.tsx`.
- Domain panels are extracted under `features/review/components/`:
  - `ReviewHero`
  - `ReviewWorkflowBoundaryCard`
  - `ReviewActionListPanel`
  - `ReviewQueuePanel`
  - `ReviewDecisionPanel`
  - `ReviewTargetPreview`
  - `ReviewReadinessPreview`
  - `ReviewStatePreview`
- No API behavior, route path, backend endpoint, or business rule changes are introduced.
- Existing review action confirmation and backend refresh behavior remain intact.

## Design Notes

- Commands: no backend command changes.
- Queries: keep `GET /api/submissions/review-queue` behavior unchanged.
- Actions: keep explicit review action endpoints unchanged.
- Tables: no database changes.
- Domain rules: no permission or workflow-rule changes; this is frontend componentization only.
- UI surfaces: `ReviewPage` and new review feature components/hooks/utils.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing server tests continue to pass. |
| Integration | Deferred; no live HTTP auth fixture in CI. |
| E2E | Not configured. |
| Platform | Client lint/build and root build pass. |
| Release | Not applicable. |

## Evidence

- Pending implementation.
