# MF-HIOS-019 Shared Board Decision Components

## Status

implemented

## Lane

normal

## Product Contract

Add reusable Board presentation components for vote, decision, at-risk, and
ranking UI surfaces.

The components render caller-supplied labels, counts, statuses, rows, and
callbacks only. They do not fetch data, enforce Board roles, calculate majority
or tie-break outcomes, validate ranking imports, calculate final score, or
execute at-risk decisions.

## Current Frontend Patterns

- Shared domain components compose typed MangaFlow UI primitives.
- Status labels map through `status-ui.ts` and are visible as text.
- `MFTable` handles accessible responsive comparison tables.
- Interactive shared components use caller-controlled callbacks, loading, and
  disabled states.
- Business workflow decisions stay outside shared display components.

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
- `docs/design/*`
- `docs/validation/test-plan.md`
- `docs/validation/ui-review-checklist.md`

## Acceptance Criteria

- `DecisionBadge` displays caller-supplied Board decision status through a
  centralized status mapping.
- `AtRiskBadge` displays caller-supplied at-risk status through a centralized
  status mapping.
- `VoteCard` accepts caller-supplied vote options, counts, labels, and optional
  vote callbacks.
- `VoteCard` can visually separate caller-supplied tie-break state for the
  Board Chair without calculating the tie.
- `RankingTable` accepts caller-supplied ranking rows and renders an accessible
  responsive comparison table.
- Ranking rows show rank, series, vote count, reader score, final score, and
  status without calculating or validating values.
- Components use shared MangaFlow primitives, design tokens, visible labels,
  and responsive layouts.
- Components contain no API calls, permission checks, majority calculation,
  tie-break resolution, ranking formula, readerScore validation, or at-risk
  decision execution.
- Client build and lint pass.
- HI-OS context, arch-check, trace, and story verify pass.

## Risks

- Board majority and tie-break rules are high-risk business logic and must not
  be implemented in shared UI.
- Ranking formula and readerScore validation must remain backend/import
  responsibilities.
- At-risk decision actions require confirmation and are intentionally out of
  scope for these display badges.
- Browser E2E is unavailable until concrete Board screens mount these shared
  components.

## Implementation Plan

1. Add centralized Board decision, at-risk, and ranking status UI mappings.
2. Implement `DecisionBadge` and `AtRiskBadge` display components.
3. Implement typed `VoteCard` with caller-supplied options, counts, loading,
   disabled state, and tie-break note.
4. Implement typed `RankingTable` using `MFTable`.
5. Export components and public types from the domain barrel.
6. Validate TypeScript, build, static UI review, and HI-OS gates.

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Unit | Strict TypeScript no-emit lint |
| Integration | Vite production build |
| E2E | Not configured; static/manual interaction review documented |
| Platform | HI-OS context, arch-check, trace, story verify |

## Manual QA

- Decision and at-risk badges render visible status labels.
- Vote options show clear labels, descriptions, and caller-supplied counts.
- Vote buttons invoke only caller callbacks and respect loading/disabled state.
- Tie-break state is visually separated and text-visible when supplied.
- Ranking table has a caption and shows caller-supplied ranking values.
- Long series titles wrap and table overflow remains usable on narrow screens.

## Evidence

- `cd client && npm run build`: pass; Vite built 796 modules. The existing
  bundle-size warning remains non-blocking.
- `cd client && npm run lint`: pass; strict TypeScript no-emit check completed.
- `git diff --check`: pass.
- `harness-cli context --story MF-HIOS-019`: pass; context pack generated.
- `harness-cli arch-check --story MF-HIOS-019`: pass; no architecture
  violations found.
- `harness-cli trace --story MF-HIOS-019`: pass; trace `#23` achieved the
  required standard tier.
- `harness-cli story verify MF-HIOS-019`: pass; mechanical verification and
  governance gate both passed.
- Static UI review: decision, at-risk, vote, tie-break, and ranking states are
  visible as text; interactive vote options use native buttons and
  caller-controlled loading/disabled state; ranking rows render through the
  accessible responsive `MFTable`.
- Static contract review: components accept caller-supplied values and
  callbacks only; no API calls, permission checks, majority calculation,
  tie-break resolution, ranking formula, readerScore validation, or at-risk
  decision execution are implemented.
- Browser E2E is not configured and remains inconclusive rather than passed.
