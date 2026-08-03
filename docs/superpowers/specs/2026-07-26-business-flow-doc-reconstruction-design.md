# Business-Flow Documentation Reconstruction — Master Specification

**Date:** 2026-07-26
**Status:** Approved (design); execution pending per-phase approval
**Type:** Documentation-only reconstruction + architecture doc + code-debt backlog
**Source brief:** `docs/review.md`
**Related:** `docs/superpowers/specs/2026-07-25-current-state-reconstruction-gap-analysis.md` (cited, not superseded)

---

## 1. Purpose

Bring the project's workflow documentation into a state that is faithful to the current
codebase, internally consistent across all files, and correct as canonical business design —
without modifying application code. Where the code and the canonical workflow disagree, the
canonical workflow is retained and the divergence is recorded as a tracked gap that feeds an
implementation backlog.

The deliverable set:

1. Corrected, consistent business-flow docs (`docs/business-flows/*` + `INDEX.md`).
2. A concise architecture overview (`docs/DESIGN.md`).
3. A prioritized code-debt backlog (`docs/CODE-TODO.md`).
4. A final verification report.

## 2. Non-negotiable constraints

- **Documentation-only.** No application code is modified. Every code/canonical divergence
  becomes a documented gap, never an edit.
- **Canonical rules are fixed decisions.** The rules prescribed in `docs/review.md` are the
  canonical design. Code inspection determines only whether each rule is *current behaviour*
  or a *required code change*; inspection must never redefine a canonical rule.
- **Evidence-backed.** Every current-behaviour claim cites `file:line`. No unverified claim
  is stated as fact. No backlog item is invented merely because the brief listed it as a
  candidate — it must be supported by code evidence or an explicit canonical decision.
- **Course-project scope.** No enterprise patterns (payroll, payment gateways, accounting,
  event sourcing, microservices, workflow builders, public self-registration). Where the
  brief names such a pattern, it is omitted or filed as an explicit "out of scope for a
  course project" note, not a real TODO. (`docs/review.md` Task 7.)
- **Traceability + debt separation.** Two distinct ID namespaces:
  - `FLOW-GAP-NN` — **only** for verified current-code-versus-canonical-business mismatches
    (behaviour that contradicts a canonical business rule).
  - `TECH-FINDING-NN` — for general technical debt: maintainability, performance, typing,
    logging, CORS, N+1, structure, cleanup — anything with no canonical-rule conflict.

  Every `CODE-TODO` item references exactly one origin: a workflow item references a
  `FLOW-GAP`; a general technical-debt item references a `TECH-FINDING`. Both carry code
  evidence (`file:line`). Workflow debt and general technical debt are presented separately.

## 3. Core mechanism: the three-part conflict block

For every conflict between code and canonical design, docs use this exact structure:

> **Confirmed Current Behavior** — what the code does now, with `file:line`.
> **Canonical Business Decision** — the fixed rule from the brief.
> **Required Code Change** — what must change to reach canonical (→ `FLOW-GAP-NN` → `CODE-TODO` ID).

`FLOW-GAP-NN` IDs are assigned once, in Phase 1, in discovery order, and are stable for the
life of the docs. They are the join key between the business-flow docs and `CODE-TODO.md`.
`TECH-FINDING-NN` IDs (general technical debt, no canonical conflict) are assigned when the
finding is confirmed in code, in discovery order, in the same shared numbering timeline.

---

## Phase 1 — Canonical fixes + cross-document consistency

**Brief coverage:** Tasks 1, 2, 5, 6, 8 (the 8 fixes), Task 6 (global invariants), Task 8
(consistency verification for these areas).

**Method per item:** verify current behaviour in code first (controllers → services →
validators → models → routes), assign a `FLOW-GAP` ID if it diverges, then edit only the
affected docs using the three-part block. Documents that already agree with canonical are
left unchanged (no unrelated rewrites).

### The 8 items

**F1 — Blocking comment detection + write authority.**
Verify *both*: (a) the detection predicate that makes a comment block Chapter review, and
(b) the write-authority guard for creating a comment with `isBlocking = true` or patching a
comment non-blocking → blocking. Canonical: only the assigned Tantou may create or raise a
blocking editorial comment; Mangaka/Assistant cannot block by setting `isBlocking = true`.
Removing the `authorRole === EDITOR` filter is documented as valid **only** when blocking
authority is simultaneously restricted to the assigned Tantou. Canonical blocking-status
rule: blocking while `OPEN`/`REOPENED`; non-blocking after `ADDRESSED`/`RESOLVED`. Legacy
`FIXED` status and the legacy `blocking` field are flagged for removal (as gaps, not doc
deletions). Docs: `12-comments.md`, `04-chapter-workflow.md`, `INDEX.md`.

