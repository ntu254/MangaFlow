# Manga Creation Workflow & Publishing Management — Reconstructed Business Workflow

**Date:** 2026-07-25
**Analyzed checkout:** branch `fix/backend-hardening-review-findings` @ `672cce6` (backend hardening fixes applied).
**Method:** Backend is the authoritative source of business rules — verified against `backend/src/db/models.ts` (25 schemas), `backend/src/types.ts` (canonical status unions), `backend/src/services/workflow.service.ts` (state machines), the controllers, and the full route→guard matrix. Frontend (`src/features/*`) traced structurally only. Every rule is cited to `file:line`. Findings are tagged:
- **[C]** Confirmed code behaviour
- **[I]** Incomplete or conflicting logic
- **[L]** Legacy duplication
- **[A]** Assumption requiring product-owner confirmation

Security/infrastructure hardening from the earlier review (rate limiting, CORS, etc.) is out of scope here; authorization is covered only where it affects roles, ownership, visibility, gates, or workflow correctness.

---

## 1. Business problem statement

The system coordinates the lifecycle of a serialized manga from **idea to publication** inside an editorial department. A **Mangaka** pitches a series; a **Tantou (assigned) Editor** screens it; the **Editorial Board** votes to approve and sets a publication cadence. Once approved, the Mangaka runs studio **production** — chapters, pages, region-level tasks — with **Assistants** doing assigned work and submitting it for the Mangaka's approval. The Editor then reviews the consolidated chapter, approves it for publication, and schedules it. Reader-vote **rankings** are imported periodically to flag at-risk series, which the Board can act on (cancel / change plan). The software's job is to enforce the correct order of these steps, the right role at each gate, ownership of records, and consistent status data across the entities.

## 2. Scope & out-of-scope

**In scope (confirmed implemented):**
- Proposal intake → editor screening → Board voting → approval, with audited decisions and version snapshots. [C]
- Automatic Series creation from an approved Proposal. [C]
- Chapter/page production, region + task assignment, assistant submission, Mangaka review, consolidated editor chapter review, publication scheduling & publish. [C]
- Reader-vote/ranking CSV-style import and at-risk flagging. [C]
- Series lifecycle: start production, hiatus (unpublish), archive, delete. [C]
- Assistant earnings accrual + admin payroll (confirm/pay/void). [C, partial — see §5]
- Notifications, audit log, outbox events, file access via signed tokens. [C]
- AI bubble detect/whiten integration (`ai.routes.ts`). [C, adjunct feature]

**Out of scope / not implemented:**
- Real reader-facing site or public reader voting (only *import* of pre-computed scores). [C]
- Automated ranking computation (rank/movement are not calculated — §4.6). [I]
- A real assistant rate/payment engine (rates are stubbed to 0 — §5). [I]
- Multi-proposal voting sessions (explicitly blocked, "P0" — voting.controller.ts:151-157). [C]
- Enterprise auth/security hardening (covered separately).

## 3. Actors, responsibilities, permissions, ownership & visibility

Roles: `ADMIN | MANGAKA | ASSISTANT | EDITOR | BOARD` (`types.ts:3`). Board sub-flag: `isChair` (`types.ts:11`). Tantou is an active Editor membership on a Series. Auth is JWT bearer; every `/api/*` route except auth + file-token is behind `requireAuth` (`routes/index.ts:30`).

**Permission primitives:**
- `requireRole(...roles)` — allows listed roles; **does not** auto-allow ADMIN (`middleware/auth.ts:18`). [C]
- `requireExactRole` / `requireExactBoardChair` — **aliases** of `requireRole`/`requireBoardChair` (`middleware/auth.ts:29`, deduped in this branch). No stricter "exact" semantics. [C][L]
- `canMutate(role, allowed)` — service-layer check that **does** grant ADMIN a blanket bypass (`domain/roles.ts:37`). [C] Note the inconsistency: route guards do not special-case ADMIN, but the workflow service's `requireMutationRole` does.

**Responsibilities & boundaries (confirmed from routes + `authorization.service.ts`):**

