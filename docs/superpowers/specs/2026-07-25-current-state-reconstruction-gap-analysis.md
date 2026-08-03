# Current-State System Reconstruction and Gap Analysis

**System:** Manga Creation Workflow & Publishing Management (internal course project)
**Date:** 2026-07-25 · **Analyzed checkout:** branch `fix/backend-hardening-review-findings` @ `672cce6`
**Status of this document:** Canonical current-state report. It absorbs and broadens the earlier
`docs/superpowers/specs/2026-07-25-manga-workflow-reconstruction.md` (unchanged, kept for the exhaustive
per-action transition tables); this file is the authoritative reference.

**Reading guide.** The codebase is the source of truth. Findings are tagged and kept separate:
- **[C] Confirmed** — read directly from code (file:line).
- **[Intent]** — inferred project intent from `BUSINESS_FLOW.md` / `PRODUCT.md` / `DESIGN.md` / `README.md`; not a code fact.
- **[Gap]** — missing or conflicting logic in code.
- **[Rec]** — recommended future behaviour (not implemented).

---

## Executive summary (for BA / lecturers)

The system runs a manga from **proposal → editorial screening → board approval → studio production → editorial chapter review → publication**, with reader-vote **rankings** feeding at-risk decisions and assistant **earnings** accruing on approved work. The backend is a well-structured Express/Mongoose API with **explicit state machines**, audit trails, optimistic concurrency, and **175 passing tests across 14 files**. The frontend is a React + TanStack Router app organized by actor (9 feature modules) talking to the backend through a single centralized API contract file.

**Demo-readiness: mostly ready, with three concrete blockers/holes:**
1. **Ranking import from the UI is broken** — the client sends a `csvData` field that the backend's strict schema rejects with `400` [Gap, §7.3].
2. **Series cancellation has no UI** and, until the approved Q1 fix lands, no backend action either [Gap, §5/§9].
3. **Assistant earnings are zero via the UI** because the create-task form never sends a rate [Gap, §7.5].

None of these are architectural; all are small, localized fixes. Overall the project is coherent and demonstrable once the ranking-import and earnings-rate gaps are addressed.

---

## 1. Project purpose, business problem, users, scope

**Purpose [Intent + C].** Coordinate the end-to-end lifecycle of a serialized manga inside an editorial department: pitch, approve, produce, review, publish, and monitor performance. Confirmed by the entity model and workflow services; `PRODUCT.md`/`BUSINESS_FLOW.md` describe the same intent.

**Users [C]** (`types.ts:3`): `MANGAKA`, `ASSISTANT`, `EDITOR` (Tantou), `BOARD` (with `isChair`), and `ADMIN`.

**Current scope [C]:** proposal intake + editor screening + board voting/approval; auto series creation; chapter/page/region/task production; assistant submission + Mangaka review; consolidated editor chapter review; publication scheduling/publish; reader-vote import + at-risk flagging; assistant earnings + admin payroll; notifications, audit, file access; AI bubble detect/whiten.

**Out of scope [C]:** public reader site / live reader voting (only *import*), automated rank computation, a real rate/payment engine, multi-proposal voting sessions (blocked, `voting.controller.ts:151`).

## 2. Architecture, structure, tech stack, dependencies

**Tech stack [C].** Backend: Node ESM, Express 5, Mongoose 9 / MongoDB, Zod 4, JWT (`jsonwebtoken` + `bcryptjs`), vitest + supertest + mongodb-memory-server. Frontend: React + TanStack Router (file-based routes), TanStack Query, Vite. Also `mobile/`, `ai-service/` (Python), `supabase/` (present, not wired into the core flow [Gap/Unknown]).

**Backend layering [C]** (`backend/src`): `routes/*` (HTTP + role guards) → `controllers/*` (I/O + Zod validation) → `services/*` (business logic) → `db/models.ts` (25 Mongoose schemas) + `domain/*` (ids, roles) + `validators/*` (Zod). Cross-cutting: `lib/http.ts` (envelope, `AppError`, `asyncRoute`), `middleware/auth.ts`, `services/audit.service.ts`, `services/outbox.service.ts`. The state-machine core is `services/workflow.service.ts`.

