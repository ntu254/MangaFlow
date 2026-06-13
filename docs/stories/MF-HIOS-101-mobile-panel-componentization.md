# MF-HIOS-101 Mobile Panel Componentization

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
- `docs/stories/MF-HIOS-100-mobile-role-handoff-profile-polish.md`
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

- Componentization must not change mock action behavior.
- Components must not own backend/API state, permission logic, workflow transitions, readiness calculation, ranking formula, or signed URL access.
- Scope remains Tantou Editor and Board / Board Chair only.

## Implementation Plan

- Add `mobile/src/screens/editor-panels.tsx` for Editor comment detail and readiness evidence panels.
- Add `mobile/src/screens/board-panels.tsx` for Board ranking insight and decision history panels.
- Update role screen files to compose these panels rather than own the panel JSX inline.
- Keep hook state, mock data, and data-source boundaries unchanged.
- Add static tests verifying panel extraction and backend-owned boundary copy.

## Acceptance Criteria

- Editor screens import detail panels from `editor-panels.tsx`.
- Board screens import detail/history panels from `board-panels.tsx`.
- Existing detail copy and backend-owned boundary copy remains intact.
- Lint, tests, build, and harness governance gate pass.
- No API behavior or workflow rule changes are introduced.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Visit Editor Comments and Readiness.
- Visit Board Ranking, Tie-break, and Decision History areas.
- Confirm details still render and mock action behavior is unchanged.