| Actor | Can do | Ownership / visibility rule |
|---|---|---|
| **Mangaka** | Create proposals (`proposal.routes.ts:19`), submit/edit/withdraw/resubmit them, run studio production (create regions/tasks — `studio.routes.ts:36,43`, MANGAKA-only), review assistant submissions (`submission.routes.ts:26-28`), send chapter to editor review (`studio.routes.ts:29`, MANGAKA-only), view own rankings. | Sees only own proposals (`canReadProposal` MANGAKA→`authorId===actor.id`, `authorization.service.ts:40`) and own series (`canReadSeries:79`). Cannot archive/unpublish public series (`series.controller.ts:327`). [C] |
| **Assistant** | Start/submit/reopen assigned tasks (`submission.routes.ts:21-22`), comment, view own earnings (`admin.routes.ts:62`). | Task must be assigned to them (`assertTaskReadable`, `workflow.service.ts:127`; `assertCanReadStudioPage` TASK_ONLY scope, `studio-access.service.ts:40`). Production scope limited to assigned tasks/series membership (`productionScopeFilter`, `authorization.service.ts:168`). [C] |
| **Tantou Editor** | Claim/screen proposals, request changes / forward / reject to Board (`workflow.service.ts:493-518`), review consolidated chapters (approve/revision/reject — `series.routes.ts:80`), manage series info, add editorial comments/annotations (`studio.routes.ts:56`), schedule/publish chapters. | Editor sees non-DRAFT proposals (`canReadProposal` EDITOR→`status!=='DRAFT'`, `authorization.service.ts:41`). Chapter editorial actions require being **the assigned series editor** (`assertAssignedSeriesEditor`, `authorization.service.ts:121`; enforced `workflow.service.ts:1758`). Cannot review own authored chapter (`SELF_APPROVAL_BLOCKED`, `workflow.service.ts:1760`). [C] |
| **Editorial Board** | Vote on proposals in an open session (`mobile.routes.ts:29`; `workflow.service.ts:VOTE`), review rankings, import reader votes (`notification.routes.ts:20`, BOARD/ADMIN), at-risk decisions. **Chair** opens/closes/cancels voting sessions (`voting.routes.ts:22-25`). Ties automatically open a fresh Board re-vote. | Board sees only board-relevant proposal statuses (`BOARD_VISIBLE_PROPOSAL_STATUSES`, `authorization.service.ts:15`) and all series for read (`canReadSeries:78`). Board has **no** production/mutation scope (`productionScopeFilter` BOARD→empty, `authorization.service.ts:170`). [C] |
| **Admin** | User management, payroll, materials, demo reset, audited overrides (`admin.routes.ts`, all `requireRole("ADMIN")`). | Full read/mutate via ADMIN branches everywhere. [C] |

**Visibility filters (confirmed):** `actorSeriesScopeFilter` (`authorization.service.ts:155`), `productionScopeFilter:168`, `visibleProposalFilter:197`, `materialScopeFilter:304`, `commentScopeFilter:320`, `assertFileKeyVisible` (`studio-access.service.ts:75`).

## 4. End-to-end workflows

### 4.1 Proposal & board approval [C]
1. **Mangaka** `POST /proposals` (`proposal.routes.ts:19`) → status `DRAFT`.
2. `POST /proposals/:id/actions/SUBMIT` → `DRAFT → PENDING_EDITOR` (`workflow.service.ts:631`).
3. **Editor** `CLAIM` → `PENDING_EDITOR → EDITOR_REVIEWING` (atomic claim, `workflow.service.ts:646`). The claiming Editor may release; another Editor may claim after release.
4. Editor decides: `REQUEST_CHANGES` → `CHANGES_REQUESTED` (`:766`); or `FORWARD` → `PENDING_BOARD` (`:816`); or `REJECT` → `REJECTED` (`:851`).
   - From `CHANGES_REQUESTED`, **Mangaka** `RESUBMIT` (requires all requested-change items resolved, `:1045`) → back to `EDITOR_REVIEWING`/`PENDING_EDITOR`.
5. **Board chair** `POST /voting-sessions` (`voting.controller.ts:144`): requires proposal `PENDING_BOARD`; freezes a `ProposalVersion` (`status:FROZEN, source:VOTING_SESSION`, `:192`); creates `VotingSession` `OPEN` with `quorum = BOARD_QUORUM`; sets proposal `PENDING_BOARD → BOARD_REVIEW` + `activeVotingSessionId` (`:241`).
6. **Board members** `VOTE` (`workflow.service.ts:893`): requires `BOARD_REVIEW` + active session; upserts `ProposalVote`; tally via `evaluateBoardTally` (`:388`). Quorum = `configuredBoardQuorum()` (floor `<2 → 3`, `:44`), `BOARD_TOTAL = 5` (`:53`).
7. Tie → the current session closes and a fresh Board re-vote session opens.
8. **Chair** `closeVotingSession` (`:2737`): computes outcome → session `FINALIZED | NO_QUORUM | TIE_BREAK_REQUIRED`; on approve, proposals → `APPROVED`, `BoardDecision` recorded (`:2895`), and `ensureProductionSeriesForApprovedProposal` creates the Series (`:202`).

**Approval gate:** a proposal can only be approved through a VotingSession finalize; direct `FORCE_STATUS` is removed (`410 WORKFLOW_REMOVED`, `assertProposalAction:528`). [C]

### 4.2 Series & chapter production [C]
1. On approval, Series is auto-created `status:"PRE_PRODUCTION", visibility:"PRIVATE"`, `sourceProposalId`, editor copied from proposal claim (`workflow.service.ts:246-278`).
2. **Editor/Mangaka** `POST /series/:id/actions/START_PRODUCTION` → requires an `APPROVED` source proposal, sets Series `→ ONGOING` (`series.controller.ts:314`).
3. Chapters: `POST /series/:id/chapters` (EDITOR/MANGAKA, `series.routes.ts:48`), unique `(seriesId, number)` (`models.ts:593`). Chapter default `PLANNED`.
4. `START_DRAFT` (owner): `PLANNED → IN_PRODUCTION` (`workflow.service.ts:1727`). `START_ASSISTANT_WORK` (mangaka/editor) stays `IN_PRODUCTION`.

### 4.3 Page & region task assignment [C]
1. Pages are embedded in Chapter (`ChapterPage[]`, `models.ts:492`), created via `POST /chapters/:chapterId/pages` (EDITOR/MANGAKA, `series.routes.ts:92`).
2. **Mangaka** creates regions `POST /studio/regions` and tasks `POST /studio/tasks` (both **MANGAKA-only**, `studio.routes.ts:36,43`). A Task carries `assigneeId`, optional `regionId/pageId/chapterId`, `isRequired`, `workUnitType`, `rateSnapshot`.
3. Assignment/reassignment via `taskAction REASSIGN` (mangaka, `workflow.service.ts:2181`).
4. Region locking: `START` on a task locks its region (`lockRegion:282`); cancel releases it (`releaseRegionLock:305`).

