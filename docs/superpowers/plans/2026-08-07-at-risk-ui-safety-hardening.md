# At-risk Reviews UI Safety Hardening Implementation Plan

> **Superseded:** not being implemented — see
> `2026-08-07-at-risk-reviews-feature-hide.md` and its design doc, which hide
> the At-risk Reviews feature from the UI instead of hardening its
> rendering. Kept for historical reference only.

**Goal:** Make the Board "At-risk Reviews" screen degrade safely when a
flagged ranking is incomplete — hide it from the table/stat counts instead of
risking a crash or misleading render — and fix the confirmed `StatusPill`
risk-level styling defect found during audit.

**Architecture:** All changes are frontend-only, isolated to the at-risk
adapter/components and the shared `StatusPill`. No backend, schema, or type
contract changes.

**Tech Stack:** React, TypeScript, TanStack Query, Vite, tsx (`*.check.ts`
scripts), ESLint, `tsc --noEmit`.

## Global Constraints

- Do not modify the backend (`RankingModel` schema, `importRankings()`,
  ranking controllers/services).
- Do not modify `AtRiskDecisionKind`, the decision API, or governance rules.
- Do not modify `RankingTable`'s existing `RISK_CLASS` palette.
- Records excluded by the new renderability guard must be hidden, not shown
  as broken/blank rows — no thrown errors, no `NaN`/`Invalid Date` text
  reaching the Chair.
- Do not touch unrelated dirty files (`frontend/src/routeTree.gen.ts`).

---

### Task 1: Add an at-risk record renderability guard

**Files:**

- Modify: `frontend/src/features/board/at-risk/model/at-risk-review-adapter.ts`
- Modify: `frontend/src/features/board/at-risk/components/at-risk-reviews-page.tsx`
- Test: `frontend/src/features/board/at-risk/model/at-risk-review-adapter.check.ts` (create)
- Modify: `frontend/package.json`

**Interfaces:**

- Consumes: `SeriesRanking` from `@/entities/series`.
- Produces: `isAtRiskReviewRenderable(ranking: SeriesRanking): boolean`,
  exported alongside `isRankingAtRisk`.

- [ ] **Step 1: Write the failing check script**

Create `at-risk-review-adapter.check.ts` with `expectEqual`-style assertions
(mirror `frontend/src/features/board/vote/model/revote-banner.check.ts`)
covering: a complete at-risk ranking is renderable; a ranking missing
`seriesId` is not; a ranking with no finite `finalScore`/`readerScore` is not;
a ranking with `atRisk: false` is never renderable.

- [ ] **Step 2: Run it and verify it fails**

```powershell
cd frontend
npx tsx src/features/board/at-risk/model/at-risk-review-adapter.check.ts
```

Expected: FAIL (`isAtRiskReviewRenderable` does not exist yet).

- [ ] **Step 3: Implement the guard**

Add `isAtRiskReviewRenderable` to `at-risk-review-adapter.ts`: require a
non-empty `seriesId` and `seriesTitle`, and `Number.isFinite(ranking.finalScore)
|| Number.isFinite(ranking.readerScore)`. Keep `isRankingAtRisk` unchanged
(it stays the pure `atRisk === true` check); the new guard is a second,
separate filter.

- [ ] **Step 4: Use the guard in the page**

In `at-risk-reviews-page.tsx`, chain
`.filter(isRankingAtRisk).filter(isAtRiskReviewRenderable).map(mapRankingToAtRiskReview)`
so excluded rankings never reach the table, stat counts, or decision panel.

- [ ] **Step 5: Run the check script and lint/typecheck**

```powershell
npx tsx src/features/board/at-risk/model/at-risk-review-adapter.check.ts
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Wire the script into package.json**

Add a `"test:at-risk-adapter"` script next to `test:revote-banner`, same
`tsx` invocation pattern.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/features/board/at-risk/model/at-risk-review-adapter.ts frontend/src/features/board/at-risk/model/at-risk-review-adapter.check.ts frontend/src/features/board/at-risk/components/at-risk-reviews-page.tsx frontend/package.json
git commit -m "fix: hide incomplete at-risk rankings from the Board review queue"
```

### Task 2: Guard numeric formatting in PerformanceSnapshot

**Files:**

- Modify: `frontend/src/features/board/at-risk/components/performance-snapshot.tsx`

**Interfaces:**

- Consumes: `AtRiskReview.finalScore`, `.readerScore`, `.voteCount` (typed as
  numbers, but not runtime-guaranteed — see spec).
- Produces: the same metrics, rendering `"—"` instead of throwing when a
  value is not a finite number.

- [ ] **Step 1: Implement the guard**