**Frontend structure [C].** `src/features/{admin,assistant,board,dashboard,editor,mangaka,notifications,proposals,series}` (9 actor-aligned modules), each typically with an `api/` (Query hooks) + components. Routing is file-based under `src/routes/app.<actor>.*.tsx` (e.g. `app.board.sessions.$sid.tsx`, `app.editor.chapters.$chapterId.review.tsx`). The **entire** backend contract lives in `src/shared/api/services.ts` (448 lines) via a single `apiRequest` client (`src/shared/api/client.ts`).

**Module dependencies [C].** Clean top-down (routes→controllers→services→models); services depend on models and each other (`workflow.service` imports `audit`, `authorization`). No cycles observed. Frontend features depend only on `shared/api/services.ts` for I/O — a clean, single choke-point (**centralised, but potentially monolithic**: one 448-line file is the whole API surface, so it will keep growing and is a natural split candidate).

## 3. Actors, responsibilities, permissions, ownership, visibility

Auth is JWT bearer; all `/api/*` except auth + file-token is behind `requireAuth` (`routes/index.ts:30`). Guard primitives: `requireRole` (no ADMIN auto-grant, `middleware/auth.ts:18`); `requireExactRole`/`requireExactBoardChair` are **aliases** of the base guards (`middleware/auth.ts:29`); `canMutate` grants ADMIN a service-layer bypass (`domain/roles.ts:37`) — an inconsistency (§10).

| Actor | Responsibilities [C] | Ownership / visibility [C] |
|---|---|---|
| **Mangaka** | Create/submit/edit/withdraw/resubmit proposals; run studio production (create regions/tasks — MANGAKA-only, `studio.routes.ts:36,43`); review assistant submissions (`submission.routes.ts:26-28`); send chapter to editor review (`studio.routes.ts:29`). | Own proposals only (`canReadProposal`, `authorization.service.ts:40`); own series (`canReadSeries:79`); blocked from archiving/unpublishing public series (`series.controller.ts:327`). |
| **Assistant** | Start/submit/reopen assigned tasks (`submission.routes.ts:21-22`); comment; view own earnings (`admin.routes.ts:62`). | Assigned tasks only (`assertTaskReadable`, `workflow.service.ts:127`); production scope = assigned tasks/membership (`productionScopeFilter:168`). |
| **Editor (Tantou)** | Claim/screen proposals → request-changes/forward/reject (`workflow.service.ts:493-518`); review consolidated chapters (`series.routes.ts:80`); annotate (comments, `studio.routes.ts:56`); schedule/publish. | Non-DRAFT proposals (`authorization.service.ts:41`); chapter actions require being the **assigned** series editor (`assertAssignedSeriesEditor:121`); cannot review own authored chapter (`workflow.service.ts:1760`). |
| **Board** | Vote in open sessions (`mobile.routes.ts:29`); import rankings (BOARD/ADMIN); at-risk decisions; **Chair** opens/closes/cancels sessions (`voting.routes.ts:22-25`). | Board-visible proposal statuses only (`authorization.service.ts:15`); all series read; **no** production scope (`:170`). |
| **Admin** | Users, payroll, materials, demo reset, audited overrides — all `requireRole("ADMIN")` (`admin.routes.ts`). | Full read/mutate; but **route guards exclude ADMIN** from many production mutation routes (`requireExactRole` without ADMIN) — see §10. |

## 4. Implemented modules, features, APIs, frontend–backend flows

**Backend API surface [C]** (by router): auth (`auth.routes`), bootstrap/dashboard, proposals (+ `/actions/:action`), voting-sessions + board aliases (`mobile.routes`), series/chapters/pages (+ `/actions/:action`), studio regions/tasks/comments, submissions, materials, notifications + rankings, tantou (series editor), admin, ai, file-token. Full route→guard matrix in the earlier reconstruction doc §3.

**Frontend contract [C]** — `src/shared/api/services.ts` groups: `bootstrapApi`, `proposalsApi`, `seriesApi`, `studioApi`, `assistantApi`, `materialsApi`, `filesApi`, `boardApi`, `adminApi`, `assistantEarningsApi`, `notificationsApi`, `assistantAiApi`. Each maps 1:1 to backend routes via `apiRequest`. Actor pages (`src/routes/app.<actor>.*`) call these.