### 4.4 Assistant submission & Mangaka review [C]
1. **Assistant** `START` → task `IN_PROGRESS`, region `LOCKED` (`workflow.service.ts:2121`).
2. `POST /tasks/:taskId/submit` (ASSISTANT, `submission.routes.ts:21`) → `submitTaskWork` (`:2244`): requires `Idempotency-Key` header + `expectedCurrentSubmissionId`; validates submission scope matches the task (`assertSubmissionMatchesTaskScope:564`, blocks cross-chapter/page files); creates `Submission` `PENDING`, task `→ SUBMITTED`, region `SUBMITTED`. Prior open submissions `→ SUPERSEDED`.
3. **Mangaka** `submissionDecision` (`:2959`, MANGAKA-only, self-approval blocked `:2980`):
   - `approve` → submission `MANGAKA_APPROVED`, task `MANGAKA_APPROVED`, region `APPROVED`, an `Earning` (`status:EARNED`) accrued (`:3105`).
   - `request-revision` → submission `REVISION_REQUESTED`, task `REVISION_REQUESTED`, region `REVISION_REQUIRED` (stays locked).
   - `reject` → submission `REJECTED`, task `REJECTED`, region released `CONFIRMED`.
4. On revision, **Assistant** `REOPEN` (`reopenTaskForRevision:2208`) → task back to `IN_PROGRESS`.
   - **Editor no longer reviews individual submissions** — `editor-approve` on submissions/tasks is deprecated `410` (`:2146,2967`). Editor review happens at the **chapter** level (§4.5). [C]

### 4.5 Editorial review & revision (chapter-level) [C]
1. **Mangaka** `POST /studio/chapters/:chapterId/send-editor-review` (MANGAKA-only, `studio.routes.ts:29`) → `sendChapterToEditorReview` (`workflow.service.ts:1419`). Gates checked: series `ONGOING`; source proposal `APPROVED`; chapter status `IN_PRODUCTION|PLANNED` (SUBMIT) or `REVISION_REQUIRED` (RESUBMIT); every page has an uploaded asset (`pageHasUploadedAsset:1377`); all required non-cancelled tasks `MANGAKA_APPROVED` with a current `MANGAKA_APPROVED` submission; review materials `ACTIVE/APPROVED`; no unresolved blocking comments (`findChapterBlockingComments:1391`). → chapter `TANTOU_REVIEW`, pages stay `UPLOADED` and become immutable, and a frozen `reviewSnapshot` + open `ChapterReview` is created.
2. **Assigned Editor** (`assertAssignedSeriesEditor`, not the author) acts via `POST /chapters/:chapterId/actions/:action`:
   - `EDITOR_APPROVE`: `TANTOU_REVIEW → READY_FOR_PUBLICATION`, pages `FINALIZED`, approved regions `DONE` (`:1731,2061`). Snapshot-staleness guarded (`:1794`).
   - `REQUEST_REVISION` / `REJECT`: `TANTOU_REVIEW → REVISION_REQUIRED`, pages stay `UPLOADED`, and a blocking Page/Region comment identifies the required change (`:1969`).
3. Revision loop: Mangaka fixes, `RESUBMIT` re-freezes a new snapshot.

### 4.6 Reader-vote import & ranking [C][I]
1. **Board/Admin** `POST /rankings/import` (`notification.routes.ts:20`) → `importRankings` (`notification.controller.ts:120`). Validates rows (`score/finalScore/readerScore` 0–10, `votes` int; max 500 rows, `:24-31`). Creates a `RankingImport` batch, upserts `Ranking` per `(period, seriesId)` (`:173`).
2. **Ranking "calculation" is pass-through** [I]: `finalScore = row.finalScore ?? score ?? readerScore ?? 0` (`:164`); `atRisk = finalScore < 5 || status==="AT_RISK"` (`:167`). The schema's `rank`, `previousRank`, `movement` (`models.ts:1301-1303`) are **never computed** anywhere. → **Partial/Missing**.
3. At-risk series surface in `boardQueue` (`workflow.service.ts:2683`) and `decisionHistory` (`voting.controller.ts:58`); chair acts via `POST /board/series/:seriesId/at-risk-decisions` (`mobile.routes.ts:32`).

### 4.7 Publication scheduling [C]
1. Chapter must be `READY_FOR_PUBLICATION`. `SCHEDULE` (editor, `workflow.service.ts:1836`): requires future `scheduledAt`, series `publicationType` set, series not CANCELLED/COMPLETED → upserts `Publication` `SCHEDULED` (unique per chapter, `models.ts:615`). Chapter status **stays** `READY_FOR_PUBLICATION` (scheduling is not a chapter status — `types.ts:105`). [C]
2. `POSTPONE` → `Publication → CANCELLED` (`:1882`).
3. `PUBLISH` (editor): requires a `SCHEDULED` publication whose `scheduledAt` has arrived → chapter `PUBLISHED`, `Publication PUBLISHED` (`:1903`).