Wrap each metric value with a small local helper (e.g.
`formatScore(value: number | undefined) => Number.isFinite(value) ?
value!.toFixed(1) : "—"`) so `.toFixed()`/`.toLocaleString()` are never
called on a non-finite value. Since Task 1 already screens out records with
no finite score, this is defense-in-depth for the one remaining optional
field (`voteCount`) and for any future caller of this component.

- [ ] **Step 2: Manual verification**

Load `/app/board/at-risk` in the browser preview; confirm metrics render
unchanged for existing seeded/mock data.

- [ ] **Step 3: Lint/typecheck**

```powershell
cd frontend
npm run lint
npm run typecheck
```

- [ ] **Step 4: Commit**

```powershell
git add frontend/src/features/board/at-risk/components/performance-snapshot.tsx
git commit -m "fix: guard non-finite score/vote values in at-risk performance snapshot"
```

### Task 3: Give RiskLevel its own StatusPill styling

**Files:**

- Modify: `frontend/src/shared/ui/status-pill.tsx`
- Modify: `frontend/src/features/board/at-risk/components/at-risk-reviews-page.tsx`

**Interfaces:**

- Consumes: `RiskLevel` (`"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"`).
- Produces: `StatusPill` renders a distinct, on-system tone for each risk
  level instead of falling back to the generic muted pill.

- [ ] **Step 1: Add risk-level entries**

Add `low`, `medium`, `high`, `critical` keys to both `VARIANTS` and `LABELS`
in `status-pill.tsx`, reusing the existing semantic tokens (e.g. `high`/
`critical` -> `DANGER` or `ATTENTION`, `medium` -> `WARNING`, `low` ->
`SUCCESS` or `NEUTRAL`) so the palette stays on-system per the file's own
comment convention.

- [ ] **Step 2: Simplify the call site**

In `at-risk-reviews-page.tsx`, replace
`<StatusPill status={review.risk === "CRITICAL" ? "at_risk" : review.risk} />`
with `<StatusPill status={review.risk} />` now that every `RiskLevel` value
has a native mapping.

- [ ] **Step 3: Manual verification**

Load `/app/board/at-risk`; confirm HIGH/CRITICAL rows show distinct,
legible-colored pills (not gray).

- [ ] **Step 4: Lint/typecheck**

```powershell
cd frontend
npm run lint
npm run typecheck
```

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/shared/ui/status-pill.tsx frontend/src/features/board/at-risk/components/at-risk-reviews-page.tsx
git commit -m "fix: give at-risk RiskLevel values their own StatusPill styling"
```

### Task 4: Guard decidedAt rendering in AtRiskDecisionPanel

**Files:**

- Modify: `frontend/src/features/board/at-risk/components/at-risk-decision-panel.tsx`

**Interfaces:**

- Consumes: `AtRiskReview.decidedAt` (`string | undefined`, not
  runtime-validated as a parseable date).
- Produces: the "Recorded at" row only renders when `decidedAt` parses to a
  valid `Date`; otherwise the row is omitted (consistent with how the panel
  already omits `decisionReason`/`decidedByName` when absent).

- [ ] **Step 1: Implement the guard**

Replace the unconditional `review.decidedAt ? (...) : null` block with a
check that also verifies `!Number.isNaN(new Date(review.decidedAt).getTime())`
before rendering the formatted date.

- [ ] **Step 2: Manual verification**

Load `/app/board/at-risk`, select a decided review, confirm "Recorded at"
still renders correctly for valid data.

- [ ] **Step 3: Lint/typecheck**

```powershell
cd frontend
npm run lint
npm run typecheck
```

- [ ] **Step 4: Commit**

```powershell
git add frontend/src/features/board/at-risk/components/at-risk-decision-panel.tsx
git commit -m "fix: guard invalid decidedAt dates in at-risk decision panel"
```

### Task 5: Whole-change verification

**Files:**

- Test: `frontend/src/features/board/at-risk/model/at-risk-review-adapter.check.ts`

- [ ] **Step 1: Run the new check script**

```powershell
cd frontend
npm run test:at-risk-adapter
```

- [ ] **Step 2: Run full lint/typecheck**

```powershell
npm run lint
npm run typecheck
```

- [ ] **Step 3: Manual smoke test in the browser preview**

Open `/app/board/at-risk`: confirm the stat cards, table, and decision panel
render for existing data, risk pills show color, and no console errors
appear.

- [ ] **Step 4: Confirm only scoped files changed**

```powershell
git status --short
```

The existing unrelated dirty file (`frontend/src/routeTree.gen.ts`) must
remain untouched by these commits.
