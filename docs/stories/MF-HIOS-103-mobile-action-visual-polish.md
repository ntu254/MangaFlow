# MF-HIOS-103 Mobile Action Visual Polish

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

- Visual action polish must not change action values, mock callbacks, or backend-owned workflow behavior.
- Mobile must not enforce backend permissions, Board decisions, publication readiness, ranking, payroll, or signed URL logic.
- Raw workflow values may stay in domain data and tests, but user-facing action controls should use readable labels.
- Scope remains Tantou Editor and Board / Board Chair only.

## Implementation Plan

- Normalize quick action controls through shared `MFButton` sizing, wrapping, and soft/outline/filled variants.
- Replace raw action slugs and uppercase status labels in primary mobile controls with readable UI labels.
- Improve action panel wrapping for narrow mobile widths so approve/reject/revision and similar buttons stay aligned.
- Polish status and metric chips in queues, readiness blockers, ranking rows, confirmation panels, handoff, and profile surfaces.
- Browser smoke test key Editor and Board tabs at narrow mobile widths for overflow, overlap, and console errors.

## Acceptance Criteria

- Board vote, tie-break, and at-risk actions use visually consistent pill controls.
- Editor proposal and final approval actions use the same button language and hierarchy.
- Confirmation panels show readable action labels while preserving contract-aligned action values internally.
- Queue/status chips and segmented controls no longer expose raw enum copy as primary UI labels.
- No API behavior, auth, permission, or workflow rule changes are introduced.
- Lint, tests, build, and mobile browser smoke checks pass.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Visit Board Reviews, Votes, Ranking, At-risk, and Profile at 390px mobile width.
- Visit Editor Review, Comments, Readiness, and Profile at 390px mobile width.
- Start and cancel mock confirmations for Board and Editor actions.
- Confirm quick actions do not overlap, clip, or expose raw action slugs in primary controls.
- Confirm copy still says mobile does not finalize Board decisions or backend workflow state.