**F2 — Comment Resolve/Reopen authorization.**
Canonical: Resolve/Reopen restricted to the assigned Tantou (EDITOR role + Tantou of the
related Series + comment is a Tantou blocking comment + read/review access). Mangaka may only
`ADDRESS` a blocking comment on a Chapter/Series they own. Documented with explicit guard
names (`assertCanAddressBlockingComment`, `assertCanResolveTantouBlockingComment`,
`assertCanReopenTantouBlockingComment`) as *canonical guard expectations*, not as claims that
those functions exist. Docs: `12-comments.md`, `INDEX.md`.

**F3 — VotingSession cancellation.**
Verify whether cancelling the only active VotingSession restores `Proposal.status =
PENDING_BOARD` or leaves it orphaned in `BOARD_REVIEW`. Canonical: cancel → session
`CANCELLED`, Proposal → `PENDING_BOARD`, frozen ProposalVersion immutable, prior votes
retained for audit but not counted toward a future session. Invariants documented (≤1 active
session per Proposal; cancelled session cannot receive votes; future session = new record;
votes scoped to their session; no editor recall while an active session exists; Chair must
cancel before editorial control returns). Docs: `02-proposal-lifecycle.md`,
`06-board-governance.md`, `INDEX.md`.

**F4 — Chapter material readiness guard.**
Document the actual accepted-material rule: status `ACTIVE` or `APPROVED` + valid current
version + accessible file + correct scope + non-archived/invalidated version. If `APPROVED`
has no independent approval transition, flag it as a future-removal candidate but keep it in
current-state docs because the code accepts it. Docs: `04-chapter-workflow.md`,
`07-material-management.md`.

**F5 — Task actions vs Submission decisions.**
Retain genuine Task lifecycle actions (`START`, `BLOCK`, `UNBLOCK`, `CANCEL`, `REASSIGN`,
`REOPEN`). Deprecate only Submission-*decision* aliases exposed through the generic Task
action endpoint (`APPROVE`, `MANGAKA_APPROVE`, `REQUEST_REVISION`, `REJECT`) that duplicate
canonical Submission endpoints (`POST /api/submissions/:id/{approve,request-revision,reject}`).
For any alias kept for compatibility: name the canonical endpoint, mark the alias deprecated,
require both to call one shared domain service, add a removal TODO. Pick one canonical
Task-reopen endpoint; document others as aliases. Docs: `05-assistant-submission.md`,
`INDEX.md`.

**F6 — Region locking during revision.**
Verify: when locking begins, the Region status set at Task creation, lock behaviour through
`START`/`SUBMIT`/`REQUEST_REVISION`/`REOPEN`, and whether the `RELEASED` lock value is
current-only or canonical. Canonical: Region locked at Task creation
(`status = ASSIGNED`, `lockStatus = LOCKED`, `activeTaskId` set); stays `LOCKED` through
revision; released only on `APPROVE`/`REJECT`/`CANCEL`; one active Task per Region. Preferred
canonical lock values `UNLOCKED`/`LOCKED`, with historical release living in audit data. Docs:
`05-assistant-submission.md`, `14-regions.md`, `INDEX.md`.

**F7 — Submission error code.**
Verify presence of `EXPECTED_CURRENT_SUBMISSION_REQUIRED` (for a submission request missing
`expectedCurrentSubmissionId`). If absent, mark as a required code change. Document the full
error mapping (idempotency-key required, expected-current-submission required, current-submission
conflict, idempotency-key reused, task-not-assigned, invalid-transition), using existing code
names where they exist and flagging any that do not. Docs: `05-assistant-submission.md`.

