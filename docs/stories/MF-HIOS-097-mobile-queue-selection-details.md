# MF-HIOS-097 Mobile Queue Selection Details

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
- `docs/stories/MF-HIOS-096-mobile-decision-confirmation-details.md`
- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-review.md`
- `docs/contracts/ui-board.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Risks

- Selectable rows are local UI state only and must not imply backend authorization.
- Selecting a queue item must not trigger workflow transitions or API calls.
- Scope remains Tantou Editor and Board / Board Chair mobile only.

## Implementation Plan

- Add optional `selected` and `onPress` props to shared `MFSeriesRow`.
- Give selected rows an accessible selected state and visible active style.
- Wire Editor manuscript rows to `selectedManuscriptId`.
- Wire Editor final approval rows to `selectedSubmissionId` and render detail from the same hook state.
- Wire Board series review rows to `selectedSeriesId`.
- Wire Board at-risk rows to `selectedAtRiskId`.
- Add static tests for selectable rows and detail panel wiring.

## Acceptance Criteria

- Tapping an Editor manuscript row updates the proposal decision preview.
- Tapping an Editor final approval row updates the submission review detail.
- Tapping a Board review row updates the vote summary/detail.
- Tapping a Board at-risk row updates the manual decision detail.
- Selected rows are visually distinct and expose accessibility selected state.
- No backend action, permission logic, or workflow transition is introduced.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Switch roles and tap several queue rows in Editor Review, Editor Final Approval, Board Reviews, and Board Ranking/At-risk.
- Confirm detail copy changes to the selected mock item.
- Confirm action confirmation panels remain local mock UI.