**Contract findings [C]:**
- `seriesApi.action` accepts only `"archive" | "unpublish" | "start_production"` (`services.ts:250`) — **no `cancel`**. The approved Q1 CANCEL backend action has **no UI path** yet. **[Gap]**
- `boardApi` uses **both** board mechanisms: canonical `/voting-sessions/*` (`services.ts:349-364`) **and** the `/board/series/:id/votes|tie-break|at-risk-decisions` aliases (`:366-372`). The duplication is **load-bearing** — removing the aliases breaks the UI. **[Legacy but in-use]**
- `studioApi.createTask` / `CreateTaskRequest` (`services.ts:51`) collects **no** `rateSnapshot`/`quantity`/`workUnitType`. UI-created tasks therefore default to rate 0 → **zero earnings**. **[Gap — see §7.5]**
- `assistantApi.editorApprove` is a **client-side reject stub** (`services.ts:302`, dead); `assistantApi.requestRevision` (`:298`) calls the **Mangaka-only** `/submissions/:id/request-revision` — misleading namespace. `assistantAiApi.*` (`:429`) calls **EDITOR/MANGAKA-guarded** AI endpoints — an assistant caller would 403. **[Inconsistent patterns]**

## 5. AS-IS business workflows (confirmed)

Summarized here; the exhaustive per-action tables are in the earlier reconstruction doc §4/§6.

1. **Proposal → board approval.** `DRAFT →(SUBMIT)→ PENDING_EDITOR →(CLAIM, Editor)→ EDITOR_REVIEWING →(FORWARD)→ PENDING_BOARD`. Chair opens a `VotingSession` (`voting.controller.ts:144`), which freezes a `ProposalVersion` and sets proposal `→ BOARD_REVIEW`. Board members `VOTE`; quorum = `configuredBoardQuorum()` and ties create a fresh re-vote. Chair `closeVotingSession` → `APPROVED` + `BoardDecision` + auto **Series** creation. Direct forcing removed.
2. **Series & chapter production.** Series `PRE_PRODUCTION →(START_PRODUCTION, requires APPROVED proposal)→ ONGOING` (`series.controller.ts:314`). Chapters `PLANNED →(START_DRAFT)→ IN_PRODUCTION`.
3. **Page & region tasks.** Pages embedded in Chapter; Mangaka creates regions/tasks (MANGAKA-only). `START` locks the region.
4. **Assistant submission → Mangaka review.** `POST /tasks/:id/submit` (idempotency key + `expectedCurrentSubmissionId`, cross-entity scope guard `:564`) → `Submission PENDING`, task `SUBMITTED`. Mangaka `approve|reject|request-revision` (`submissionDecision:2959`, self-approval blocked); approve accrues an `Earning`. **Editor no longer reviews individual submissions** (deprecated `410`).
5. **Editorial chapter review.** Mangaka `send-editor-review` (all gates: pages uploaded, tasks/submissions MANGAKA_APPROVED, materials ACTIVE, no blocking comments — `sendChapterToEditorReview:1419`) → `TANTOU_REVIEW` + frozen snapshot. Assigned Editor `EDITOR_APPROVE → READY_FOR_PUBLICATION` or `REQUEST_REVISION/REJECT → REVISION_REQUIRED`.
6. **Reader-vote import → ranking.** `POST /rankings/import` (BOARD/ADMIN) upserts `Ranking` per `(period, seriesId)`; `finalScore` is pass-through, `atRisk = finalScore < 5`; `rank/movement` never computed. **[Gap, §7.3]**
7. **Publication scheduling.** Chapter `READY_FOR_PUBLICATION` → `SCHEDULE` (future date, series `publicationType` set) creates `Publication SCHEDULED`; chapter stays READY; `PUBLISH` (when due) → `PUBLISHED`.
8. **Cancellation / plan change.** `UNPUBLISH → HIATUS`, `ARCHIVE → ARCHIVED` (`series.controller.ts:334`); cadence changed via `patchSeries`. **No `CANCEL`/`COMPLETE` action** though guards reference those statuses. **[Gap — approved Q1 fix pending]**

## 6. Core entities, relationships, required fields, statuses, transitions

25 Mongoose collections (`db/models.ts`). Core graph: `Proposal 1—1 Series` (`sourceProposalId`, unique) → `Chapter` (`seriesId`, unique `(seriesId,number)`) → embedded `Page` + `StudioRegion`/`StudioTask` → `Submission` (`taskId`, `currentSubmissionId`). `Proposal → ProposalVote` via `VotingSession → BoardDecision`. `Series → Ranking` (`period,seriesId`). Task/Submission → `Earning`/`EarningItem`. `Series *—* User` via `SeriesMember` (canonical) / `assistantIds` (deprecated).

**Canonical statuses + enum enforcement [C]** (`types.ts` + schema enums):