**F8 — Ownership errors vs generic FORBIDDEN; Chapter submit authority.**
Differentiate `FORBIDDEN` from explicit ownership/assignment errors (`TASK_NOT_ASSIGNED`,
`MANGAKA_OWNER_REQUIRED`, `TANTOU_ASSIGNMENT_REQUIRED`, `BOARD_CHAIR_REQUIRED`,
`SELF_APPROVAL_BLOCKED`), flagging which exist vs. are required.
Canonical Chapter ownership: only the owning Mangaka may `SUBMIT_REVIEW`/`RESUBMIT` a Chapter;
Assistant works only through Region → Task → Submission. **If current code uses Chapter
`assigneeId` to let an Assistant submit the whole Chapter, this is explicitly classified as a
current-code mismatch (a `FLOW-GAP` + P0 CODE-TODO), not documented as acceptable.** Docs:
`04-chapter-workflow.md`, `05-assistant-submission.md`, `INDEX.md`.

### Cross-document consistency (brief Task 2)

After the 8 edits, reconcile across all 14 docs + `INDEX.md`: actor/role names, role flags,
route names, action names, status names + meanings, transition guards, ownership + Tantou
rules, Board/VotingSession behaviour, Region locking, Task/Submission relationships, Chapter
review readiness, material readiness, comment blocking, deprecated endpoints, error codes,
transaction boundaries, terminal states. `INDEX.md` becomes the canonical overview and states
the 17 global invariants (brief Task 6). No business decision may be updated in one file and
contradicted in another.

### Phase 1 acceptance gate

Stop after Phase 1. Report: (a) changed files; (b) canonical decisions adopted; (c) every
`FLOW-GAP-NN` with its current-behaviour `file:line` evidence and canonical rule; (d)
provisional CODE-TODO candidates (IDs + priority, not yet the full backlog); (e) the
consistency matrix (per-dimension pass/fail); (f) unresolved findings that could not be
confirmed from the repo. **Commit:** one commit for all Phase 1 doc changes. Wait for approval
before Phase 2.

---

## Phase 2 — `docs/DESIGN.md`

**Brief coverage:** Task 3 (17 sections).

New, concise architecture overview. **Pointer-based but self-standing:** each section links to
the owning business-flow file (for transition tables) and cites the reconstruction spec (for
deep inventory), yet states enough architectural context to be read on its own. The
reconstruction spec (`2026-07-25-current-state-reconstruction-gap-analysis.md`) is cited, not
moved or superseded.

Section handling:

- **Original architectural content** (not owned elsewhere): §1 purpose/scope, §2 system-context
  Mermaid, §3 runtime/container Mermaid, §4 frontend architecture, §5 backend bounded areas, §6
  auth-flow sequence diagram, §7 three-layer authorization model + guard examples, §10 API
  conventions, §11 transaction boundaries, §12 file/AI processing, §13 security model
  (implemented vs. gap), §15 deployment/environments, §17 ADR-style decision table.
- **Summary + link** (owned by business-flow docs / reconstruction spec): §8 domain-model
  inventory, §9 state-machine overview, §14 testing strategy, §16 known gaps (which references
  the `FLOW-GAP` list and `CODE-TODO.md` rather than re-listing).

Grounding rules: components the code lacks (outbox/notification provider, audit query API,
rate limiting, etc.) are marked *not implemented*, never described as present. `DESIGN.md` must
not contradict Phase 1 canonical decisions or the global invariants — it inherits them and
cross-links rather than re-deriving. Self-registration is documented as intentionally
unsupported (admin-provisioned), not as a gap.

### Phase 2 acceptance gate

Stop after Phase 2. Report: file created; which sections are original vs. pointer; any new
mismatch surfaced while writing (assigned a new `FLOW-GAP` ID if so). **Commit:** one commit.
Wait for approval before Phase 3.

---

## Phase 3 — `docs/CODE-TODO.md` + final verification report

**Brief coverage:** Task 4 (backlog), Task 8 (final verification), Required Output (report).

Prioritized backlog, groups **P0** (security + business correctness) → **P1** (data integrity +
reliability) → **P2** (maintainability + performance) → **P3** (cleanup + quality). No calendar
estimates.

**Primary input is deterministic:** every Phase 1 `FLOW-GAP` (Required Code Change) becomes a
CODE-TODO item. Each item carries the full template: `ID`, `Title`, `Priority`, `Problem`,
`Business/technical impact`, `Affected files/modules`, `Required change`, `Acceptance criteria`,
`Required tests`, `Dependencies`, `Scope (S/M/L)`, `Status`, plus a **`Source: FLOW-GAP-NN`**
line and **code evidence** (`file:line`).

Seeding:

- **P0** — Phase 1 correctness mismatches (e.g. blocking-comment authority F1/F2, VotingSession
  cancel F3, Assistant chapter-submit F8, ownership-vs-FORBIDDEN F8).
- **P1/P2/P3** — consistency-pass findings sourced from a `FLOW-GAP`, plus general technical
  debt sourced from a `TECH-FINDING` (loose `strict:false` schemas, missing error codes,
  `workflow.service.ts` decomposition, `models.ts` split, legacy `blocking`/`FIXED`/`RELEASED`
  cleanup, CORS, N+1 in dashboard summary) **only where code evidence supports them**.
  Unverified candidates are omitted, not filed.

**Debt separation:** the file presents *canonical workflow debt* (items sourced from a
`FLOW-GAP`) in a section distinct from *general technical debt* (items sourced from a
`TECH-FINDING`, no canonical-rule conflict).

### Final-verification correction rule

If Phase 3 verification finds that an already-approved Phase 1 or Phase 2 document contains a
contradiction, do **not** silently edit it. Instead: report the issue, reopen the owning phase,
propose the minimal correction, and wait for approval before creating a separate correction
commit. Renumbering is never done — a correction that surfaces a new gap appends a higher
`FLOW-GAP`/`TECH-FINDING` number.

**Scope guard:** enterprise items from the brief are omitted or captured under an explicit
"Out of scope for a course project" section, not as actionable TODOs.

**Final verification report** (brief Task 8 + Required Output) is produced only after Phase 3:
files changed, canonical business decisions, current-code mismatches (current/canonical/affected
files/required change/CODE-TODO ref), deprecated routes+actions+statuses+fields+aliases, P0–P3
counts, the consistency checklist (pass/fail per workflow + DESIGN + INDEX + CODE-TODO), and
remaining unresolved risks.

### Phase 3 acceptance gate

**Commit:** one commit for `CODE-TODO.md`. Deliver the final verification report in the same
turn. This closes the project.

---

## 4. File-change map

| Path | Phase | Action |
| --- | --- | --- |
| `docs/business-flows/02-proposal-lifecycle.md` | 1 | Edit if F3 diverges |
| `docs/business-flows/04-chapter-workflow.md` | 1 | Edit (F1, F4, F8) |
| `docs/business-flows/05-assistant-submission.md` | 1 | Edit (F5, F6, F7, F8) |
| `docs/business-flows/06-board-governance.md` | 1 | Edit if F3 diverges |
| `docs/business-flows/07-material-management.md` | 1 | Edit (F4) |
| `docs/business-flows/12-comments.md` | 1 | Edit (F1, F2) |
| `docs/business-flows/14-regions.md` | 1 | Edit (F6) |
| `docs/business-flows/INDEX.md` | 1 | Edit (invariants + canonical overview) |
| Other `docs/business-flows/*.md` | 1 | Edit only if consistency pass finds a contradiction |
| `docs/DESIGN.md` | 2 | Create |
| `docs/CODE-TODO.md` | 3 | Create |

## 5. Acceptance gates (summary)

- **P1 gate:** doc changes committed; FLOW-GAP list with evidence; consistency matrix; report; **stop for approval**.
- **P2 gate:** `DESIGN.md` committed; original-vs-pointer map; new gaps if any; **stop for approval**.
- **P3 gate:** `CODE-TODO.md` committed; final verification report delivered.

Each phase produces one review commit. The next phase begins only after that commit is
approved.

## 6. Out of scope

Payroll/payments/accounting/tax, contract management, public self-registration, workflow
builders, event sourcing, microservices, complex org hierarchies, redundant approval levels,
enterprise infrastructure. Any application-code edit. Rewriting docs that already agree with
canonical.

## 7. Unresolved design assumptions

- **A1 — Repo is the sole source for current behaviour.** No runtime/DB inspection; a claim
  that cannot be confirmed from code is reported as unresolved, never asserted.
- **A2 — `docs/review.md` canonical rules are final.** Should code inspection reveal a
  canonical rule is impossible or contradictory against a hard code constraint, it is raised as
  an unresolved finding for the user, not silently altered.
- **A3 — FLOW-GAP numbering is discovery-ordered in Phase 1** and frozen thereafter; Phase 2/3
  discoveries append higher numbers rather than renumbering.
- **A4 — "Deprecated" in docs is advisory only** — no code annotation, no deprecation headers
  are added (that would be a code change); such headers are filed as CODE-TODO items.
