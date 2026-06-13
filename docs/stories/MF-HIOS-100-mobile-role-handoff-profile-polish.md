# MF-HIOS-100 Mobile Role Handoff Profile Polish

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
- `docs/stories/MF-HIOS-099-mobile-rich-detail-previews.md`
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

- Role switch is prototype navigation only and must not imply authentication or permission enforcement.
- Handoff summaries must not call workflow endpoints or finalize Board decisions.
- Profile copy must not add Admin, Mangaka, or Assistant mobile surfaces.

## Implementation Plan

- Add role-aware handoff summary below the role switch.
- Polish role profile cards with role scope, mock/API boundary, and backend-owned rules.
- Use existing shared `MFCard`, `MFBadge`, `MFIconCircle`, `MFDetailList`, and `MFTimeline` primitives.
- Add static tests for handoff copy, backend boundary copy, and role scope.
- Update mobile agent context, README, and story packet.

## Acceptance Criteria

- Board shell explains proposals are received from Editor-forwarded review.
- Editor shell explains proposal review, final approval, comments, and readiness stay separate.
- Profile screen lists mobile role scope and future API boundary.
- Profile copy states auth, permissions, signed URLs, workflow transitions, readiness, ranking, and payroll are backend-owned.
- No additional mobile roles are introduced.

## Validation Plan

```bash
npm run lint --prefix mobile
npm test --prefix mobile
npm run build --prefix mobile
```

Manual QA:

- Switch between Board and Tantou Editor.
- Open each profile tab and confirm scope/boundary copy.
- Confirm handoff summary does not imply real auth, API mutation, or Admin override.
