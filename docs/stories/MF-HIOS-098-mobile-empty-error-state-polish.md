# MF-HIOS-098 Mobile Empty Error State Polish

## Status

implemented

## Lane

normal

## Selected Skill Pack

- `mobile-developer`
- `react-patterns`
- `testing-patterns`
- `lint-and-validate`

## Selected Docs

- `AGENTS.md`
- `mobile/MOBILE_AGENT_CONTEXT.md`
- `docs/stories/MF-HIOS-097-mobile-queue-selection-details.md`
- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-review.md`
- `docs/contracts/ui-board.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Risks

- Empty/error UI must not be treated as authorization or workflow enforcement.
- Retry/action copy remains UI-only and does not call APIs.
- No Board decision, Editor approval, readiness, payroll, auth, file, or signed URL logic is changed.

## Implementation Plan

- Add shared `MFStateNotice` for loading, error, and informational mock-action feedback.
- Add shared `MFEmptyState` for empty queues and missing selected detail panels.
- Replace duplicate Editor and Board local state banner components.
- Add empty fallbacks to Editor manuscript, comments, final approval, and selected submission states.
- Add empty fallbacks to Board review, tie-break, ranking, at-risk, and selected at-risk states.
- Add static tests for shared state components and role screen coverage.

## Acceptance Criteria

- Mobile screens use shared loading/error state UI instead of duplicate local banner functions.
- Editor review surfaces show stable empty states for manuscript, comment, final approval, and missing detail panels.
- Board surfaces show stable empty states for reviews, tie-breaks, ranking imports, at-risk cases, and missing detail panels.
- Empty/error copy keeps backend-owned workflow boundaries clear.
- Existing Editor + Board/Board Chair scope remains unchanged.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Switch roles and visit every tab.
- Confirm normal mock data still renders.
- Confirm loading/error/empty copy is API-ready and does not imply frontend permission enforcement.