### 4.8 Cancellation / publication-plan change [C][I]
- **Series:** `UNPUBLISH → HIATUS`, `ARCHIVE → ARCHIVED` (`series.controller.ts:334`, EDITOR/ADMIN; Mangaka blocked on public series). `deleteSeries` (ADMIN/MANGAKA, `:352`).
- **Publication plan (cadence):** set at Board finalize (`boardApprovedPublicationType`, applied to Series `publicationType/cadence` in `ensureProductionSeriesForApprovedProposal:219-231`). There is **no dedicated "change publication plan" action** post-approval beyond `patchSeries` (EDITOR/MANGAKA) editing `publicationType`. [I/A — is ad-hoc `patchSeries` the intended mechanism?]
- **No `CANCELLED`/`COMPLETED` Series lifecycle action exists** although the workflow guards reference those statuses (`workflow.service.ts:1851,1951`). → **Conflicting/Missing** (§10). [I]

## 5. Business rules, validations, approval gates, data-integrity constraints

**Approval gates (confirmed):**
- Proposal approval only via VotingSession finalize; `FORCE_STATUS` removed (`:528`).
- Editor cannot review own authored chapter (`SELF_APPROVAL_BLOCKED:1760`).
- Mangaka cannot approve own submission (`:2980`).
- Chapter→editor review blocked unless all gates pass (§4.5).
- Board quorum floor ≥ 2 (`:44`); `BOARD_TOTAL=5`.

**Validations:** Zod schemas per resource in `validators/*.ts`; `parseBody` + `rejectProtectedFields` (`validators/common.ts`) strip protected fields; ranking rows bounded 0–10 / ≤500 (`notification.controller.ts:24`).

**Concurrency / integrity (confirmed):**
- Optimistic concurrency: `expectedVersion` on voting sessions (`assertSessionVersionMatches:549`), `expectedCurrentSubmissionId` on task submit (`:2304`), status-matched `updateOne` guards throughout.
- Idempotency: `Idempotency-Key` on task submit + `requestFingerprint` (`:2250,2286`); unique `(taskId, idempotencyKey)` index (`models.ts:992`).
- Transactions: `runWorkflowTransaction` for multi-doc writes (`:1349`), requires Mongo replica set.
- Unique constraints: chapter `(seriesId, number)`; series `sourceProposalId`; publication `chapterId`; earningItem `taskId` (one payment per task, `models.ts:1487`); one active VotingSession per proposal (partial unique index, `models.ts:1157`).

**Data-integrity gaps [I]:**
- `Series.status` has **no schema enum** (free string, default `PLANNING`, `models.ts:454`) — unlike Chapter/Task/Submission/Publication. Values used inconsistently: `PLANNING` (default) vs `PRE_PRODUCTION` (set on approval) vs `ONGOING/HIATUS/ARCHIVED`, plus `CANCELLED/COMPLETED` referenced but never set.
- `Proposal.status` and `VotingSession.status` also have **no enum** (`models.ts:329,1127`).
- Assistant earnings: `resolveTaskRate()` returns 0 (`workflow.service.ts:329`) → every `EarningItem.amount = 0`. Rates are stubbed. → **Partial**.
- `VotingSession.eligibleVoterIds` is **hardcoded** to `["u-board", …"u-board-5"]` (`voting.controller.ts:231`) rather than derived from actual Board membership. → integrity/realism gap.

## 6. Full transition tables (primary entities)

**Legend:** actor in (parens); guard notes in *italics*.

### Proposal (`ProposalStatus` `types.ts:28`; enforced in `assertProposalAction`/`applyProposalAction`)
| From | Action | To |
|---|---|---|
| DRAFT | SUBMIT (Mangaka) | PENDING_EDITOR |
| PENDING_EDITOR / SUBMITTED* | CLAIM (Editor) | EDITOR_REVIEWING |
| SUBMITTED*/TANTOU_REVIEW*/PENDING_EDITOR/EDITOR_REVIEWING | RELEASE_CLAIM (claiming Editor) | PENDING_EDITOR |
| review set* | REQUEST_CHANGES (Editor) | CHANGES_REQUESTED |
| CHANGES_REQUESTED | RESUBMIT (Mangaka) *all change-items resolved* | EDITOR_REVIEWING / PENDING_EDITOR |
| review set* | FORWARD (Editor) | PENDING_BOARD |
| review set* | REJECT (Editor) | REJECTED |
| PENDING_BOARD | *createVotingSession* (Chair) | BOARD_REVIEW |
| READY_FOR_BOARD*/PENDING_BOARD/BOARD_REVIEW/BOARD_VOTING* | RECALL (Editor) | PENDING_EDITOR |
| BOARD_REVIEW | VOTE (Board) *active session* | BOARD_REVIEW (tally only) |
| BOARD_REVIEW | *closeVotingSession approve* (Chair) | APPROVED |
| BOARD_REVIEW | *closeVotingSession reject* (Chair) | REJECTED |
| DRAFT/…/CHANGES_REQUESTED | WITHDRAW (Mangaka) | WITHDRAWN |
| non-APPROVED | ARCHIVE (Admin) | ARCHIVED |
| DRAFT/CHANGES_REQUESTED | EDIT (Mangaka) *locked if board snapshot active* | (same) |

`*` = legacy/deprecated status still accepted by guards (`SUBMITTED, RESUBMITTED, READY_FOR_BOARD, BOARD_VOTING, TIE_BREAK`) though `types.ts` marks them deprecated. [L]

