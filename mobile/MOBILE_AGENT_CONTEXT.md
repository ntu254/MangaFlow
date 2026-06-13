# MangaFlow Mobile Agent Context

## Current Scope

MangaFlow Mobile currently supports only the two approved mobile roles:

- Tantou Editor
- Board / Board Chair

Do not add Admin, Mangaka, or Assistant mobile surfaces unless a new story and contract explicitly expand the mobile scope.

## Source Of Truth

Read these before changing mobile:

- `AGENTS.md`
- `mobile/README.md`
- `mobile/UI-mobile_Requirement.md`
- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/product/user-flow.md`
- `docs/contracts/main.md`
- `docs/contracts/workflow-status.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-review.md`
- `docs/contracts/ui-board.md`
- Relevant role contracts such as `manuscript-review.md`, `submission-review.md`, `comment-resolution.md`, `board-approval.md`, and `publication-ranking.md`

## Mobile Architecture

```txt
mobile/src/domain/
  Contract-aligned mobile-local types and canonical status/action values.

mobile/src/data/
  Role-specific mock data only.

mobile/src/services/
  MobileWorkflowDataSource interface and mock implementation.

mobile/src/hooks/
  Role flow hooks that read from the data source and manage local mock UI state.

mobile/src/screens/
  Thin role screens composed from shared mobile UI primitives.
```

## Mock/API Boundary

- `mockMobileWorkflowDataSource` is the replacement point for future API calls.
- Mock actions may update local UI messages only.
- Do not implement backend permissions, workflow transitions, readiness calculation, ranking formula, payroll, or signed URL access in mobile.
- Mobile may display backend-owned results, such as publication readiness checklist output, but must not recompute them.

## Role Flows

### Tantou Editor

- Home: action cards, queues, priority readiness summary, recent activity.
- Manuscript review: proposal queue, selected proposal preview, mock actions `request-revision`, `reject`, `forward-to-board`.
- Final approval: submissions already `MANGAKA_APPROVED`, comparison preview, linked comments, mock actions `request-revision`, `add-comment`, `editor-approve`.
- Comments: lifecycle `OPEN -> FIXED_BY_ASSISTANT -> VERIFIED_BY_MANGAKA -> RESOLVED_BY_EDITOR`.
- Readiness: displays mock `PublicationReadinessService` output with item-level pass/fail reasons.

### Board / Board Chair

- Home: pending votes, tie-break queue, ranking, at-risk queue.
- Series reviews: `BOARD_REVIEW` proposals and vote options `APPROVE`, `REJECT`, `NEEDS_REVISION`.
- Tie-break: only visible as Board Chair resolution when mock decision status is `TIE_BREAK_REQUIRED`.
- Ranking: imported ranking preview with readerScore in the contract range.
- At-risk: manual decisions `CONTINUE`, `WARNING`, `REQUEST_IMPROVEMENT_PLAN`, `CANCEL`; cancellation is never automatic.
- Decision history: immutable-looking display of prior Board decisions.

## Implemented Story Slices

- `MF-HIOS-095`: Mobile Editor + Board flow foundation with role mock data, API-ready data-source boundary, domain DTOs, hooks, and base screens.
- `MF-HIOS-096`: Mobile decision confirmation details for Editor proposal/final approval actions and Board vote/tie-break/at-risk actions. Confirmation panels are local mock UI only and do not enforce permissions or mutate backend workflow state.
- `MF-HIOS-097`: Mobile queue selection details. `MFSeriesRow` supports tap/selected state; Editor manuscript/final approval queues and Board review/at-risk queues update their local detail panels from hook state.
- `MF-HIOS-098`: Mobile empty/loading/error state polish. Shared `MFStateNotice` and `MFEmptyState` cover API-ready loading, error, empty queue, and missing selected-detail states without adding workflow logic.

## Forbidden Shortcuts

- Do not imply Admin can override Board.
- Do not imply Board votes on every Chapter.
- Do not let mobile-only checks stand in for backend authorization.
- Do not let Assistant access be inferred from Series membership in any future mobile work.
- Do not store or mock base64 AI output as database content.

## Next Story Picker

Choose the next story by the smallest safe boundary:

1. Missing empty/error/detail states inside Editor/Board screens: normal lane.
2. UI polish for mobile touch targets, overflow, queue selection, and detail previews: normal lane.
3. Replacing mock data-source methods with read-only API calls: normal or high-risk depending on endpoint and permission surface.
4. Auth, signed URLs, Board decision mutations, readiness publish actions, payroll, or Assistant scope: high-risk lane.
5. Adding roles beyond Editor/Board: new product/mobile scope story first.

## Validation

Run after mobile changes:

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA should cover role switch, all tabs, mock decision feedback, no overflow on mobile width, and no copy that contradicts backend-owned workflow rules.
