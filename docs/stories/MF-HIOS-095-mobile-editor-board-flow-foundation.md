# MF-HIOS-095 Mobile Editor Board Flow Foundation

## Status

implemented

## Lane

normal

## Selected Skill Pack

- `mobile-developer`
- `react-patterns`
- `react-best-practices`
- `testing-patterns`
- `lint-and-validate`
- `imagegen-frontend-mobile` when future visual concept work is needed

## Selected Docs

- `AGENTS.md`
- `mobile/README.md`
- `mobile/UI-mobile_Requirement.md`
- `docs/product/*`
- `docs/contracts/main.md`
- `docs/contracts/workflow-status.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-review.md`
- `docs/contracts/ui-board.md`
- `docs/contracts/manuscript-review.md`
- `docs/contracts/board-approval.md`
- `docs/contracts/submission-review.md`
- `docs/contracts/comment-resolution.md`
- `docs/contracts/publication-ranking.md`
- `docs/validation/*`

## Risks

- Mobile mock UI must not become frontend-only permission enforcement.
- Mobile must not duplicate backend-owned publication readiness, Board decision, ranking, payroll, auth, or signed URL logic.
- Scope remains Tantou Editor and Board/Board Chair only.

## Implementation Plan

- Add contract-aligned mobile domain types under `mobile/src/domain`.
- Split role mock data into `mobile/src/data/editor.ts` and `mobile/src/data/board.ts`.
- Add `MobileWorkflowDataSource` and `mockMobileWorkflowDataSource` so future API wiring replaces one boundary.
- Add role flow hooks for Editor and Board.
- Expand Editor screens for proposal review, final approvals, comments, and readiness display.
- Expand Board screens for proposal voting, tie-break, ranking, at-risk, and decision history.
- Add `mobile/MOBILE_AGENT_CONTEXT.md` so future agents choose the next story from source-of-truth docs instead of memory.

## Acceptance Criteria

- Editor mobile screens show proposal review, final approval, comment lifecycle, and backend-owned readiness results.
- Board mobile screens show vote options, tie-break state, ranking preview, at-risk decisions, and immutable-looking decision history.
- Mock actions update local UI feedback only and name the future backend action boundary.
- Mock readerScore values stay in the 1-10 range.
- Readiness mock includes item-level `passed` and `reason`.
- Existing mobile scope remains Editor + Board/Board Chair only.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Run Expo web and switch between Board and Tantou Editor.
- Visit every tab and check mock decision feedback.
- Confirm mobile copy does not imply Admin override, Board chapter voting, frontend permission enforcement, or mobile-owned readiness calculation.