### VotingSession (`VotingSessionStatus` `types.ts:65`; `voting.controller.ts` + `workflow.service.ts`)
| From | Action | To |
|---|---|---|
| — | create (Chair) | OPEN *(schema default is DRAFT; code creates OPEN)* |
| OPEN | close, quorum + majority (Chair) | FINALIZED (result APPROVED/REJECTED) |
| OPEN | close, no quorum (Chair) | NO_QUORUM |
| OPEN | close, tie (Chair) | TIE_BREAK_REQUIRED |
| TIE_BREAK_REQUIRED | historical closed round; fresh Board re-vote is opened | OPEN |
| OPEN / TIE_BREAK_REQUIRED | cancel (Chair) | CANCELLED |

*Note [I]: `VotingSessionStatus` type omits `DRAFT` (the schema default) and `CLOSED`; schema has no enum.*

### Series (**no enum** — `models.ts:454`; values from code)
| From | Action | To |
|---|---|---|
| — | *auto-create on proposal APPROVED* | PRE_PRODUCTION |
| PRE_PRODUCTION | START_PRODUCTION (Editor/Mangaka) *approved proposal* | ONGOING |
| ONGOING | UNPUBLISH (Editor/Admin) | HIATUS |
| any (non-public for Mangaka) | ARCHIVE (Editor/Admin) | ARCHIVED |
| — | delete (Admin/Mangaka) | *(soft delete fields)* |

*Gaps [I]: default `PLANNING` never transitions to `PRE_PRODUCTION` through an action; `CANCELLED`/`COMPLETED` referenced in guards but unreachable via any action.*

### Chapter (`ChapterStatus` `types.ts:112`; `applyChapterAction:1682`)
| From | Action | To |
|---|---|---|
| PLANNED | START_DRAFT (owner) | IN_PRODUCTION |
| IN_PRODUCTION | START_ASSISTANT_WORK (Mangaka/Editor) | IN_PRODUCTION |
| IN_PRODUCTION / PLANNED | SUBMIT_REVIEW (Mangaka owner) *all gates* | TANTOU_REVIEW |
| REVISION_REQUIRED | RESUBMIT (Mangaka owner) | TANTOU_REVIEW |
| TANTOU_REVIEW | EDITOR_APPROVE (assigned Editor, not author) | READY_FOR_PUBLICATION |
| TANTOU_REVIEW | REQUEST_REVISION / REJECT (Editor) | REVISION_REQUIRED |
| IN_PRODUCTION | MARK_READY (Editor) | READY_FOR_PUBLICATION |
| READY_FOR_PUBLICATION | SCHEDULE (Editor) | READY_FOR_PUBLICATION *(+Publication SCHEDULED)* |
| READY_FOR_PUBLICATION | POSTPONE (Editor) | READY_FOR_PUBLICATION *(Publication CANCELLED)* |
| READY_FOR_PUBLICATION | PUBLISH (Editor) *publication due* | PUBLISHED |
| any | REASSIGN (Editor) | (same; Chapter has no independent archive lifecycle) |

### Page (`PAGE_STATUSES` `types.ts:146`; embedded, **no schema enum**)
| From | Trigger | To |
|---|---|---|
| — | page created | PENDING_UPLOAD |
| PENDING_UPLOAD | asset uploaded | (asset present; `pageHasUploadedAsset`) |
| * | chapter SUBMIT_REVIEW | TANTOU_REVIEW |
| TANTOU_REVIEW | chapter EDITOR_APPROVE | FINALIZED |
| TANTOU_REVIEW | chapter REQUEST_REVISION/REJECT | REVISION_REQUIRED |

*Note [I]: `UPLOADED, REGIONING, IN_PRODUCTION, MANGAKA_REVIEW` are defined in `PAGE_STATUSES` but are not driven by any confirmed transition — only `PENDING_UPLOAD, TANTOU_REVIEW, REVISION_REQUIRED, FINALIZED` are written by the workflow.*

### Task (`StudioTaskStatus` `types.ts:163`; `applyTaskAction:2098` + submit/decision)
| From | Action | To |
|---|---|---|
| TODO | START (Assistant) | IN_PROGRESS |
| IN_PROGRESS | submit (`/tasks/:id/submit`, Assistant) | SUBMITTED |
| SUBMITTED | submission approve (Mangaka) | MANGAKA_APPROVED |
| SUBMITTED | submission request-revision (Mangaka) | REVISION_REQUESTED |
| SUBMITTED | submission reject (Mangaka) | REJECTED |
| REVISION_REQUESTED | REOPEN (Assistant) | IN_PROGRESS |
| any (non-terminal) | CANCEL (Mangaka) | CANCELLED |
| any | BLOCK/MARK_BLOCKED ⇄ UNBLOCK (Assistant) | *(blocked flag; status unchanged)* |
| any | REASSIGN (Mangaka) | *(assignee change)* |

*Deprecated task actions returning `410`: SUBMIT, REQUEST_REVISION, APPROVE, MANGAKA_APPROVE, EDITOR_APPROVE, REJECT on the task itself (`:2128-2158`). Legacy statuses `MANGAKA_REVIEWING, EDITOR_*, OPEN, COMPLETED` are read-only compat.* [L]

### Submission (`SubmissionStatus` `types.ts:203`; `submitTaskWork` + `submissionDecision`)
| From | Action | To |
|---|---|---|
| — | task submit (Assistant) | PENDING |
| PENDING | approve (Mangaka) | MANGAKA_APPROVED |
| PENDING | request-revision (Mangaka) | REVISION_REQUESTED |
| PENDING | reject (Mangaka) | REJECTED |
| PENDING/REVISION_REQUESTED | superseded by new submission | SUPERSEDED |

