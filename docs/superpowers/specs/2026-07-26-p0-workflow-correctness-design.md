# P0 Workflow Correctness (CT-01/02/03) — Design

**Date:** 2026-07-26
**Type:** Application-code fix (backend), TDD
**Branch:** `fix/p0-workflow-correctness` (from `main` @ 8b6ad2f) → one PR, three commits
**Canonical source:** `docs/CODE-TODO.md` (CT-01/02/03), `docs/business-flows/*`

---

## 1. Goal

Fix the three P0 record-level workflow-correctness defects so the code matches the
canonical business rules. Scope is exactly CT-01/02/03 — no P1/P2 work, no structural
refactors. Each fix is a small, root-cause change with focused tests.

## 2. Decisions

- **CT-01:** a non-Tantou attempting `isBlocking = true` is **rejected 403**
  (`TANTOU_ASSIGNMENT_REQUIRED`) — not silently downgraded.
- **Delivery:** one branch and one PR. The branch already contains the design-spec
  commit `6adf45b`; implementation follows as exactly **three green commits**, one for
  each of CT-01, CT-02 and CT-03. Each implementation commit contains **test +
  root-cause fix + directly affected documentation**. No separate red-state commit.
  TDD loop per commit: write test → run and confirm expected failure → implement →
  run focused tests → run relevant regression tests → commit green.
- Fix at the shared guard/service (root cause), not per caller.

## 3. CT-01 — Restrict blocking-comment authority to the assigned Tantou

**Source:** FLOW-GAP-01. **Files:** `backend/src/controllers/studio.controller.ts`.

**Current (confirmed):** `createComment` (`:423-439`) writes `isBlocking` straight from
the request body behind only `assertCanReadCommentTarget`; `patchComment` (`:441-455`)
lists `isBlocking` in `allowedFields`, so any author may raise their own comment to
blocking. Chapter detection (`workflow.service.ts:1375-1401`) counts any `isBlocking`
comment regardless of `authorRole`.

**Change:**
- Add a guard `assertCanRaiseBlockingComment(req, target)`: resolve the target's Series
  (reuse `resolveCommentSeries`, `:88-106`) and require
  `actor.role === "EDITOR" && series?.editorId === actor.id`; else throw
  `403 TANTOU_ASSIGNMENT_REQUIRED`.
- `createComment`: if `body.isBlocking` **or** legacy `body.blocking` is truthy, call the
  guard before creating; non-blocking comments are unaffected (any otherwise-authorized
  actor may create a non-blocking comment — the route still applies role and target-access
  guards).
- `patchComment`: call the guard only when the patch transitions the comment from
  non-blocking to blocking (`patch.isBlocking === true` and the stored comment is not
  already blocking); lowering/other edits are unaffected.

**Detection decision:** `findChapterBlockingComments` remains unchanged. The write guard
prevents new unauthorized blocking comments from being persisted through the supported
create/patch paths. This change does **not** automatically repair historical records that
were persisted before the guard existed. Before marking CT-01 complete for an existing
environment, inspect existing effective blocking comments (`isBlocking === true` or legacy
`blocking === true`) and handle invalid legacy records separately. Do **not** change
detection to require the author's current Tantou assignment, because a legitimate blocking
comment must remain valid after Tantou reassignment.

**Tests (new):**
- Non-Tantou (Mangaka/Assistant) `POST /api/comments` with `isBlocking:true` → 403
  `TANTOU_ASSIGNMENT_REQUIRED`.
- Assigned Tantou creates a blocking comment on their Series → 201, `isBlocking:true`.
- Any otherwise-authorized actor creates a non-blocking comment → 201.
- Author `PATCH` non-blocking → blocking while not the assigned Tantou → 403.
- A rejected non-Tantou create/raise attempt does not persist or produce a new Chapter
  blocker.
- Existing directly seeded legacy blockers remain detectable; historical-data remediation
  is explicitly separate from the authorization fix.

## 4. CT-02 — VotingSession cancel restores the Proposal

**Source:** FLOW-GAP-02. **Files:** `backend/src/services/workflow.service.ts`
(`cancelVotingSession`, `:2931-2941`).

**Current (confirmed):** sets the session to `CANCELLED` only; the Proposal stays in
`BOARD_REVIEW` (set by `createVotingSession`, `voting.controller.ts:245`) with no active
session — an orphan state.

**Change:** run inside `runWorkflowTransaction`, **fail closed** — cancel only when the
whole invariant holds:
1. Guard: only sessions in `OPEN` or `TIE_BREAK_REQUIRED` may be cancelled; else
   `409 INVALID_TRANSITION`. (Chair-only guard already present via
   `requireBoardChairActor`.)
2. Load the Proposal via `session.proposalId` using the same transaction session. Require
   the Proposal to exist and have status `BOARD_REVIEW`.
   - Missing Proposal or an unexpected Proposal status → `409 INVALID_TRANSITION`.
   - Do **not** cancel the VotingSession when this invariant fails.
3. Set the VotingSession to `CANCELLED` (`cancelledAt = now`) and the Proposal to
   `PENDING_BOARD` in the same transaction. Leave the frozen ProposalVersion and all prior
   `ProposalVote` records untouched (retained for audit; they do not count toward a future
   session).
4. Audit entry as today.

**Tests (new):**
- Cancel an `OPEN` session whose Proposal is `BOARD_REVIEW` → session `CANCELLED` **and**
  Proposal `PENDING_BOARD`; prior votes still present.