| Entity | Statuses (canonical) | Schema enum? |
|---|---|---|
| Proposal | DRAFT, PENDING_EDITOR, EDITOR_REVIEWING, CHANGES_REQUESTED, PENDING_BOARD, BOARD_REVIEW, APPROVED, REJECTED, WITHDRAWN, ARCHIVED (+ legacy SUBMITTED/RESUBMITTED/READY_FOR_BOARD/BOARD_VOTING/TIE_BREAK) | **No enum** (`models.ts:329`) |
| VotingSession | OPEN, NO_QUORUM, TIE_BREAK_REQUIRED, FINALIZED, CANCELLED (schema default DRAFT) | **No enum** (`:1127`) |
| Series | PLANNING, PRE_PRODUCTION, ONGOING, HIATUS, ARCHIVED (CANCELLED/COMPLETED referenced, unreachable) | **No enum** (`:454`) |
| Chapter | PLANNED, IN_PRODUCTION, TANTOU_REVIEW, REVISION_REQUIRED, READY_FOR_PUBLICATION, PUBLISHED | **Enum** (`:561`) ✓; follows parent Series lifecycle |
| Page | PENDING_UPLOAD, UPLOADED, FINALIZED; Chapter owns all Tantou review/revision state | No enum (embedded) |
| Task | TODO, IN_PROGRESS, SUBMITTED, REVISION_REQUESTED, MANGAKA_APPROVED, REJECTED, CANCELLED (+ legacy) | **Enum** (`:759`) ✓ |
| Submission | PENDING, MANGAKA_APPROVED, REVISION_REQUESTED, SUPERSEDED, REJECTED (+ legacy) | **Enum** (`:943`) ✓ |
| Publication | DRAFT, SCHEDULED, PUBLISHED, CANCELLED | **Enum** (`:619`) ✓ |

Full transition tables: earlier reconstruction doc §6. Required-field note [Gap]: loose schemas (`strict:false`, `models.ts:27`) mean business-critical fields (Series.title, Chapter.title, Proposal.title/authorId) are **not** `required`.

## 7. Validations, gates, notifications, rankings, earnings, publishing

**7.1 Validation & concurrency [C].** Zod per resource (`validators/*`) via `parseBody` (`safeParse`, throws 400) + `rejectProtectedFields`. Optimistic concurrency (`expectedVersion`, `expectedCurrentSubmissionId`), idempotency keys + `requestFingerprint`, Mongo transactions (`runWorkflowTransaction:1349`). Unique constraints: chapter `(seriesId,number)`, series `sourceProposalId`, publication `chapterId`, earningItem `taskId`, one active VotingSession per proposal.

**7.2 Approval gates [C].** Proposal approval only via VotingSession finalize; editor can't review own chapter; Mangaka can't approve own submission; chapter→review gated on full completion; quorum floor ≥ 2.

**7.3 Rankings [Gap — definitive].** Traced end to end: UI `ranking-import-page.tsx:88` sends `{ csvData, period, source, fileName, rows }` → `rankings.mutations.ts:40 boardApi.importRankings` → `services.ts:374 POST /rankings/import` (body unchanged) → `notification.controller.ts:122 parseBody(rankingImportSchema)` → `validators/common.ts` `schema.safeParse(req.body)` (no key stripping) → `rankingImportSchema` is **`.strict()`** (`notification.controller.ts:31`) with keys `{period, source, fileName?, rows}` and **no `csvData`**. Zod `.strict()` rejects unknown keys, so `parseBody` throws **`400 VALIDATION_ERROR`**. No backend code/test ever sends `csvData` (confirmed), so the suite is green while the **live UI import always fails**. Separately, `rank/previousRank/movement` are never computed (import is pass-through, `notification.controller.ts:164`).

**7.4 Notifications [C].** `Notification` collection; per-user list/read/archive (`notification.controller.ts:33-72`, owner-or-admin guard). Workflow steps push notifications (`notifyMany`) to authors/board (e.g. `workflow.service.ts:837`). Admin can broadcast (`/admin/notifications`). Audience types USER/ROLE/ALL exist but broadcast fan-out is basic. **[Partial]**

