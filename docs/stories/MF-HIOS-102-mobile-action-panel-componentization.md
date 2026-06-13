# MF-HIOS-102 Mobile Action Panel Componentization

## Status

implemented

## Lane

normal

## Selected Skill Pack

- `build-web-apps:react-best-practices`
- `mobile-developer`
- `react-patterns`
- `testing-patterns`
- `lint-and-validate`

## Selected Docs

- `AGENTS.md`
- `mobile/MOBILE_AGENT_CONTEXT.md`
- `mobile/README.md`
- `docs/design/*`
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

- Action panels must remain local mock UI only.
- Mobile must not enforce backend permissions or workflow transitions.
- Board voting, tie-break resolution, at-risk decisions, payroll, readiness, ranking formula, and signed URLs remain backend-owned.
- Scope remains Tantou Editor and Board / Board Chair only.

## Implementation Plan

- Add `mobile/src/screens/editor-action-panels.tsx` for Editor proposal and final approval decision panels.
- Add `mobile/src/screens/board-action-panels.tsx` for Board vote, tie-break, vote confirmation, and at-risk decision panels.
- Update role screen files to compose the new action panels.
- Keep hook state, mock action callbacks, and data-source boundaries unchanged.
- Add static tests verifying action panel extraction and endpoint-hint boundary copy.

## Acceptance Criteria

- Editor screens import proposal and final approval action panels from `editor-action-panels.tsx`.
- Board screens import vote, tie-break, confirmation, and at-risk action panels from `board-action-panels.tsx`.
- Future endpoint hints remain visible near action panels.
- Mock action names still match contract-aligned action values.
- No API behavior, auth, permission, or workflow rule changes are introduced.
- Lint, tests, build, and harness governance gate pass.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Visit Editor Manuscripts and Final Approvals.
- Start and cancel proposal/final approval mock confirmations.
- Visit Board Reviews, Tie-break, Ranking, and At-risk.
- Start and cancel Board vote, tie-break, and at-risk mock confirmations.
- Confirm copy still says mobile does not finalize Board decisions or backend workflow state.
