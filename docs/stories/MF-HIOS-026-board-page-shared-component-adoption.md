# MF-HIOS-026 Board Page Shared Component Adoption

## Status

implemented

## Lane

normal

## Product Contract

Replace the `/board` placeholder with a concrete frontend Board page that
composes MangaFlow shared board decision, voting, ranking, and at-risk
presentation components.

This story is presentation-only. It uses local sample state to show Board
approval queues, vote options, tie-break status, ranking rows, and at-risk
decision states. It does not fetch Board data, submit votes, calculate majority,
finalize decisions, perform tie-breaks, import rankings, validate ranking
scores, mark a Series at risk, approve chapter creation, or add Admin override
behavior.

## Current Frontend Patterns

- Authenticated routes render inside the shared `DashboardLayout`.
- `/board` currently renders a shared `RoutePlaceholderPage`.
- Feature pages use `PageShell` and shared MangaFlow primitives.
- Shared board components exist but are not mounted on a concrete Board route.
- Status labels map through `status-ui.ts`.
- Empty, loading, and error states are represented with shared feedback
  components.

## Selected Skill Pack

- Build Web Apps React best practices
- UI
- HI-OS Governance
- Validation

## Selected Docs

- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/board-approval.md`
- `docs/contracts/publication-ranking.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-board.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `/board` renders a concrete shared-component Board page.
- The page uses `PageShell`, `MFCard`, `MFButton`, and `MFBadge`.
- Board queue items render in a shared `MFTable`.
- Vote options and vote summary render through `VoteCard`.
- Board Chair tie-break state is visually distinct.
- Board decision status renders through `DecisionBadge`.
- At-risk status renders through `AtRiskBadge`.
- Ranking rows render through `RankingTable`.
- At-risk local preview actions use a confirmation surface.
- Empty, loading, error, pending, tie-break, imported, finalized, and at-risk
  states are represented.
- No Board API, vote mutation, majority calculation, decision finalization,
  tie-break mutation, ranking import, ranking score validation, at-risk
  mutation, chapter creation gate change, or Admin override behavior is
  implemented.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Board majority and tie-break rules are business-critical and must not become
  client-only logic.
- Admin override is forbidden and must not be introduced.
- Ranking import validation and finalScore calculation are backend/business
  behavior and remain out of scope.
- At-risk decisions are workflow-critical and need confirmation in real use.
- Sample Board data could be mistaken for API-backed production data.
- Browser E2E is unavailable until a configured browser runner exists.

## Implementation Plan

1. Add a feature Board page that composes existing shared components.
2. Use module-level sample Board queue, vote, decision, ranking, and at-risk
   data.
3. Add local vote/decision preview state without calling APIs.
4. Add visible API-disconnected and no-business-rule-mutation boundaries.
5. Wire `/board` to the new page.
6. Validate TypeScript, build, static UI review, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual UI review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Board route shows queue table, vote card, decision status, ranking table, and
  at-risk section.
- Vote options and tie-break summary are visible as text.
- Local vote and at-risk actions update only local preview copy.
- At-risk danger preview opens a confirmation dialog.
- Empty, loading, and error previews are visible.

## Evidence

- `cd client && npm run build`: pass; Vite built 821 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass; Git reported the existing CRLF normalization
  warning for `client/src/App.tsx`, but no whitespace errors.
- `harness-cli context --story MF-HIOS-026`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-026`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-026`: pass; trace `#30` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-026`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: `/board` now renders through `PageShell`, `MFCard`,
  `MFButton`, `MFBadge`, `MFTable`, `VoteCard`, `DecisionBadge`,
  `AtRiskBadge`, `RankingTable`, `ReviewDecisionBar`, `MFEmptyState`, and
  `MFErrorState`; Board Chair tie-break state is visually distinct; at-risk
  local preview uses the shared confirmation surface; empty, loading, error,
  pending, tie-break, imported, finalized, and at-risk states are represented.
- Static contract review: no Board API, vote mutation, majority calculation,
  decision finalization, tie-break mutation, ranking import, ranking score
  validation, at-risk mutation, chapter creation gate change, or Admin override
  behavior was implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
