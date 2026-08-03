# CODE-TODO — Implementation Backlog

Prioritised, implementation-ready backlog derived from the Phase 1 business-flow
review and the Phase 2 architecture pass. **Every item traces to a finding ID with
code evidence** — no speculative entries.

- **Source of truth:** [Gap Register](business-flows/INDEX.md#workflow-gap-register)
  (`FLOW-GAP-*` = current code ≠ canonical business rule; `TECH-FINDING-*` = general
  technical debt, no business-rule conflict).
- **Priority:** P0 security/business-correctness · P1 data-integrity/reliability ·
  P2 maintainability/performance · P3 cleanup/quality.
- **Scope:** S / M / L (effort class, not calendar time).
- **Scope discipline:** documentation-only; no application code changed here.
  Accepted risks and unconfirmed candidates are listed separately and are **not**
  actionable TODOs.

| ID | Source | Title | Priority | Scope | Status |
|----|--------|-------|----------|-------|--------|
| CT-01 | FLOW-GAP-01 | Restrict blocking-comment authority to assigned Tantou | P0 | M | Done |
| CT-02 | FLOW-GAP-02 | Voting-session cancel restores Proposal to `PENDING_BOARD` | P0 | S | Done |
| CT-03 | FLOW-GAP-03 | Enforce assigned-Tantou on comment resolve/reopen (+ reopen precondition) | P0 (P1 sub) | S | Done |
| CT-04 | TECH-FINDING-07 | Schedule the outbox processor | P1 | M | Done |
| CT-05 | TECH-FINDING-05 | Emit `CURRENT_SUBMISSION_CONFLICT` instead of generic `CONFLICT` | P2 | S | Done |
| CT-06 | TECH-FINDING-06 | Standardise ownership error codes (not generic `FORBIDDEN`) | P2 | M | Done |
| CT-07 | TECH-FINDING-01 | Remove legacy `blocking` field | P3 | S | Done |
| CT-08 | TECH-FINDING-02 | Remove dead `FIXED` comment status | P3 | S | Done |
| CT-09 | TECH-FINDING-03 | Migrate Region `RELEASED` lock value to `UNLOCKED` | P3 | S | Done |
| CT-10 | TECH-FINDING-04 | Drop deprecated decision aliases from `TASK_ACTIONS` | P3 | S | Done |
| CT-11 | FLOW-GAP-04 | Reduce Admin to account lifecycle and Board Chair designation management | P1 | L | Done |
| CT-12 | TECH-FINDING-08 | Add Admin-owned RateTable and immutable task price snapshots | P0 | M | Done |
| CT-13 | FLOW-GAP-05 | Enforce unique active Chair and Board seat cap | P0 | M | Done |
| CT-14 | FLOW-GAP-06 | Snapshot active Board electorate instead of seed IDs | P0 | S | Done |
| CT-15 | FLOW-GAP-07 | Remove `MARK_READY` review bypass | P0 | S | Done |
| CT-16 | FLOW-GAP-08 | Separate Page mutation from Tantou approval and require blocker verification | P0 | M | Done |
| CT-17 | TECH-FINDING-09 | Consolidate canonical docs and deprecate root legacy references | P1 | S | Done |

## Current implementation update (2026-07-28)

CT-13 through CT-17 are implemented. User designation changes are transactional
and protected by partial unique indexes; Board sessions snapshot the current
three-to-five-member active roster; `MARK_READY` and manual `POST /series` are
removed; Chapter/Page content belongs to the owning Mangaka; and Tantou approval
requires blocking comments to be `RESOLVED`. The canonical entry point is now
`docs/business-flows/INDEX.md`.

## Current implementation update (2026-07-26)

CT-04, CT-05, CT-06, and CT-09 are implemented in the current branch. The runtime
outbox runner lives in `backend/src/jobs/outbox-runner.ts`, ownership/concurrency
codes are enforced at their record-level guards, and region release writes the
canonical `UNLOCKED` state. CT-07, CT-08, and CT-10 are now implemented; the
canonical comment migration must be run against the deployed database before rollout.

## Current ownership update (2026-07-27)

Workflow seams are now aligned with the bounded-context services:
`proposal-governance.service.ts` owns VotingSession finalization/cancellation;
`chapter-readiness.service.ts` and `chapter-review.service.ts` own chapter
readiness/review; `task-submission.service.ts` owns Task → Submission commands;
`publication.service.ts` owns publication commands; and `earning.service.ts`
owns earning persistence/outbox. Existing line-number references in historical
finding narratives are retained for audit traceability and are not current
ownership claims. CT-11 is implemented: Admin's workflow/content routes are
removed or restricted (fix/ct11-admin-scope branch), leaving account
lifecycle, Board Chair designation, RateTable, managed notifications, and
read-only dashboards. The narrow `MANAGE_RATE_TABLE` capability is an explicit current-MVP
exception and is not payroll access. CT-12 is implemented with server-side rate
resolution, immutable task snapshots, Admin-only writes, overlap validation, and
regression coverage. Production rate amounts remain an operational Admin
configuration step; supplied migrations remain unapplied to production by design.

---

## A. Canonical Workflow Debt (from `FLOW-GAP-*`)

### CT-01 — Restrict blocking-comment authority to the assigned Tantou
- **Source:** FLOW-GAP-01 · **Priority:** P0 · **Scope:** M · **Status:** Implemented
- **Problem:** `createComment` writes `isBlocking` straight from the request body
  behind only a read-access guard; `patchComment` lists `isBlocking` in `allowedFields`
  so any author may raise their own comment to blocking; chapter detection counts any
  blocking comment regardless of `authorRole`. A Mangaka or Assistant can therefore
  block chapter review, and such a comment has no Tantou resolution path (orphan
  blocker).
- **Impact:** Non-editors can halt the chapter review gate; unresolvable blockers can
  stall production. Record-level authorization defect.
- **Evidence / affected:** `backend/src/controllers/studio.controller.ts:423-455`
  (`createComment`, `patchComment` `allowedFields:448`);
  `backend/src/services/workflow.service.ts:1375-1401` (`findChapterBlockingComments`);
  `studio.controller.ts:108-113` (`isTantouBlockingComment` keys on
  `authorRole === "EDITOR"`).
- **Required change:** add `assertCanRaiseBlockingComment` (actor is the assigned
  Tantou of the related Series) and enforce it on create and on any
  non-blocking→blocking patch; base "is a blocking comment" classification on that
  guard, not on `authorRole`.
- **Acceptance criteria:** a Mangaka/Assistant `POST /api/comments` (or PATCH) with
  `isBlocking:true` is rejected (403) or persisted as non-blocking; an assigned-Tantou
  blocking comment still blocks; a non-Tantou comment never appears in
  `findChapterBlockingComments`.
- **Required tests:** authorization test — non-Tantou cannot create/raise a blocking
  comment; workflow test — chapter review gate ignores non-Tantou `isBlocking`.
- **Dependencies:** none (pairs naturally with CT-03).

### CT-02 — Voting-session cancel restores the Proposal
- **Source:** FLOW-GAP-02 · **Priority:** P0 · **Scope:** S · **Status:** Done/Implemented
- **Problem:** `cancelVotingSession` set the session to `CANCELLED` but never touched
  the Proposal, leaving the orphan state `Proposal = BOARD_REVIEW` with no active
  session (`createVotingSession` set it to `BOARD_REVIEW`).
- **Impact:** Proposal stuck in a review state with no active voting; editorial control
  cannot resume; violates the "no orphan workflow state" invariant.
- **Evidence / affected:** `backend/src/services/workflow.service.ts` (`cancelVotingSession`);
  `backend/src/controllers/voting.controller.ts:245`.
- **Implemented change:** `cancelVotingSession` now runs inside `runWorkflowTransaction`
  and fails closed (409 `INVALID_TRANSITION`) unless the session is `OPEN`/
  `TIE_BREAK_REQUIRED` and the linked Proposal is `BOARD_REVIEW`. On success it sets
  `Proposal.status = PENDING_BOARD`; the frozen ProposalVersion stays immutable and
  prior votes are retained for audit only (they do not count toward a future session).
- **Acceptance criteria:** after cancel, the session is `CANCELLED` **and** the
  Proposal is `PENDING_BOARD`; a new vote requires a new session record; the frozen
  version is unchanged.
- **Tests:** `backend/src/__tests__/voting-cancel.test.ts` — cancel transitions Proposal
  to `PENDING_BOARD` and keeps votes; cancel fails closed (409) when the Proposal is
  not `BOARD_REVIEW`; a fresh session after cancel does not see the cancelled session's
  votes.
- **Dependencies:** none.

### CT-03 — Enforce assigned-Tantou on comment resolve/reopen
- **Source:** FLOW-GAP-03 · **Priority:** P0 (assignment bypass) + P1 (reopen
  precondition) · **Scope:** S · **Status:** Implemented
- **Previous problem (resolved):** `assertEditorCanManageComment` enforced the assigned Tantou **only when
  `series.editorId` is set** — if unset, any EDITOR may resolve/reopen a blocking
  comment. `reopenComment` has no precondition that the comment was previously
  `ADDRESSED`/`RESOLVED`.
- **Impact (P0):** an unassigned Editor can alter another Series' chapter review gate
  by resolving/reopening its blocking comments — a record-level authorization defect.
  (P1) reopen can move a comment from an invalid state.
- **Evidence / affected:** `backend/src/controllers/studio.controller.ts:133-174`
  (`assertTantouManagesBlockingComment` and action-specific guards), `:505,531`
  (`resolveComment`, `reopenComment`).
- **Implemented change:** action-specific guards reject resolve/reopen when
  `series.editorId` is unset or does not match the actor, returning
  `TANTOU_ASSIGNMENT_REQUIRED`; `reopen` additionally requires current status ∈
  {`ADDRESSED`,`RESOLVED`} and returns `INVALID_TRANSITION` otherwise.
- **Acceptance criteria:** met — a non-assigned Editor gets 403 on resolve/reopen;
  reopen from `OPEN` is rejected; the assigned Tantou path still works.
- **Tests:** `backend/src/__tests__/comment-authority.test.ts` covers unassigned and
  unconfigured Series guards plus the valid resolve/reopen transition.
- **Dependencies:** shares the comment-authority surface with CT-01.

---

### CT-11 — Reduce Admin to minimal account administration
- **Source:** FLOW-GAP-04 · **Priority:** P1 · **Scope:** L · **Status:** Implemented
- **Problem (resolved):** Admin previously had broader Proposal, Series, Material,
  Ranking, file, notification, payroll and workflow access than the canonical
  account-lifecycle role.
- **Implemented change:**
  - **Deleted** admin-only routes + handlers: `/admin/materials*`, `/admin/payroll*`,
    `/admin/workflow-overrides`, `/admin/override`.
  - **Demo tooling** (`/admin/demo/reset`, `/admin/demo/clear`) is mounted only when
    `NODE_ENV !== "production"` (404 in prod), with a handler-level environment
    guard as a backstop.
  - **Rankings import** (`POST /rankings/import`): `ADMIN` removed → `BOARD` only.
  - **Tantou assign/remove** (`/series/:id/editor`): `ADMIN` and general `BOARD`
    moved to the owning Mangaka.
  - **Series lifecycle** (`series.controller.ts` `seriesLifecycleAction`): `ADMIN`
    removed; enforces the per-action matrix — `START_PRODUCTION` owning Mangaka or
    assigned Tantou; `UNPUBLISH` assigned-Tantou-only; `ARCHIVE` owner-or-assigned-Tantou
    while the Series has never been public, assigned-Tantou-only once published;
    `DELETE` owning-Mangaka-only.
  - **Proposal `RELEASE_CLAIM`** (`assertProposalAction`): only the claiming Editor.
  - **Proposal `ARCHIVE`**: owning Mangaka only,
    requires a non-empty `reason` and writes an audit entry.
  - **File presign-download**: `ADMIN` removed from the role list → resource
    owner/member/reviewer scope only (`EDITOR, MANGAKA, ASSISTANT, BOARD` per the
    resource's scope check).
  - **Kept unchanged:** `/admin/users*` (list/get/create/update/deactivate/guarded
    delete, incl. Board Chair designation via `updateUser`), `/admin/notifications*`,
    `GET /admin/workflow-summary`, `GET /admin/storage-summary`, `/admin/rates*`
    (`MANAGE_RATE_TABLE`).
  - **Frontend:** removed `app.admin.materials.tsx`, `app.admin.payroll.tsx`,
    `app.admin.workflows.tsx`, `app.admin.series.tsx`, `app.admin.audit.tsx` and
    their nav entries/API client functions; kept dashboard, users, rates,
    notifications.
- **Acceptance criteria:** met — Admin gets `403 FORBIDDEN` on rankings-import,
  tantou-assign, series lifecycle, and proposal claim actions; `404` on the
deleted admin-only routes and on demo routes in a production-like env; Board Chair
  retain their role-specific actions; designation uniqueness/incompatibility rules
  remain enforced (unchanged).
- **Evidence:** `backend/src/routes/{admin,tantou,series,notification,proposal}.routes.ts`,
  `backend/src/controllers/series.controller.ts:270-384`,
  `backend/src/services/workflow.service.ts:138-191` (`assertProposalAction`).
- **Tests:** backend full suite 276/276; `admin.test.ts` and
  `authorization-perimeter.test.ts` assert the deleted routes 404 and the
  affected actions return 403 for Admin; Postman contract parity 137/138 OK
  (`scripts/verify-postman-contract.mjs`).
- **Dependencies:** none remaining.

## B. General Technical Debt (from `TECH-FINDING-*`)

### CT-04 — Schedule the outbox processor
- **Source:** TECH-FINDING-07 · **Priority:** P1 · **Scope:** M · **Status:** Done
- **Problem (resolved):** `processOutboxBatch` now runs through a production server
  runner, so queued `OutboxEvent` rows do not accumulate solely because the app is
  running without a test harness.
- **Impact:** notifications/side-effects modelled as outbox events are never delivered;
  reliability gap.
- **Evidence / affected:** `backend/src/jobs/outbox-runner.ts`,
  `backend/src/services/outbox-delivery.service.ts`, and `backend/src/server.ts`.
- **Implemented change:** the server owns a single-flight interval runner with bounded
  `OUTBOX_BATCH_SIZE`, `OUTBOX_MAX_ATTEMPTS`, and `OUTBOX_INTERVAL_MS` settings. The
  delivery handler is isolated in `outbox-delivery.service.ts`; notification writes
  are idempotent per event and recipient. Shutdown stops the runner before MongoDB
  disconnects.
- **Acceptance criteria:** met — queued events are processed by the running server;
  retry/dead-letter behavior remains in `processOutboxBatch`.
- **Tests:** `backend/src/__tests__/outbox-runner.test.ts` covers runner delivery,
  idempotent retry, and notification creation; the existing P0 suite covers the
  dead-letter failure path.
- **Dependencies:** none remaining.

### CT-05 — Precise submission-conflict error code
- **Source:** TECH-FINDING-05 · **Priority:** P2 · **Scope:** S · **Status:** Done
- **Problem (resolved):** the stale-current-submission check now emits the canonical
  `CURRENT_SUBMISSION_CONFLICT`, so clients can distinguish it from other 409s.
- **Impact:** weaker client error handling; error-taxonomy inconsistency.
- **Evidence / affected:** `backend/src/services/workflow.service.ts:2291`.
- **Implemented change:** the stale `expectedCurrentSubmissionId` guard throws
  `CURRENT_SUBMISSION_CONFLICT` (HTTP 409) while preserving the existing message.
- **Acceptance criteria:** met — stale submit returns 409 `CURRENT_SUBMISSION_CONFLICT`.
- **Tests:** `p0-workflow-refactor.test.ts` asserts the exact code.
- **Dependencies:** none.

### CT-06 — Standardise ownership error codes
- **Source:** TECH-FINDING-06 · **Priority:** P2 · **Scope:** M · **Status:** Done
- **Problem (resolved):** the affected ownership/assignment failures now use the
  canonical specific codes (`MANGAKA_OWNER_REQUIRED`, `TANTOU_ASSIGNMENT_REQUIRED`,
  `TASK_NOT_ASSIGNED`) instead of an undifferentiated `FORBIDDEN`.
- **Impact:** ownership failures are indistinguishable from generic role denials;
  weaker auditability and client UX.
- **Evidence / affected:** `backend/src/services/workflow.service.ts:1692` (chapter
  action pre-check), `:2973` (submission review); comment guards
  `backend/src/controllers/studio.controller.ts:121,125,129,136,143,147`.
- **Implemented change:** chapter actions, task mutation/submission review, and
  Mangaka comment addressing return specific ownership codes. Pure role/type denials
  remain `FORBIDDEN`.
- **Acceptance criteria:** met — focused perimeter tests assert the specific codes.
- **Tests:** `authorization-perimeter.test.ts` covers Tantou, Mangaka chapter, and
  cross-owner submission failures.
- **Dependencies:** none.

### CT-07 — Remove legacy `blocking` field
- **Source:** TECH-FINDING-01 · **Priority:** P3 · **Scope:** S · **Status:** Done
- **Problem (resolved):** `StudioComment` previously exposed `blocking` alongside
  canonical `isBlocking`.
- **Implemented change:** schema, validators, controllers, workflow queries, seed
  data, and web/mobile API contracts now use only `isBlocking`. The idempotent
  `migrate:canonical-comments` command copies `blocking:true` to `isBlocking:true`
  and removes the legacy field.
- **Acceptance criteria:** met — runtime detection uses only `isBlocking`; canonical
  clients no longer send or read `blocking`.
- **Operational step:** run `npm run migrate:canonical-comments -- --apply` before
  deploying the schema cleanup.

### CT-08 — Remove dead `FIXED` comment status
- **Source:** TECH-FINDING-02 · **Priority:** P3 · **Scope:** S · **Status:** Done
- **Problem (resolved):** `FIXED` was an enumerated status with no canonical
  transition.
- **Implemented change:** backend schema/validators and web/mobile status contracts
  now use only `OPEN`, `ADDRESSED`, `RESOLVED`, and `REOPENED`. The migration maps
  stored `FIXED` records to `ADDRESSED`.
- **Acceptance criteria:** met after the migration; no runtime endpoint accepts or
  writes `FIXED`.
- **Operational step:** run the canonical comment migration and verify its dry-run
  count reaches zero on the deployed database.

### CT-09 — Migrate Region `RELEASED` lock value to `UNLOCKED`
- **Source:** TECH-FINDING-03 · **Priority:** P3 · **Scope:** S · **Status:** Done
- **Problem (resolved):** `lockStatus` previously used a third value `RELEASED` that
  was functionally equivalent to re-assignable.
- **Impact:** a redundant lock state complicates the region lifecycle.
- **Evidence / affected:** `backend/src/db/models.ts`,
  `backend/src/controllers/studio.controller.ts`,
  `backend/src/services/workflow.service.ts`, and
  `backend/src/scripts/migrate-region-lock-status.ts`.
- **Implemented change:** the schema/type and all release paths now use the binary
  `UNLOCKED`/`LOCKED` model; release history remains in audit data. Existing stored
  `RELEASED` values are converted by the idempotent migration script.
- **Acceptance criteria:** met — enum is `UNLOCKED`/`LOCKED`; release paths set
  `UNLOCKED`; one-active-task-per-region still holds.
- **Tests:** `p0-workflow-refactor.test.ts` verifies cancellation releases to
  `UNLOCKED` and clears the active task.
- **Operational step:** run `npm run migrate:region-lock-status -- --apply` once
  against the deployed database before rollout.

### CT-10 — Drop deprecated decision aliases from `TASK_ACTIONS`
- **Source:** TECH-FINDING-04 · **Priority:** P3 · **Scope:** S · **Status:** Done
- **Problem (resolved):** task action validation exposed decision aliases that were
  already rejected by runtime workflow logic.
- **Implemented change:** `TASK_ACTIONS` now contains only genuine task lifecycle
  actions. Submission review and chapter review keep their separate canonical
  endpoints/contracts.
- **Acceptance criteria:** met — alias requests return `400 INVALID_ACTION` before
  workflow execution; canonical Submission/Chapter endpoints remain available.
- **Tests:** `p0-workflow-refactor.test.ts` covers all five removed aliases.

---

## C. Accepted Risks (not actionable)

Deliberately accepted for the current course-project/internal scope. **No CODE-TODO,
no TECH-FINDING ID.** Full write-ups in [DESIGN.md §13](DESIGN.md). Implemented
security controls are documented separately and are not listed as accepted risks.

### Accepted Risk — Tokens stored in `localStorage`
- **Current state:** frontend persists access + refresh tokens in `localStorage`
  (`src/shared/api/client.ts:94,115`); not secure storage.
- **Risk:** a successful XSS could read the persisted tokens.
- **Reason accepted:** avoids an authentication redesign out of scope for a course
  project. httpOnly refresh-cookie + CSRF is a **non-implemented** future alternative.
- **Revisit trigger:** public deployment; sensitive real-user data; third-party
  scripts; higher security-assurance requirements.
- **Mapping:** none (accepted).

### Implemented control — Authentication rate limiting
- **Current state:** login and refresh use the configurable per-IP
  `authRateLimit` middleware (`AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`) and
  return `429 RATE_LIMITED` with `Retry-After` when exhausted.
- **Evidence:** `backend/src/middleware/rate-limit.ts`, `backend/src/routes/auth.routes.ts`,
  and `backend/src/__tests__/rate-limit.test.ts`.
- **Deployment note:** the in-memory bucket store is single-process. A Redis/shared
  store is required before horizontal scaling; this is an operational hardening
  follow-up, not a workflow correctness gap.

## D. Resolved follow-up findings

### Supporting Material simplification
- **Resolved:** Material is now a status-free optional attachment; no Tantou approval
  or Chapter-readiness gate remains.
- **Authorization:** only the owning Mangaka creates, edits, versions, or deletes;
  Editor and Board access is read-only and parent-scoped.
- **Migration:** `backend/src/scripts/migrate-material-attachments.ts` is dry-run by
  default. Apply removes archived records and strips legacy status fields from retained
  attachments; production migration remains intentionally unrun.

## E. Out of Scope (course project)

Never actionable here — recorded so they are not silently reintroduced: full payroll,
payment gateways, accounting, taxation, contract management, public self-registration,
event sourcing, Kafka/RabbitMQ, microservice decomposition, distributed workflow
engines, enterprise audit/observability infrastructure. "Future enterprise version" is
not a justification to expand this backlog.

---

# Project Status & Compliance

> **Read this first.** *Documentation consistency* (the documents agree with one
> another) is **not** the same as *implementation compliance* (the code satisfies the
> canonical rules). A PASS in §1 does **not** mean the application already complies.
> The three P0 workflow mismatches (FLOW-GAP-01/02/03) are resolved in the current
> application code; the matrix below records the implementation evidence.

## Project status

| Workstream | Status |
|---|---|
| Documentation reconstruction | COMPLETE |
| Canonical business-flow review | COMPLETE |
| Architecture overview | COMPLETE |
| Code improvement backlog | COMPLETE |
| Application-code remediation | COMPLETE — all tracked findings (including CT-11) are implemented |

The three P0 workflow mismatches tracked by CT-01/CT-02/CT-03 are implemented on the
current branch; the compliance matrix below records the evidence and any remaining
technical-debt findings separately.

## 1. Documentation consistency

Whether the documents agree with **one another** (not whether code complies).

| Area | Result | Meaning |
|---|---|---|
| Authorization rules | PASS | Business-flow, INDEX, DESIGN, CODE-TODO describe the same canonical authorization model |
| Transaction boundaries | PASS | Documents agree on which multi-entity operations must be atomic |
| Error-code documentation | PASS | Error names/meanings consistent across docs |
| Workflow state machines | PASS | Statuses/transitions do not contradict across docs |
| Finding traceability | PASS | FLOW-GAP / TECH-FINDING / CT references reconcile (see §7 report) |

A PASS means the documents agree; it does **not** mean the code implements every rule.

## 2. Current implementation compliance

Current **code** vs canonical rules (evidence on the current branch).

| Canonical area | Result | Finding | Current implementation |
|---|---|---|---|
| Blocking-comment write authorization | **PASS (implemented — assigned-Tantou gate on create/patch, `studio.controller.ts`)** | FLOW-GAP-01 / CT-01 | `assertCanRaiseBlockingComment` gates `createComment`/`patchComment` on the assigned Tantou (`studio.controller.ts:151-161,440,471`) |
| VotingSession cancellation | **PASS (implemented — transactional restore to `PENDING_BOARD`, `workflow.service.ts`)** | FLOW-GAP-02 / CT-02 | `cancelVotingSession` runs in `runWorkflowTransaction`, fails closed (409) unless session is active and Proposal is `BOARD_REVIEW`, and restores `Proposal.status = PENDING_BOARD` on success |
| Comment resolve/reopen authorization | **PASS (implemented — strict assigned-Tantou guard + reopen source-status precondition)** | FLOW-GAP-03 / CT-03 | `assertCanResolveTantouBlockingComment` / `assertCanReopenTantouBlockingComment` require `series.editorId === actor.id`; reopen accepts only `ADDRESSED`/`RESOLVED` (`studio.controller.ts`) |
| Supporting Material independence | **PASS (implemented)** | — | Attachments have no status and never gate Chapter review, Tantou replacement, publication, or Board decisions |
| Supporting Material authorization | **PASS (implemented)** | — | Owning Mangaka mutates; Editor/Board are read-only under parent visibility |
| Supporting Material migration | **PASS (script verified; production not run)** | — | `migrate:material-attachments` is dry-run-first, removes archived records, strips retained status fields, and is planner-tested |
| Notification read model | **PASS (implemented; migration not run)** | — | Notifications are unread/read only; `migrate:notification-read-model` removes legacy archived records and cleans the retired field |
| Frontend business-flow contracts | **PASS (implemented)** | — | Proposal and Series UI separate Manuscripts from status-free Supporting Materials |
| Submission decision endpoint canonicalization | **PASS (implemented)** | CT-10 | Generic Task-action decision aliases return `400 INVALID_ACTION`; canonical `/api/submissions/*` endpoints remain available |
| Region locking through revision | PASS | — | Region stays `LOCKED` through revision (`workflow.service.ts:3132-3138`); one active task (`studio.controller.ts:271-311`) |
| Submission concurrency error codes | **PASS (implemented)** | TECH-FINDING-05 / CT-05 | `EXPECTED_CURRENT_SUBMISSION_REQUIRED`, `CURRENT_SUBMISSION_CONFLICT`, and idempotency codes are implemented (`workflow.service.ts:2238-2307`) |
| Chapter submission authority | PASS | — | Owning Mangaka required (`workflow.service.ts:1409,1422`) |
| Admin role boundary | **PASS (implemented — routes deleted/restricted per §A CT-11)** | FLOW-GAP-04 / CT-11 | Admin's materials/payroll/override routes are deleted; rankings-import, tantou assign/remove, series lifecycle, and proposal claim actions no longer accept `ADMIN`; file presign-download is resource-scoped; demo tooling is dev-only. Admin retains users, notifications, dashboards, and RateTable |

FLOW-GAP-01, FLOW-GAP-02, FLOW-GAP-03, and FLOW-GAP-04 are resolved (CT-01/02/03/11
implemented).

Rate-table ownership and task price snapshot are **PASS (TECH-FINDING-08 / CT-12)**:
Admin-only `RateTable` writes, active-window validation, server-side task
resolution, immutable `rateCode`/`rateVersion`/`rateSnapshot`, and focused
regression tests are implemented.

### Current residuals after the 2026-07-27 audit remediation

- Independent Chapter archive has been removed and is covered by an API
  regression test. Before rollout, run `migrate:chapter-status:apply` and
  `migrate:series-visibility:apply` after reviewing both dry runs.
- The dead `EarningItem` helper path was removed. Rate-table configuration is
  now Admin-owned; missing active rates fail task creation with
  `RATE_CONFIGURATION_REQUIRED` instead of silently producing zero.
- Audit schema `before`/`after` fields remain reserved but are not populated by
  the current generic audit helpers.
- `/read/*` is a public reader backed by the unauthenticated Public Reader API
  (`GET /api/public/series[/:slug[/chapters/:chapterNumber]]`), which exposes
  only `PUBLIC` series with `PUBLISHED` chapters. It is a read-only consumer
  surface, separate from the canonical authenticated production workflow.

---

*Derived from `docs/business-flows/` (Phase 1) and `docs/DESIGN.md` (Phase 2). Update
an item's Status as it is implemented; keep the Source ID for traceability.*