*Legacy/compat statuses in schema not in canonical union: `SUBMITTED, APPROVED, EDITOR_APPROVED, EDITOR_REVISION_REQUESTED, MANGAKA_REVISION_REQUESTED`.* [L]

### Publication (`PublicationStatus` `types.ts:231`; `applyChapterAction`)
| From | Action | To |
|---|---|---|
| — | chapter SCHEDULE | SCHEDULED |
| SCHEDULED | chapter POSTPONE | CANCELLED |
| SCHEDULED | chapter PUBLISH *(due)* | PUBLISHED |

*`DRAFT` is the schema default but no flow starts a Publication in DRAFT.* [I]

## 7. Compact transition lists (secondary entities)

- **StudioRegion** (`models.ts:670`): `DETECTED → CONFIRMED → ASSIGNED/IN_PROGRESS (task START, LOCKED) → SUBMITTED → APPROVED/REVISION_REQUIRED → DONE` (on chapter approve); `DISCARDED` terminal. Lock: `UNLOCKED → LOCKED → RELEASED`.
- **StudioComment** (`models.ts:861`): `OPEN → FIXED/ADDRESSED/RESOLVED`, `REOPENED`. Blocking comments gate chapter review.
- **Material** (`models.ts:1063`): `DRAFT → ACTIVE → IN_REVIEW → APPROVED → ARCHIVED`. Chapter review requires `ACTIVE/APPROVED`.
- **ChapterReview** (`models.ts:1264`): `OPEN → APPROVED/REVISION_REQUESTED/REJECTED`; `STALE/INVALIDATED`.
- **ProposalVersion** (`models.ts:1222`): `DRAFT → FROZEN → SUPERSEDED`.
- **RankingImport** (`models.ts:1362`): `PENDING → VALIDATED → IMPORTED/FAILED`.
- **Earning** (`models.ts:1419`): auto path `EARNED`; payroll path `PENDING → CONFIRMED → PAID`; `VOIDED`. **EarningItem**: `PENDING → APPROVED/VOIDED`.
- **OutboxEvent**: `PENDING → PROCESSING → SENT/FAILED → DEAD_LETTER`.

## 8. Entity relationships & required fields

**Core graph:**
`Proposal 1—1 Series` (`sourceProposalId`, unique) → `Series 1—* Chapter` (`seriesId`) → `Chapter 1—* Page` (embedded) and `1—* StudioRegion`/`StudioTask` (`chapterId`). `StudioTask 1—* Submission` (`taskId`, current via `currentSubmissionId`). `Proposal 1—* ProposalVote` via `VotingSession` → `1—1 BoardDecision`. `Series 1—* Ranking` (`period, seriesId`). `StudioTask/Submission → Earning/EarningItem` (`taskId`). `Series *—* User` via `SeriesMember` (canonical) / `assistantIds` (deprecated). Cross-cutting: `Notification`, `AuditEntry`, `OutboxEvent`, `Material`, `StudioComment`.

**Required fields (schema `required:true`, `models.ts`):** every doc has `id` (unique). User: `name,email,passwordHash,role`. Proposal: `status`. Series: `authorId`. Chapter: `seriesId,number`. Publication: `seriesId,chapterId,status`. StudioRegion: `chapterId`. StudioComment: `authorId,authorName`. ProposalVote: `proposalId,voterId,voterName,voterRole,decision`. VotingSession: `title,createdById`. BoardDecision: `votingSessionId,proposalId,proposalVersionId,result,decidedAt`. Ranking: `seriesId,period`. RankingImport: `period,importedById,status`. Earning: `assistantId,period,amount,status`. SeriesMember: `seriesId,userId,role`. *Many business-critical fields (e.g. Series.title, Chapter.title, Proposal.title/authorId) are **not** `required` — loose schemas with `strict:false` (`models.ts:27`).* [I]

## 9. Traceability matrix (requirement → implementation → status)

