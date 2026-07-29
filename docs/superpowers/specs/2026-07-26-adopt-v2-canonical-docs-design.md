# Adopt v2 Canonical Docs — Design

**Date:** 2026-07-26
**Type:** Documentation-only integration (replace on-main docs with the reviewed v2 set)
**Branch:** `docs/adopt-v2-canonical` → PR to `main`
**Source:** `docs/mangaflow-docs-canonical-v2/` (user-authored v2)

---

## 1. Goal

Make the reviewed **v2** documentation the single canonical doc set on `main`,
replacing the current `docs/business-flows/*`, `docs/DESIGN.md`, `docs/CODE-TODO.md`,
and `docs/review.md` (which landed via PR #62). No application code changes; no
CODE-TODO items implemented.

## 2. Why (audit summary)

v2 was audited against the current on-main docs and the current code. It is a
faithful, higher-level upgrade — not a divergent rewrite:

**Preserved:** FLOW-GAP-01/02/03 + CT-01/02/03 with correct evidence; TECH-FINDING-01…07;
the Accepted-Risk blocks (rate limiting, localStorage tokens); the Material `APPROVED`
"unresolved" conclusion; the *documentation-consistency vs implementation-compliance*
separation. `review.md` is byte-identical (only line endings differed).

**Added, with code evidence:**
- **FLOW-GAP-04 / CT-11** — Admin currently holds workflow/content permissions beyond
  account lifecycle + Chair/EIC designation. Verified against routes
  (`series.controller.ts:280-364`, `admin.routes.ts:50-54`, `admin.controller.ts:67-198`,
  proposal claim/archive `workflow.service.ts:480-485,518`, `tantou.controller.ts:13-20`,
  `notification.controller.ts:120`). Priority P1, scope L.
- INDEX upgraded to a canonical feature + current-implementation index (roles as
  canonical responsibilities; invariants 15–18 for Admin scope, flag rules, provisional
  tally, and a 📌 board-roster-cap constraint; route catalog annotated by canonical actor).
- Two **open verification points** (Assistant `START_DRAFT` owner-or-assignee guard; the
  five-user active Board cap) correctly held as *not-yet* FLOW-GAPs pending code evidence.

**Accepted trade-off:** v2 carries ~72 fewer inline `file:line` references than the
on-main INDEX (some invariants/tables dropped their inline refs). The Gap Register keeps
full evidence, including richer evidence for FLOW-GAP-04. Taken as-is; inline refs are not
re-added (respecting v2 as the authored canonical version).

## 3. Changes

1. **Overwrite** with the v2 content (git normalizes CRLF→LF on commit):
   - `docs/business-flows/*.md` (all 15 incl. INDEX)
   - `docs/DESIGN.md`, `docs/CODE-TODO.md`, `docs/review.md`
2. **Move reports** into `docs/reports/`:
   - `ADMIN-SCOPE-UPDATE.md`, `DOCS-QUALITY-UPDATE.md`, `VALIDATION-REPORT.md`
3. **Delete** the wrapper folder `docs/mangaflow-docs-canonical-v2/`.
4. Commit on `docs/adopt-v2-canonical`; open a docs-only PR to `main`.

The existing spec `docs/superpowers/specs/2026-07-26-business-flow-doc-reconstruction-design.md`
and this spec remain; `review.md`'s "current canonical outputs" pointers stay valid
(`docs/business-flows/INDEX.md`, `docs/DESIGN.md`, `docs/CODE-TODO.md`).

## 4. Canonical decision landing on main

Adopting v2 records **FLOW-GAP-04 / CT-11** (reduce Admin to account lifecycle + Chair/EIC
designation) as canonical. This is documentation of a gap only — the application still
grants Admin the broader permissions until CT-11 is implemented. Implementation is **out
of scope** here.

## 5. Verification

**Targeted current-code re-verification (done, base = `main` @ 8b6ad2f):** only the
new/load-bearing claims were re-checked — not all ~72 inline references.
- FLOW-GAP-01/02/03 evidence — confirmed accurate earlier this session on this base
  (`studio.controller.ts:423-455`, `workflow.service.ts:1397`, `:2931-2941`,
  `voting.controller.ts:245`, `studio.controller.ts:133-149,483-495`).
- FLOW-GAP-04 claim — confirmed accurate: Admin genuinely holds the cited permissions
  (`series.controller.ts:282,330`, `admin.routes.ts:50-54`, `notification.controller.ts:120`,
  `tantou.controller.ts:13-20`). **One evidence ref corrected**: proposal claim/archive was
  cited as `workflow.service.ts:710,736,1158` (handler patch lines) → corrected to
  `:480-485,518` (the actual `assertProposalAction` guards) in v2 INDEX and CODE-TODO.

**Structural verification (at execution):**
- `review.md` content unchanged vs current main (confirmed identical).
- Relative Markdown links resolve within `docs/` after the move (report links, Gap-Register
  → CODE-TODO/DESIGN anchors).
- No `.mangaflow-storage` or other unrelated files staged; `docs/reports/` is the only new
  path; wrapper folder fully removed.
- Finding IDs reconcile: FLOW-GAP-01/02/03/04, TECH-FINDING-01…07, CT-01…11 each defined
  once and referenced consistently.

## 6. Out of scope

Any application-code change; implementing CT-01/02/03/11 or any TECH-FINDING; re-adding the
dropped inline code references; altering v2's authored wording.

## 7. Governing rule (authority)

- **v2 wins on canonical wording and structure** — where v2 and the previous on-main docs
  differ in phrasing, layout, or canonical framing, v2 is authoritative (that is the point of
  the replacement).
- **But current-code claims must remain accurate against the base commit** (`main` @ 8b6ad2f).
  Any statement about what the code does today must match the code; if a claim or its
  `file:line` evidence is wrong, the evidence is corrected to reality (as done for the
  FLOW-GAP-04 proposal-action ref) — v2's canonical *decision* is never bent to match a code
  bug, and a code claim is never left inaccurate to preserve v2's wording.
- Re-verification was **targeted** (new/load-bearing claims only), not exhaustive over all
  ~72 inline references; a full sweep remains an optional follow-up.
