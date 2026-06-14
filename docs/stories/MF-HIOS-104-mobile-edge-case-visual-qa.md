# MF-HIOS-104 Mobile Edge Case Visual QA

## Status

implemented

## Lane

normal

## Selected Skill Pack

- `build-web-apps:frontend-testing-debugging`
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

- Edge-case visual QA must not introduce frontend-only workflow decisions or permission checks.
- Empty states, long labels, and narrow viewport handling must remain presentation-only.
- Scope remains Tantou Editor and Board / Board Chair only.

## Implementation Plan

- Harden shared mobile UI primitives for long labels, tab labels, queue values, badges, and series action pills.
- Add stable empty queue rendering when a shared queue list receives an empty array.
- Improve wrapping for readiness rows, comment rows, action rows, and ranking rows at narrow mobile widths.
- Add static tests that guard the long-label and empty-state visual resilience patterns.
- Validate with lint, tests, build, and Browser mobile smoke checks.

## Acceptance Criteria

- Long titles and labels wrap or clamp without pushing sibling controls outside their parent.
- Empty queue lists render a stable shared fallback instead of an empty card.
- Primary action rows can wrap at narrow viewport widths.
- Static tests cover the visual edge-case patterns.
- No API behavior, auth, permission, or workflow rule changes are introduced.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Visit Editor and Board screens at 390px width.
- Confirm long labels and narrow action rows do not cause horizontal overflow.
- Confirm empty queue copy remains presentation-only and does not imply backend decisions.