| Business requirement | Implementation (file:function) | Status |
|---|---|---|
| Mangaka submits proposal | `proposal.routes.ts:19 createProposal`; `workflow.service.ts:631 SUBMIT` | **Complete** |
| Editor screens (claim/changes/forward/reject) | `workflow.service.ts:646/766/816/851` | **Complete** |
| Board votes with quorum | `workflow.service.ts:388 evaluateBoardTally,893 VOTE`; `voting.controller.ts:144 createVotingSession` | **Complete** |
| Board re-vote after tie | `proposal-governance.service.ts` creates a new session | **Complete** |
| Board decision recorded + audited | `workflow.service.ts:2895 BoardDecision`; `audit.service.ts` | **Complete** |
| Auto series creation on approval | `workflow.service.ts:202 ensureProductionSeriesForApprovedProposal` | **Complete** |
| Publication cadence chosen by Board | `workflow.service.ts:219 (boardApprovedPublicationType)` | **Complete** |
| Series production start | `series.controller.ts:314 START_PRODUCTION` | **Complete** |
| Chapter production state machine | `workflow.service.ts:1682 applyChapterAction` | **Complete** |
| Region/task assignment (Mangaka) | `studio.routes.ts:36,43`; `workflow.service.ts:2181 REASSIGN` | **Complete** |
| Assistant submit w/ idempotency + scope guard | `workflow.service.ts:2244 submitTaskWork,564 scope check` | **Complete** |
| Mangaka reviews submission (self-approval blocked) | `workflow.service.ts:2959 submissionDecision` | **Complete** |
| Consolidated editor chapter review | `workflow.service.ts:1419 sendChapterToEditorReview` | **Complete** |
| Editor annotations | StudioComments (`studio.routes.ts:56`) | **Complete** (annotations = comments) |
| Publication scheduling & publish | `workflow.service.ts:1836 SCHEDULE/PUBLISH` | **Complete** |
| Reader-vote import | `notification.controller.ts:120 importRankings` | **Complete** |
| Ranking calculation (rank/movement) | *none* | **Missing** |
| At-risk detection | `notification.controller.ts:167 atRisk`; `workflow.service.ts:2683 boardQueue` | **Partial** (threshold-only, no trend) |
| Series cancellation / plan change | `series.controller.ts:334 (HIATUS/ARCHIVE)`; cadence via `patchSeries` | **Partial/Conflicting** (no CANCELLED/COMPLETED action) |
| Assistant monthly earnings | `workflow.service.ts:3105 Earning`; `admin` payroll | **Partial** (rate = 0, `:329`) |
| Editor monitors studio deadlines | `dueAt/reviewDueAt` fields; no enforcement/alerts | **Partial** (data only) |
| Role authorization | `middleware/auth.ts`, `authorization.service.ts` | **Complete** |
| Direct status forcing | `assertProposalAction:528` (410 removed) | **Extra→removed** |
| Board vote via mobile aliases | `mobile.routes.ts:27-32` | **Extra/Duplicate** |

## 10. Duplicated / legacy / over-engineered / out-of-scope

- **[L] Two board-vote mechanisms:** canonical `VotingSession`+`ProposalVote` vs the `/board/series/:id/votes|finalize|tie-break` aliases (`mobile.routes.ts:27-32`, `mobile.controller.ts`) and the deprecated embedded `proposal.votes` cache (`models.ts:281,330`). Recommend consolidating on VotingSession; treat mobile routes as thin adapters or remove.
- **[L] Membership duplication:** `SeriesMember` collection (canonical) vs `series.assistantIds` denormalized array (`models.ts:430,463`).
- **[L] Dual comment fields:** `body`/`text`, `isBlocking`/`blocking` (`models.ts:830-865`).
- **[L] Legacy status values** across Task/Submission/Proposal enums kept for migration reads; and deprecated reviewer fields on Submission (`models.ts:912-919`).
- **[I] No-enum statuses** on Proposal/Series/VotingSession (§5) — main maintainability/integrity risk.
- **[Over-engineered for a course project, but functional]:** OutboxEvent + AuditEntry event scaffolding; ProposalVersion/ChapterReview snapshot-integrity machinery; R2 vs local storage abstraction. These add correctness (review integrity) but also complexity; acceptable to keep, worth documenting.
- **[Extra feature]:** AI bubble detect/whiten (`ai.routes.ts`) — outside the stated core scope but self-contained.
- **[Dead-ish]:** `/admin/workflow-overrides` + `/admin/override` both map to `executeOverride` (`admin.routes.ts:58-59`).

## 11. Product-owner questions

### Approved decisions (2026-07-25)

| # | Decision | Verdict | Scope |
|---|----------|---------|-------|
| Q1 | Add a Series **`CANCEL`** action → `CANCELLED` (Editor/Admin, mirroring UNPUBLISH/ARCHIVE). COMPLETE stays optional. | **Must-fix** | Cancellation is explicit business scope; removes an unreachable-state conflict. |
| Q4 | Make assistant **earnings non-zero via the existing `rateSnapshot`**: apply a small default rate at task creation when none is given; remove the dead `resolveTaskRate`/`createEarningItemIfMissing` 0-stub. | **Must-fix** | Monthly earnings are in the approved business scope; plumbing already computes `quantity × rateSnapshot`. |
| Q5 | Derive VotingSession **`eligibleVoterIds` from active BOARD users** instead of the hardcoded 5 ids. | **Recommended (optional)** | Low-risk data-integrity improvement; demo works either way with the seed. |
| Q2 | Publication-plan change stays via `patchSeries` (Editor). | Optional — document only | Mechanism already exists; Board-gating is over-engineering. |
| Q3 | Ranking stays import-only (`rank/movement` not computed). | Optional — document only | at-risk works from `finalScore`; list sorts by score. |
| Q6 | Deadlines stay display-only. | Optional — document only | Escalation is enterprise scope-creep. |
| Q7 | Keep both board-vote paths; flag mobile aliases as tech-debt. | Optional — document only | Removing risks breaking mobile/frontend clients. |
| Q8 | Document ADMIN as non-superuser for production ops (uses audited `/admin/override`). | Optional — document only | No security hole; route layer is the more restrictive authority. |

Open questions retained for reference:

1. **Series lifecycle:** Should there be explicit `CANCELLED`/`COMPLETED` Series actions? Guards reference them but nothing sets them. [I] → **Q1 approved: add CANCEL; COMPLETE deferred.**
2. **Publication-plan change:** Is editing `publicationType` via `patchSeries` the intended way to change cadence after approval, or should it be a Board-gated action? [A]
3. **Ranking:** Should the system *compute* rank/previousRank/movement from imported scores, or is import-only (pass-through) intended? [I]
4. **Earnings:** Where do task rates come from? `resolveTaskRate` is stubbed to 0 — is a rate table in scope? [I]
5. **Board eligibility:** Should `eligibleVoterIds`/quorum derive from actual Board membership instead of the hardcoded 5 ids? [I]
6. **Deadlines:** Are `dueAt`/`reviewDueAt` meant to trigger alerts/escalation, or are they display-only? [A]
7. **Mobile board aliases:** Keep the `/board/series/*` alias routes, or standardize on `/voting-sessions`/`/proposals/:id/actions/VOTE`? [L]
8. **ADMIN reach:** Route guards exclude ADMIN from many mutation routes (`requireExactRole` without ADMIN) while the service layer grants ADMIN bypass — which is authoritative? [I]

## 12. Acceptance checklist (for later review & testing)

**Proposal→Board**
- [ ] Non-Mangaka cannot create a proposal (403).
- [ ] SUBMIT only from DRAFT; other transitions rejected with `INVALID_TRANSITION`.
- [ ] Two editors cannot both CLAIM the same proposal (atomic).
- [ ] VotingSession opens only from PENDING_BOARD; proposal moves to BOARD_REVIEW.
- [ ] Quorum of 1 is impossible (`BOARD_QUORUM` ≥ 3 unless env set to 2).
- [ ] Approve → Series auto-created once (idempotent on `sourceProposalId`).
- [ ] `FORCE_STATUS` returns 410.

**Production**
- [ ] Only assigned Mangaka can send chapter to editor review; all gates enforced.
- [ ] Editor cannot approve a chapter of a series they authored.
- [ ] Only assigned series Editor can EDITOR_APPROVE.
- [ ] Assistant submit requires Idempotency-Key + expectedCurrentSubmissionId; duplicate key returns prior submission.
- [ ] Submission file from a different chapter/page is rejected (`CROSS_ENTITY_ATTACHMENT`).
- [ ] Mangaka cannot approve own submission.

**Publication**
- [ ] SCHEDULE requires future date + series publicationType; chapter stays READY_FOR_PUBLICATION.
- [ ] PUBLISH blocked until scheduledAt is due.

**Ranking / visibility**
- [ ] Only BOARD/ADMIN can import rankings; rows validated 0–10.
- [ ] Mangaka sees only own series rankings (403 otherwise).
- [ ] Dashboard summary scoped to the actor's role (this branch).
- [ ] Editor cannot resolve a DRAFT proposal cover key (this branch).

**Data integrity**
- [ ] Chapter number unique per series.
- [ ] One active VotingSession per proposal.
- [ ] One EarningItem per task.

## 13. Appendix — architecture, structure, tech stack, dependencies, code quality

**Tech stack.** Backend: Node ESM, Express 5, Mongoose 9/MongoDB, Zod, JWT (bcryptjs), vitest+supertest+mongodb-memory-server. Frontend: React + TanStack Router (`src/router.tsx`, `routeTree.gen.ts`), feature-sliced. Also `mobile/`, `ai-service/` (Python), `supabase/` (unused?).

**Backend structure (layered):** `routes/*` (HTTP + guards) → `controllers/*` (request/response, validation) → `services/*` (business logic: `workflow.service.ts` is the state-machine core, plus `authorization`, `auth`, `audit`, `file-access`, `studio-access`, `tantou`, `r2`, `outbox`) → `db/models.ts` (25 Mongoose schemas) + `domain/*` (ids, roles) + `validators/*` (Zod). Cross-cutting `lib/http.ts` (envelope, AppError, asyncRoute), `middleware/auth.ts`.

**Frontend structure:** `src/features/{mangaka,assistant,editor,board,proposals,series,admin,dashboard,notifications}`, each with `api/` (TanStack Query hooks) that call the documented endpoints — confirmed structural match with the backend contract (proposals, board/queue, studio/tasks, voting-sessions, rankings/import all referenced).

**Module dependency shape:** clean top-down (routes→controllers→services→models); services depend on models + each other (`workflow.service` imports `audit`, `authorization`). No obvious cycles. Envelope contract `{success,data,message}` (`types.ts:271`).

**Code quality (confirmed observations):**
- **Strengths:** explicit state machines with per-action guards; optimistic concurrency + idempotency + transactions; audit + outbox for traceability; consistent error envelope; real integration tests (175/175, 14 files).
- **Weaknesses [I]:** `workflow.service.ts` is **~3200 lines** — a single very large module doing proposal + chapter + task + submission + voting + publication + earnings; splitting by aggregate would improve readability. Loose schemas (`strict:false`) + missing enums/required on Series/Proposal/VotingSession weaken integrity. Pervasive `any` typing on Mongoose models (`mongoose.model<any>`). Legacy/deprecated fields and dual mechanisms increase cognitive load.
- **Suitable-for-course-project recommendations (no code change here):** (1) add enums + key `required` to Series/Proposal/VotingSession; (2) compute or explicitly drop `rank/movement`; (3) decide earnings rate source or mark earnings out-of-scope; (4) pick one board-vote path; (5) consider splitting `workflow.service.ts` by aggregate. Prioritize correctness/integrity over new features.

---

*Confirmed vs assumption:* items tagged **[C]** are read directly from the cited code; **[I]** are incomplete/conflicting in code; **[L]** are legacy duplication; **[A]** require product-owner confirmation.
