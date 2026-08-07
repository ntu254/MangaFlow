# At-risk Reviews UI Safety Hardening

> **Superseded:** the user chose to hide the whole At-risk Reviews feature
> from the UI instead of hardening its rendering. See
> `2026-08-07-at-risk-reviews-feature-hide-design.md` and
> `docs/superpowers/plans/2026-08-07-at-risk-reviews-feature-hide.md`. This
> document is kept for historical reference only and is not being
> implemented.

## Goal

The Board "At-risk Reviews" page (`/app/board/at-risk`) reads `SeriesRanking`
records straight from the API with no runtime validation, then feeds them
through `isRankingAtRisk` / `mapRankingToAtRiskReview` into a table and a
decision panel that lets the Chair record a governance decision. The backend
`RankingModel` schema does not mark `readerScore`, `finalScore`, `voteCount`,
or `source` as `required` (`backend/src/db/models.ts:1321-1343`) — only the
`importRankings()` write path currently guarantees they are filled in. Any
other write path (manual edit, future migration, partial import) can legally
persist a ranking with `atRisk: true` and a missing/non-numeric score.

Today nothing in the frontend screens for that case before the record reaches
render. Goal: make the At-risk Reviews screen degrade safely — hide/flag
records it cannot render meaningfully instead of throwing or rendering
misleading output — and fix the one confirmed silent-rendering defect
(risk-level pill styling) found during the audit.

## Current contract and selected approach

Keep `SeriesRanking` and `AtRiskReview` types unchanged; do not touch the
backend schema or `importRankings()` (out of scope — this is a UI hardening
pass, not a data-integrity migration). Add a completeness guard at the
adapter boundary (`at-risk-review-adapter.ts`) so an incomplete ranking never
reaches `AtRiskReviewsPage`, `PerformanceSnapshot`, or `AtRiskDecisionPanel`:

- A ranking counts as **renderable at-risk** only if `atRisk === true` AND it
  has a non-empty `seriesId`/`seriesTitle` AND at least one of
  `finalScore`/`readerScore` is a finite number.
- Rankings that are `atRisk === true` but fail the renderable check are
  excluded from the table/stat counts (hidden), not shown as broken rows.
  This is a client-side rendering safeguard, not a governance decision — the
  underlying ranking is untouched and still visible via the raw rankings
  admin views for investigation.

Separately, harden the two render paths that currently assume "the number is
really a number" without checking:

- `PerformanceSnapshot` metrics (`finalScore ?? readerScore`, `readerScore`,
  `voteCount`) must use `Number.isFinite` guards before calling `.toFixed()`
  / `.toLocaleString()`, falling back to `"—"` instead of throwing.
- `AtRiskDecisionPanel`'s recorded-decision view must guard
  `new Date(review.decidedAt)` and only render the formatted date when it
  parses to a valid `Date`; otherwise render `"—"`.

Fix the confirmed styling defect: `AtRiskReviewsPage` passes `review.risk`
(`"HIGH"` / `"CRITICAL"`) as a `StatusPill` status, but `status-pill.tsx`'s
`VARIANTS`/`LABELS` maps have no `high`/`critical`/`medium`/`low` keys, so a
`HIGH` risk falls through to the generic muted/gray pill and the label
`"high"` — visually indistinguishable from an unrelated neutral status and
inconsistent with `RankingTable`'s dedicated `RISK_CLASS` red/amber palette
for the same `RiskLevel` values. Add `low`/`medium`/`high`/`critical` entries
to `StatusPill`'s `VARIANTS`/`LABELS` so risk levels always render with a
recognizable tone, and stop special-casing `CRITICAL -> "at_risk"` in
`AtRiskReviewsPage` now that the pill can represent every risk level
natively.

## Data flow

```text
useRankingsListQuery()
  -> SeriesRanking[] (API, no runtime schema validation)
  -> isRankingAtRisk (atRisk === true)
  -> isAtRiskReviewRenderable (NEW: seriesId, seriesTitle, finite score present)
       -> false: excluded from AtRiskReviewsPage entirely (hidden)
       -> true: mapRankingToAtRiskReview -> AtRiskReview
            -> AtRiskReviewsPage table row (StatusPill risk fix)
            -> PerformanceSnapshot (Number.isFinite guards)
            -> AtRiskDecisionPanel (decidedAt guard)
```

No new network calls, no schema/type changes, no backend changes.

## Testing

Since this repo's frontend has no unit-test runner wired into `npm test`
(existing coverage under `src/**/*.check.ts` runs directly via `tsx`, see
`revote-banner.check.ts`), add
`frontend/src/features/board/at-risk/model/at-risk-review-adapter.check.ts`
covering:

1. A ranking with `atRisk: true`, a valid `seriesId`/`seriesTitle`, and a
   finite `finalScore` is renderable.
2. A ranking with `atRisk: true` but missing `seriesId` is not renderable.
3. A ranking with `atRisk: true`, both `finalScore` and `readerScore`
   non-finite/absent, is not renderable.
4. A ranking with `atRisk: false` is never renderable regardless of other
   fields (unchanged `isRankingAtRisk` behavior).

Wire it into `frontend/package.json` as `test:at-risk-adapter` following the
`test:revote-banner` pattern, and run `npm run lint` / `npm run typecheck` in
`frontend/`. Manually load `/app/board/at-risk` in the browser preview against
seeded data to confirm risk pills render with color and the page does not
regress for well-formed records.

## Non-goals

- No backend schema change (`RankingModel` fields stay optional at the DB
  level) and no change to `importRankings()`.
- No change to `AtRiskDecisionKind` values, the decision API, or governance
  business rules.
- No change to `RankingTable`'s own `RISK_CLASS` map (already correct) or to
  the full rankings pages beyond the shared `StatusPill` fix.
- No retroactive cleanup/migration of existing malformed ranking documents —
  this only changes how the UI reacts to them.
