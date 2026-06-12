# MF-HIOS-096 Mobile Decision Confirmation Details

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
- `docs/stories/MF-HIOS-095-mobile-editor-board-flow-foundation.md`
- `mobile/README.md`
- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/ui-review.md`
- `docs/contracts/ui-board.md`
- `docs/contracts/workflow-status.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/validation/test-plan.md`

## Risks

- Confirmation UI must not be treated as backend authorization.
- Board votes, tie-breaks, at-risk decisions, Editor approvals, and publication readiness remain backend-owned workflow actions.
- Mobile action copy must not imply Admin override, automatic cancellation, or frontend finalization.

## Implementation Plan

- Add a shared mobile `MFConfirmationPanel` primitive.
- Add local pending action state to `useEditorMobileFlow` for proposal and final approval decisions.
- Add local pending action state to `useBoardMobileFlow` for votes and at-risk decisions.
- Show confirmation detail panels before mock action recording in Editor proposal review, Editor final approval, Board reviews, Board Chair tie-break, and Board at-risk screens.
- Include future POST endpoint hints as copy only, without API wiring.
- Add static tests that assert confirmation detail coverage and endpoint-boundary copy.

## Acceptance Criteria

- Editor proposal actions show confirmation before local mock recording.
- Editor final approval actions show confirmation before local mock recording.
- Board vote actions show confirmation before local mock recording.
- Board Chair tie-break shows confirmation and remains visually tied to `TIE_BREAK_REQUIRED`.
- Board at-risk actions show confirmation and state that cancellation is never automatic.
- Confirmation copy references future action endpoints without calling them.
- Existing mobile scope remains Editor + Board/Board Chair only.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Switch between Board and Tantou Editor.
- Trigger each decision button and verify confirmation/cancel/confirm mock feedback.
- Confirm no copy implies frontend permission enforcement, Admin override, automatic cancellation, or real backend mutation.