**7.5 Earnings [Gap].** Pipeline is correct: `createTask` stores `rateSnapshot`/`quantity`/`estimatedAmount` (`studio.controller.ts:255`); on Mangaka approval an `Earning` accrues `amount = quantity × rateSnapshot` (`workflow.service.ts:3090`, `computeEstimatedAmount:1281`); payroll reads `EarningModel` (`admin.service.ts:246`). **But** the create-task UI never sends a rate (§4), and `rateSnapshot` defaults to 0 → earnings are 0. The alternate `resolveTaskRate()`→0 / `createEarningItemIfMissing` path is **dead code** (no callers). Approved Q4 fix: default rate + remove dead stub.

**7.6 Publishing [C].** `Publication` per chapter (unique); SCHEDULE→PUBLISH gated on future date + due time + series publicationType. Scheduling is not a chapter status (`types.ts:105`). Confirmed working.

## 8. Code-quality assessment

- **Large files / god-module [C]:** `services/workflow.service.ts` is **~3200 lines** handling proposal + chapter + task + submission + voting + publication + earnings. Prime split-by-aggregate candidate.
- **Centralised-but-monolithic contract [C]:** `src/shared/api/services.ts` (448 lines) is the single API surface — clean choke-point, but will keep growing; splitting per feature is advisable.
- **Duplication / legacy [C]:** two board-vote paths (VotingSession vs `/board/series/*` aliases vs deprecated embedded `proposal.votes`); `SeriesMember` vs `assistantIds`; dual comment fields (`body`/`text`, `isBlocking`/`blocking`); legacy status values across Task/Submission/Proposal; duplicate `/admin/workflow-overrides` + `/admin/override` (`admin.routes.ts:58-59`).
- **Dead code [C]:** `resolveTaskRate` + `createEarningItemIfMissing` (`workflow.service.ts:329-386`, no callers); `assistantApi.editorApprove` client stub.
- **Weak validation / integrity [C]:** `strict:false` loose schemas; no enums + few `required` on Series/Proposal/VotingSession; pervasive `mongoose.model<any>`.
- **Inconsistent patterns [C]:** ADMIN excluded at route layer but bypassed at service layer; misleading API namespaces (`assistantApi.requestRevision`, `assistantAiApi`).
- **Test coverage [C]:** backend strong — **175 tests / 14 files** (`backend/src/__tests__/*`), real integration via mongodb-memory-server. Frontend — **zero unit/component tests** (repo-wide `git ls-files` shows no `src/**/*.test.*`); only `tests/e2e-role-flows.spec.ts` (Playwright) and `tests/boundaries.test.tsx`, with `test:e2e` (Playwright) the only runnable test script. This is the single biggest quality gap.

## 9. Implementation matrix

Status set: Complete / Partial / Missing / Conflicting / Legacy / Extra / Unknown.

| Feature | Expected purpose | Implementation (file:function) | Status |
|---|---|---|---|
| Proposal intake & editor screening | Mangaka pitch → editor triage | `workflow.service.ts:599 applyProposalAction` | Complete |
| Board voting + quorum + tie-break | Approve/reject with quorum | `voting.controller.ts:144`; `workflow.service.ts:388,893,2737` | Complete |
| Auto series creation on approval | Approved proposal → series | `workflow.service.ts:202` | Complete |
| Chapter/task/submission production | Studio production loop | `workflow.service.ts:1682,2098,2244,2959` | Complete |
| Consolidated editor chapter review | Editor approves chapter | `workflow.service.ts:1419` | Complete |
| Publication scheduling & publish | Schedule + publish chapters | `workflow.service.ts:1836,1903` | Complete |
| Reader-vote import (UI) | Board imports CSV rankings | `ranking-import-page.tsx:88` → `notification.controller.ts:120` | **Conflicting** (400 on `csvData`) |
| Ranking computation (rank/movement) | Rank ordering + trend | *none* | Missing |
| Series cancellation | Stop a series | `series.controller.ts:334` (HIATUS/ARCHIVE only) | Missing (CANCEL) / Partial |
| Assistant earnings (UI→payout) | Non-zero monthly earnings | pipeline `workflow.service.ts:3090`; UI omits rate | Partial |
| Notifications | Inform actors of steps | `notification.controller.ts`; `notifyMany` | Partial (basic broadcast) |
| Role authorization & ownership | Enforce roles/ownership | `middleware/auth.ts`, `authorization.service.ts` | Complete |
| Board vote mobile aliases | Mobile/legacy vote path | `mobile.routes.ts:27-32` (used by web `services.ts:366`) | Legacy (in use) |
| AI bubble detect/whiten | Assist page cleanup | `ai.routes.ts` | Extra |
| `resolveTaskRate`/`createEarningItemIfMissing` | (rate stub) | `workflow.service.ts:329-386` | Legacy/dead |
| `supabase/` | (unclear) | `supabase/` | Unknown |
| Frontend unit tests | Component/logic safety | *none* | Missing |