- Cancelling a `FINALIZED` session → 409 `INVALID_TRANSITION`.
- Cancelling an active session whose linked Proposal is missing or is not `BOARD_REVIEW`
  → 409 and the VotingSession remains unchanged (not cancelled).
- After a successful cancellation, a fresh VotingSession may be created for the Proposal
  and starts without counting votes from the cancelled session (verifies the real effect
  of "votes do not count toward a future session", not just their presence in the DB).

## 5. CT-03 — Enforce assigned-Tantou on comment resolve/reopen

**Source:** FLOW-GAP-03. **Files:** `backend/src/controllers/studio.controller.ts`.

**Current (confirmed):** `assertEditorCanManageComment` (`:133-149`) enforces the assigned
Tantou **only when `series.editorId` is set** — if unset, any EDITOR may resolve/reopen.
`reopenComment` (`:483-495`) has no source-status precondition.

**Caller audit first (required before changing behavior):** `assertEditorCanManageComment`
is a shared helper. Enumerate every caller before tightening it.
- If it is used **only** by the resolve/reopen paths → tighten it in place.
- If it is shared with an action having different canonical authorization → **split** it
  into action-specific guards rather than changing unrelated behavior.

**Change:**
- Introduce action-specific guards (canonical names) — `assertCanResolveTantouBlockingComment`
  and `assertCanReopenTantouBlockingComment` — which may share an internal resolver but each
  carry their own preconditions. Each requires the Series to exist, `series.editorId` to be
  set, and `series.editorId === actor.id`; otherwise `403 TANTOU_ASSIGNMENT_REQUIRED`.
  (Keeps the existing `EDITOR` role and Tantou-blocking-comment checks.)
- `reopenComment`: additionally require the comment's current status ∈
  {`ADDRESSED`,`RESOLVED`}; otherwise `409 INVALID_TRANSITION`.

**Error-code check:** verify `TANTOU_ASSIGNMENT_REQUIRED` already exists in the error
typing/envelope. If it does not, adding it is in scope for CT-01/03 (do not defer to
CT-06's broader taxonomy work).

**Tests (new):**
- EDITOR who is not the assigned Tantou (or Series has no `editorId`) → 403 on
  resolve/reopen.
- Assigned Tantou resolves a Tantou blocking comment → 200 (`RESOLVED`).
- Reopen from `OPEN` → 409; reopen from `RESOLVED` by the assigned Tantou → 200
  (`REOPENED`).

## 6. Testing & regression

- TDD per commit: write the failing test, implement, run to green, commit.
- **Regression sweep:** existing suites may rely on the old permissive behavior (creating
  blocking comments without Tantou assignment; resolving without an assigned editor). The
  plan will grep the suites (`backend/src/__tests__/`) for such setups and update them to
  the new canonical behavior (e.g. set `series.editorId`, author blocking comments as the
  assigned Tantou). Updating these tests is intentional and in scope.
- Run the repository's canonical backend test command as defined by the current package
  scripts. Record the exact command and result in the PR. The final full backend suite
  must pass before the PR is opened.

## 7. Documentation synchronization

Each CT implementation commit also updates **only** the documentation directly affected by
that CT (this is synchronizing current-state docs after fixing a canonical gap, not scope
creep):
- mark the corresponding CODE-TODO item as implemented;
- preserve the stable FLOW-GAP ID for traceability, but mark it resolved;
- replace obsolete "Current implementation" statements with the newly implemented behavior;
- update the implementation-compliance matrix.

Do **not** remove FLOW-GAP IDs or rewrite unrelated documentation.

| Commit | Minimum docs to update |
|--------|------------------------|
| CT-01 | `docs/business-flows/12-comments.md`, `04-chapter-workflow.md`, `INDEX.md`, `docs/CODE-TODO.md` |
| CT-02 | `docs/business-flows/02-proposal-lifecycle.md`, `06-board-governance.md`, `INDEX.md`, `docs/CODE-TODO.md` |
| CT-03 | `docs/business-flows/12-comments.md`, `INDEX.md`, `docs/CODE-TODO.md` |

Each commit stays self-contained: test + implementation + status docs for exactly that CT.

> **Base note:** these doc updates apply to the docs on `main`. If the v2-adoption PR (#64)
> merges first, re-target the same edits onto the merged v2 docs; the CT/FLOW-GAP IDs and
> the compliance matrix exist in both, so the same synchronization applies.

## 8. Error codes

Reuse existing where present; `TANTOU_ASSIGNMENT_REQUIRED` (canonical, used by CT-01/03)
and `INVALID_TRANSITION` (already in use). No new envelope or framework.

## 9. Out of scope

CT-04..11 (P1/P2/P3); any structural refactor (`workflow.service.ts` / `models.ts`
decomposition); error-taxonomy standardization (CT-06); frontend changes. The broader
`isTantouBlockingComment`/detection rework is deliberately avoided — the write gate makes
it unnecessary for correctness.

## 10. Assumptions

- `VotingSession.proposalId` is single (confirmed: P0 one-proposal-per-session,
  `voting.controller.ts:151-158`).
- `resolveCommentSeries` returns the Series doc carrying `editorId` (confirmed `:88-106`).
- `runWorkflowTransaction` is the existing transaction helper used by submission/board
  flows.
