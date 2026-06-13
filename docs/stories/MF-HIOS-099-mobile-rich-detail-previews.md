# MF-HIOS-099 Mobile Rich Detail Previews

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
- `docs/stories/MF-HIOS-098-mobile-empty-error-state-polish.md`
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

- Detail preview must not imply signed file access from mobile.
- Publication readiness remains backend-owned and is displayed only as mock result evidence.
- Ranking finalScore and at-risk outcomes remain backend-owned and are not calculated in mobile.
- Board decision history is read-only display and does not mutate Board decisions.

## Implementation Plan

- Add shared `MFDetailList` and `MFTimeline` primitives.
- Add selected comment state to `useEditorMobileFlow`.
- Add Editor comment detail panel with canonical status, owner, page target, blocker state, and lifecycle timeline.
- Add Editor readiness evidence detail list and checklist timeline.
- Add selected ranking state to `useBoardMobileFlow`.
- Add Board ranking insight panel with imported rank movement, reader score, vote count, finalScore display, and Board review timeline.
- Render Board decision history through shared immutable-looking timeline.
- Add static tests for detail previews and backend-owned boundary copy.

## Acceptance Criteria

- Editor Comments screen shows a selectable comment detail preview.
- Editor Readiness screen shows backend-owned evidence and timeline context.
- Board Ranking screen shows selectable ranking insight without recomputing finalScore.
- Board Decision History uses a consistent timeline display.
- Copy explicitly avoids implying signed file access, frontend readiness calculation, ranking formula calculation, or Board mutation.
- Existing mobile scope remains Editor + Board/Board Chair only.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Switch to Tantou Editor, open Comments and Readiness, and inspect detail panels.
- Switch to Board, open Ranking, select ranking rows, and inspect history timeline.
- Confirm detail copy does not imply API mutation or frontend-owned business rules.