## 10. Business & technical gaps

**Business [Gap]:** (1) ranking import broken from UI; (2) no series CANCEL/COMPLETE; (3) earnings zero via UI; (4) rank/movement not computed; (5) publication-plan change is ad-hoc `patchSeries`, not gated.

**Technical [Gap]:** (1) no-enum/loose schemas on Series/Proposal/VotingSession; (2) `workflow.service.ts` god-module; (3) ADMIN route-vs-service authority inconsistency; (4) hardcoded board `eligibleVoterIds` (`voting.controller.ts:231`); (5) zero frontend tests; (6) dead code + dual mechanisms + misleading namespaces.

## 11. Product-owner questions & unconfirmable assumptions

Approved decisions from the earlier session are recorded in the reconstruction doc §11 (Q1 CANCEL + Q4 earnings = must-fix; Q5 board voters = optional). Remaining items needing PO confirmation:
1. Is the ranking-import contract meant to send parsed `rows` only (drop `csvData` client-side), or should the backend accept + parse raw `csvData`? **[Gap — must resolve for demo]**
2. Should `rank`/`movement` be computed on import or stay import-only? **[Assumption: import-only]**
3. Is `patchSeries` the intended cadence-change mechanism, or should it be Board-gated? **[Assumption: patchSeries]**
4. Is ADMIN meant to be a production superuser, or intentionally limited to `/admin/override`? **[Cannot confirm from code — conflicting signals]**
5. Are `dueAt`/`reviewDueAt` display-only or should they drive alerts? **[Assumption: display-only]**
6. Is `supabase/` a live dependency or leftover scaffolding? **[Unknown]**

## 12. Prioritised improvements

**Required for correct business behaviour (demo blockers):**
- Fix ranking import contract — drop `csvData` from the client body (or relax/parse it server-side). One-line client change is the minimal fix. **[§7.3]**
- Series **CANCEL** action + UI wiring (approved Q1). **[§5]**
- Non-zero earnings — default `rateSnapshot` (approved Q4) and/or add a rate field to the create-task form. **[§7.5]**

**Recommended for maintainability:**
- Add enums + key `required` fields to Series/Proposal/VotingSession.
- Split `workflow.service.ts` by aggregate; consider splitting `services.ts` per feature.
- Remove dead code (`resolveTaskRate`, `createEarningItemIfMissing`, `editorApprove` stub); reconcile ADMIN route/service authority; rename misleading API namespaces.
- Derive board `eligibleVoterIds` from active BOARD users (approved Q5, optional).

**Optional:**
- Compute `rank`/`movement`; richer notification broadcast; consolidate the two board-vote paths behind one client method.

**Out of scope for a course project:**
- Rate/payment engine; enterprise auth/security hardening (covered separately); reader-facing site / live voting; horizontal-scale infra.

## 13. Demo-readiness & overall assessment

**Overall:** a coherent, well-architected internal project with strong backend rigor (explicit state machines, guards, audit, 175 passing tests) and a clean actor-aligned frontend. The main risks are a handful of localized gaps, not structural flaws.

**Demo-readiness checklist:**
- ✅ Proposal → board approval → series creation → production → chapter review → publish: **works end-to-end** (backend confirmed by tests).
- ✅ Role authorization, ownership, visibility: **enforced**.
- ⚠️ **Ranking import (UI): broken** — fix the `csvData` contract before demoing rankings. **[blocker if demoed]**
- ⚠️ **Series cancellation: not available** until Q1 lands (+UI). **[blocker if demoed]**
- ⚠️ **Assistant earnings: show 0** via UI until Q4 lands (+rate field). **[blocker if demoed]**
- ➖ Frontend has no unit tests — acceptable for a course demo, but note it.

**Verdict:** demo-ready for the core creation→publication spine today; the three ⚠️ items are small, well-understood fixes (two already planned as Q1/Q4) that make rankings, cancellation, and earnings demonstrable.

---

*Separation recap:* **[C]** = confirmed in code (cited); **[Intent]** = inferred from project docs; **[Gap]** = missing/conflicting in code; **[Rec]** = recommended, not implemented. This document does not modify code and proposes no implementation plan.
