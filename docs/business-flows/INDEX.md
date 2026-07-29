# MangaFlow � Canonical Feature and Current-Implementation Index

> Combines the current route inventory with canonical role boundaries. Rows marked
> with a FLOW-GAP describe implemented access that must be reduced or corrected.

---

## Roles

| API Role | Web Role | Description |
|----------|----------|-------------|
| `ADMIN` | `admin` | User account lifecycle and Chair/EIC designation management; also owns managed notifications, read-only dashboards, RateTable, and dev-only demo data. No editorial/production/governance workflow authority (FLOW-GAP-04 — Resolved) |
| `MANGAKA` | `mangaka` | Creator: proposals, series authorship, chapter production, task review |
| `ASSISTANT` | `assistant` | Receives tasks, submits work, tracks earnings |
| `EDITOR` | `editor` | Reviews proposals/chapters, Tantou editor, publication scheduling |
| `BOARD` | `board` | Votes on proposals, governance, at-risk decisions |

Special flags: `isChair` (Board), `isEditorInChief` (Editor).

---

## Canonical Global Invariants

Invariants that must hold across the system. ✅ = enforced in current code;
⚠️ = canonical target with an open gap (see the Gap Register).

1. ✅ One approved Proposal creates at most one Series.
2. ✅ One Proposal has at most one active VotingSession.
3. ✅ One Board member has at most one vote per VotingSession.
4. ✅ One Series has at most one active Tantou assignment.
5. ✅ One Region has at most one active Task (`studio.controller.ts:271-311`).
6. ✅ One Task has one current Submission.
7. ✅ One Chapter has at most one active Publication.
8. ✅ Frozen ProposalVersions and Chapter review snapshots are immutable.
9. ✅ Assistant work is performed only through Task → Submission.
10. ✅ Only the owning Mangaka submits a Chapter to Tantou review
    (`chapter-review.service.ts`).
11. ✅ Submission decisions use the canonical `/api/submissions/*` endpoints; the
    generic Task-action decision aliases are removed (`400 INVALID_ACTION`).
12. ✅ AI output is never treated as human-approved content; Admin does not perform
    editorial approval or alter Board decisions.
13. ✅ A cancelled VotingSession must return its Proposal to `PENDING_BOARD`
    (**FLOW-GAP-02** — Resolved).
14. ✅ Only the assigned Tantou may create/raise/resolve/reopen a blocking comment;
    resolve/reopen require an assigned `editorId`, and reopen starts only from
    `ADDRESSED`/`RESOLVED` (**FLOW-GAP-01**/**FLOW-GAP-03** — Resolved).
15. ✅ Material status is first-class and transition-guarded: owning Mangaka or
    assigned Tantou may activate/archive; assigned Tantou alone may approve.
16. ✅ Admin cannot execute editorial or production workflow actions (rankings
    import, tantou assignment, series lifecycle, proposal claim/archive, material
    or payroll routes, workflow overrides, file download); Admin retains only
    account lifecycle, Chair/EIC designation, managed notifications, read-only
    dashboards, RateTable, and dev-only demo data (**FLOW-GAP-04** — Resolved).
17. ✅ At most five Board seats are active; exactly one active Board Chair and
    one active EIC may exist. Designation reassignment is transactional.
18. ✅ Every new VotingSession snapshots the current active Board electorate;
    no seed/demo user IDs are used as the live roster.
19. ✅ `MARK_READY` is removed. A Chapter reaches
    `READY_FOR_PUBLICATION` only through assigned-Tantou `EDITOR_APPROVE`.
20. ✅ Mangaka owns Chapter/Page content mutations. Tantou may review, comment,
    request revision, resolve blockers, and approve, but may not edit the evidence.
21. ✅ `ADDRESSED` permits resubmission but remains pending verification;
    `EDITOR_APPROVE` requires all blocking comments to be `RESOLVED`.

## Workflow Gap Register

Stable IDs joining these docs to `docs/CODE-TODO.md` (Phase 3). `FLOW-GAP-*` =
verified current-code ≠ canonical business rule; `TECH-FINDING-*` = general
technical debt with no business-rule conflict.

> **Documentation agreement ≠ implementation compliance.** The invariants above
> FLOW-GAP entries are tracked against the application code as well as the canonical
> docs. See the separated *Documentation consistency* vs *Current implementation
> compliance* matrices in
> [CODE-TODO.md → Project Status & Compliance](../CODE-TODO.md#project-status--compliance).

| ID | Summary | Evidence | Doc |
|----|---------|----------|-----|
| FLOW-GAP-01 | **Resolved.** Blocking-comment write authority not restricted to assigned Tantou | `studio.controller.ts:151-161,435-441` (`assertCanRaiseBlockingComment` gating `createComment`/`patchComment`) | [12](12-comments.md#flow-gap-01--blocking-comment-write-authority) |
| FLOW-GAP-02 | **Resolved.** VotingSession cancel restores Proposal to `PENDING_BOARD` (transactional, fail-closed) | `proposal-governance.service.ts` (`cancelVotingSession`); `voting.controller.ts:245` | [02](02-proposal-lifecycle.md#flow-gap-02--votingsession-cancel-must-restore-the-proposal) |
| FLOW-GAP-03 | **Resolved.** Comment resolve/reopen requires the assigned Tantou; reopen requires `ADDRESSED`/`RESOLVED` source status | `studio.controller.ts` (`assertCanResolveTantouBlockingComment`, `assertCanReopenTantouBlockingComment`) | [12](12-comments.md#flow-gap-03--comment-resolvereopen-assignment-guard) |
| FLOW-GAP-05 | **Resolved.** Chair/EIC compatibility and uniqueness were documented but not enforced | `admin.service.ts`; partial unique indexes in `models.ts`; `admin.test.ts` | [01](01-authentication.md#special-designation-management-canonical) |
| FLOW-GAP-06 | **Resolved.** VotingSession electorate used hard-coded seed IDs | `activeBoardElectorate()`; `voting.controller.ts`; `board.test.ts` | [06](06-board-governance.md) |
| FLOW-GAP-07 | **Resolved.** `MARK_READY` bypassed canonical Chapter review | `types.ts`; `workflow.service.ts`; `workflow.test.ts` | [04](04-chapter-workflow.md) |
| FLOW-GAP-08 | **Resolved.** Tantou could mutate Page evidence and `ADDRESSED` could pass approval without verification | `authorization.service.ts`; `chapter-readiness.service.ts`; `workflow.service.ts` | [04](04-chapter-workflow.md), [12](12-comments.md), [13](13-pages.md) |
| TECH-FINDING-01 | **Resolved.** Legacy `blocking` field migrated and removed | `migrate-canonical-comments.ts`; `models.ts` | [12](12-comments.md#tech-finding-01--legacy-blocking-field) |
| TECH-FINDING-02 | **Resolved.** Dead `FIXED` status migrated to `ADDRESSED` and removed | `migrate-canonical-comments.ts`; `models.ts` | [12](12-comments.md#tech-finding-02--dead-fixed-comment-status) |
| TECH-FINDING-03 | **Resolved.** Region lock state is canonical `UNLOCKED`/`LOCKED`; migration covers stored `RELEASED` values | `models.ts`; `migrate-region-lock-status.ts` | [14](14-regions.md#tech-finding-03--released-lock-value) |
| TECH-FINDING-04 | **Resolved.** Deprecated decision aliases removed from `TASK_ACTIONS` | `types.ts`; `p0-workflow-refactor.test.ts` | [05](05-assistant-submission.md#tech-finding-04--deprecated-decision-aliases-in-task_actions) |
| TECH-FINDING-05 | **Resolved.** Submission current-conflict uses `CURRENT_SUBMISSION_CONFLICT` | `task-submission.service.ts`; `p0-workflow-refactor.test.ts` | [05](05-assistant-submission.md#tech-finding-05--generic-conflict-code) |
| TECH-FINDING-06 | **Resolved.** Ownership failures use specific assignment/owner codes where applicable | `workflow.service.ts`; `studio.controller.ts`; `authorization-perimeter.test.ts` | [04](04-chapter-workflow.md#tech-finding-06--generic-forbidden-vs-ownership-codes) |
| TECH-FINDING-07 | **Resolved.** Outbox processor is scheduled by the production server runner | `jobs/outbox-runner.ts`; `server.ts`; `outbox-delivery.service.ts` | [DESIGN.md §3/§12](../DESIGN.md) |
| FLOW-GAP-04 | **Resolved.** Admin's workflow/content routes removed or restricted to the canonical account-administration scope | `routes/{admin,tantou,series,notification,proposal}.routes.ts`; `series.controller.ts:270-384`; `workflow.service.ts:138-191`; `docs/reports/2026-07-27-ct11-admin-scope-completion.md` | [DESIGN.md §7](../DESIGN.md#7-authorization-model) |
| TECH-FINDING-09 | **Resolved.** Root flow documents competed with the canonical index | `README.md`; deprecation banners in root flow documents | [INDEX](INDEX.md) |

---

`TECH-FINDING-08` is resolved: new task rates are Admin-owned, server-resolved,
and snapshotted; client monetary fields are rejected. See
[08 - Earnings](08-earnings.md#rate-policy) and
`backend/src/__tests__/rate-table.test.ts`.

## Current implementation status (2026-07-26)

TECH-FINDING-01 through TECH-FINDING-07 are resolved in the current branch. The
Chapter `ARCHIVE` transition and Supabase residual cleanup are also resolved.
The legacy comment/material/region migrations must be run against the deployed
database before rollout; see `docs/CODE-TODO.md` for the operational commands.
Admin workflow-scope reduction (FLOW-GAP-04 / CT-11) is implemented: the
admin-only materials/payroll/workflow-override routes are deleted, and the
shared rankings/tantou/series/proposal/file routes no longer accept `ADMIN`.
See `docs/reports/2026-07-27-ct11-admin-scope-completion.md`.

## Current service ownership (2026-07-27)

`proposal-governance.service.ts` owns VotingSession finalization/cancellation;
`chapter-readiness.service.ts` and `chapter-review.service.ts` own chapter
readiness/review; `task-submission.service.ts` owns Task → Submission commands;
`publication.service.ts` owns schedule/postpone/publish; and
`earning.service.ts` owns approval earning persistence and its outbox event;
`rate-table.service.ts` owns Admin rate configuration and active-rate resolution.
Historical line references below are retained as traceability snapshots; these
service names are the canonical current owners.

## 1. Authentication

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| Login (email/password) | `POST /api/auth/login` | `auth.controller.ts:9`, `auth.service.ts:52` | All |
| Refresh access token | `POST /api/auth/refresh` | `auth.controller.ts:15`, `auth.service.ts:81` | All |
| Get current user | `GET /api/auth/me` | `auth.controller.ts:20` | All (authed) |
| Logout | `POST /api/auth/logout` | `auth.controller.ts:24`, `auth.service.ts:108` | All (authed) |

---

## 2. Bootstrap / Dashboard

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| Bootstrap (user + nav + summary) | `GET /api/me/bootstrap` | `bootstrap.controller.ts:8` | All (authed) |
| Dashboard summary by role | `GET /api/dashboard/:role/summary` | `bootstrap.controller.ts:25` | All (authed, scoped) |

---

## 3. Proposals

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List proposals | `GET /api/proposals` | `proposal.controller.ts:30` | Non-Admin roles (scoped) |
| Create proposal | `POST /api/proposals` | `proposal.controller.ts:75` | MANGAKA |
| Get proposal | `GET /api/proposals/:id` | `proposal.controller.ts:130` | Non-Admin roles (scoped) |
| List proposal versions | `GET /api/proposals/:id/versions` | `proposal.controller.ts:136` | BOARD, EDITOR, owning MANGAKA |
| Get proposal version | `GET /api/proposals/:id/versions/:versionId` | `proposal.controller.ts:146` | BOARD, EDITOR, owning MANGAKA |
| Patch proposal (EDIT) | `PATCH /api/proposals/:id` | `proposal.controller.ts:158` | MANGAKA (author) |
| Delete proposal (WITHDRAW) | `DELETE /api/proposals/:id` | `proposal.controller.ts:165` | MANGAKA, EDITOR |
| Proposal action | `POST /api/proposals/:id/actions/:action` | `proposal.controller.ts:170` | MANGAKA, EDITOR, BOARD |
| - SUBMIT | (action) | `workflow.service.ts:629` | MANGAKA (author) |
| - CLAIM | (action) | `workflow.service.ts:645` | EDITOR |
| - RELEASE_CLAIM | (action) | `workflow.service.ts:710` | EDITOR (EIC only) |
| - REASSIGN_CLAIM | (action) | `workflow.service.ts:736` | EDITOR (EIC only) |
| - REQUEST_CHANGES | (action) | `workflow.service.ts:765` | EDITOR |
| - FORWARD | (action) | `workflow.service.ts:815` | EDITOR |
| - REJECT | (action) | `workflow.service.ts:850` | EDITOR |
| - RECALL | (action) | `workflow.service.ts:881` | EDITOR |
| - VOTE | (action) | `workflow.service.ts:892` | BOARD, EDITOR (EIC tie-break) |
| - WITHDRAW | (action) | `workflow.service.ts:1012` | MANGAKA (author) |
| - RESUBMIT | (action) | `workflow.service.ts:1029` | MANGAKA (author) |
| - EDIT | (action) | `workflow.service.ts:1113` | MANGAKA (author) |
| - ARCHIVE | (action) | `workflow.service.ts:1158` | Owning MANGAKA or EDITOR (EIC); requires non-empty `reason` |

---

## 4. Series

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List series | `GET /api/series` | `series.controller.ts:102` | Non-Admin roles (scoped) |
| Create series | Automatic on finalized Board approval | `proposal-lifecycle.service.ts` | System transaction |
| Get series | `GET /api/series/:id` | `series.controller.ts:240` | Non-Admin roles (scoped) |
| Patch series | `PATCH /api/series/:id` | `series.controller.ts:246` | EDITOR, MANGAKA |
| Series lifecycle action | `POST /api/series/:id/actions/:action` | `series.controller.ts:272` | EDITOR, MANGAKA |
| - START_PRODUCTION | (action) | `series.controller.ts:281` | Owning Mangaka or assigned Tantou |
| - UNPUBLISH | (action) | `series.controller.ts:336` | Assigned Tantou only |
| - ARCHIVE | (action) | `series.controller.ts:344` | Owner or assigned Tantou while never published; assigned Tantou only once published |
| Delete series | `DELETE /api/series/:id` | `series.controller.ts:352` | MANGAKA (owner) |
| Series summary | `GET /api/series/:seriesId/summary` | `series.controller.ts:473` | Non-Admin roles (scoped) |
| Series activity | `GET /api/series/:seriesId/activity` | `series.controller.ts:485` | Non-Admin roles (scoped) |

---

## 5. Series Members

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List members | `GET /api/series/:seriesId/members` | `series.controller.ts:512` | Non-Admin roles (scoped) |
| Add member | `POST /api/series/:seriesId/members` | `series.controller.ts:520` | EDITOR, MANGAKA |
| Update member | `PATCH /api/series/:seriesId/members/:memberId` | `series.controller.ts:553` | EDITOR, MANGAKA |
| Remove member | `DELETE /api/series/:seriesId/members/:memberId` | `series.controller.ts:578` | EDITOR, MANGAKA |
| Invite assistant | `POST /api/series/:seriesId/invites` | `series.controller.ts:595` | EDITOR, MANGAKA |

---

## 6. Chapters

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List chapters (standalone) | `GET /api/chapters` | `series.controller.ts:690` | EDITOR, MANGAKA, ASSISTANT |
| Get chapter | `GET /api/chapters/:chapterId` | `series.controller.ts:647` | Non-Admin roles (scoped) |
| Patch chapter | `PATCH /api/chapters/:chapterId` | `series.controller.ts` | Owning MANGAKA |
| Chapter action | `POST /api/chapters/:chapterId/actions/:action` | `series.controller.ts:678` | EDITOR, MANGAKA, ASSISTANT |
| - START_DRAFT | (action) | `workflow.service.ts:1711` | Owner |
| - SUBMIT_REVIEW | (action) | `workflow.service.ts:1409,1422` | Owning MANGAKA only |
| - RESUBMIT | (action) | `workflow.service.ts:1409,1422` | Owning MANGAKA only |
| - REQUEST_REVISION | (action) | `workflow.service.ts:1713` | EDITOR |
| - REJECT | (action) | `workflow.service.ts:1714` | EDITOR |
| - EDITOR_APPROVE | (action) | `workflow.service.ts:1715` | EDITOR |
| - SCHEDULE | (action) | `workflow.service.ts:1728` | EDITOR |
| - POSTPONE | (action) | `workflow.service.ts:1729` | EDITOR |
| - PUBLISH | (action) | `workflow.service.ts:1730` | EDITOR |
| - REASSIGN | (action) | `workflow.service.ts:1731` | EDITOR |
| - ARCHIVE | (action) | `workflow.service.ts:1732` | EDITOR |
| List chapters (under series) | `GET /api/series/:id/chapters` | `series.controller.ts:405` | Non-Admin roles (scoped) |
| Create chapter (under series) | `POST /api/series/:id/chapters` | `series.controller.ts` | Owning MANGAKA |
| Get chapter pages | `GET /api/chapters/:chapterId/pages` | `series.controller.ts:724` | Non-Admin roles (scoped) |
| Chapter readiness | `GET /api/chapters/:chapterId/readiness` | `series.controller.ts:730` | Non-Admin roles (scoped) |
| List chapter reviews | `GET /api/chapters/:chapterId/reviews` | `series.controller.ts:753` | EDITOR, MANGAKA |

---

## 7. Pages

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| Create page | `POST /api/chapters/:chapterId/pages` | `series.controller.ts` | Owning MANGAKA |
| Update page | `PATCH /api/pages/:pageId` | `series.controller.ts` | Owning MANGAKA |
| Delete page | `DELETE /api/pages/:pageId` | `series.controller.ts` | Owning MANGAKA |

---

## 8. Studio Regions

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List regions | `GET /api/studio/regions` | `studio.controller.ts:152` | Non-Admin roles (scoped) |
| Create region | `POST /api/studio/regions` | `studio.controller.ts:161` | MANGAKA |
| Patch regions (bulk) | `PATCH /api/studio/regions` | `studio.controller.ts:169` | MANGAKA |
| Patch region | `PATCH /api/studio/regions/:id` | `studio.controller.ts:180` | MANGAKA |
| Delete region | `DELETE /api/studio/regions/:id` | `studio.controller.ts:212` | MANGAKA |

---

## 9. Studio Tasks

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List tasks | `GET /api/studio/tasks` | `studio.controller.ts:229` | Non-Admin roles (scoped) |
| Create task | `POST /api/studio/tasks` | `studio.controller.ts:242` | MANGAKA |
| Patch tasks (bulk) | `PATCH /api/studio/tasks` | `studio.controller.ts:343` | MANGAKA |
| Patch task | `PATCH /api/studio/tasks/:id` | `studio.controller.ts:350` | MANGAKA |
| Get task detail | `GET /api/tasks/:taskId` | `studio.controller.ts:392` | Non-Admin roles (scoped) |
| Get task detail (alias) | `GET /api/studio/tasks/:taskId` | `studio.controller.ts:392` | Non-Admin roles (scoped) |
| Task action | `POST /api/studio/tasks/:taskId/actions/:action` | `studio.controller.ts:398` | EDITOR, MANGAKA, ASSISTANT |
| - START | (action) | `workflow.service.ts:2105` | Assigned ASSISTANT |
| - CANCEL | (action) | `workflow.service.ts:2144` | MANGAKA |
| - BLOCK / MARK_BLOCKED | (action) | `workflow.service.ts:2152` | Assigned ASSISTANT |
| - UNBLOCK | (action) | `workflow.service.ts:2159` | Assigned ASSISTANT |
| - REASSIGN | (action) | `workflow.service.ts:2165` | MANGAKA |
| - REOPEN | (action) | `workflow.service.ts:2098` | Assigned ASSISTANT |
| Send to editor review | `POST /api/studio/chapters/:chapterId/send-editor-review` | `studio.controller.ts:409` | MANGAKA |

---

## 10. Submissions

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List submissions | `GET /api/submissions` | `submission.controller.ts:14` | Non-Admin roles (scoped) |
| Submit task work | `POST /api/tasks/:taskId/submit` | `submission.controller.ts:43` | ASSISTANT |
| Reopen task for revision | `POST /api/tasks/:taskId/reopen` | `submission.controller.ts:47` | ASSISTANT |
| Review queue (editor) | `GET /api/submissions/review-queue` | `submission.controller.ts:50` | EDITOR |
| Get submission | `GET /api/submissions/:submissionId` | `submission.controller.ts:73` | Non-Admin roles (scoped) |
| List task submissions | `GET /api/tasks/:taskId/submissions` | `submission.controller.ts:80` | Non-Admin roles (scoped) |
| Approve submission (Mangaka) | `POST /api/submissions/:submissionId/approve` | `submission.controller.ts:90` | MANGAKA |
| Reject submission (Mangaka) | `POST /api/submissions/:submissionId/reject` | `submission.controller.ts:102` | MANGAKA |
| Request revision (Mangaka) | `POST /api/submissions/:submissionId/request-revision` | `submission.controller.ts:114` | MANGAKA |
| ~~Create submission~~ | `POST /api/submissions` | `submission.controller.ts:29` | **DEPRECATED** (HTTP 410) |
| ~~Editor approve submission~~ | `POST /api/submissions/:submissionId/editor-approve` | `submission.controller.ts:36` | **DEPRECATED** (HTTP 410) |

---

## 11. Materials

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List materials | `GET /api/materials` | `material.controller.ts:17` | Non-Admin roles (scoped) |
| Create material | `POST /api/materials` | `material.controller.ts:26` | EDITOR, MANGAKA |
| Patch material | `PATCH /api/materials/:id` | `material.controller.ts:59` | EDITOR, MANGAKA |
| Add material version | `POST /api/materials/:id/versions` | `material.controller.ts:71` | EDITOR, MANGAKA |
| Delete material | `DELETE /api/materials/:id` | `material.controller.ts:94` | EDITOR, MANGAKA |

Material status transitions are enforced by `material.controller.ts` and
`authorization.service.ts`; legacy `metadata.status` is handled by the explicit
`migrate:material-status` dry-run/apply script.

---

## 12. Admin Materials (removed — CT-11)

`GET/POST /api/admin/materials`, `POST /api/admin/materials/:id/replace`,
`/archive`, `/restore` and their handlers were **deleted** by CT-11
(FLOW-GAP-04 — Resolved). Materials are managed exclusively through
`/api/materials*` by the owning Mangaka or assigned Tantou (see §11).

---

## 13. Voting Sessions (Board Governance)

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List voting sessions | `GET /api/voting-sessions` | `voting.controller.ts:54` | BOARD, EDITOR |
| Get voting session | `GET /api/voting-sessions/:id` | `voting.controller.ts:138` | BOARD, EDITOR |
| Create voting session | `POST /api/voting-sessions` | `voting.controller.ts:144` | BOARD (Chair) |
| Patch voting session | `PATCH /api/voting-sessions/:id` | `voting.controller.ts:256` | BOARD (Chair) |
| Close session | `POST /api/voting-sessions/:id/close` | `voting.controller.ts:292` | BOARD (Chair) |
| Cancel session | `POST /api/voting-sessions/:id/cancel` | `voting.controller.ts:298` | BOARD (Chair) |
| Tie-break vote | `POST /api/voting-sessions/:id/tie-break` | `voting.controller.ts:370` | EDITOR with `isEditorInChief=true` |
| Add session note | `POST /api/voting-sessions/:id/notes` | `voting.controller.ts:302` | EDITOR, BOARD |
| Patch session note | `PATCH /api/voting-sessions/:id/notes/:noteId` | `voting.controller.ts:324` | EDITOR, BOARD (author) |
| Delete session note | `DELETE /api/voting-sessions/:id/notes/:noteId` | `voting.controller.ts:351` | EDITOR, BOARD (author) |
| Decision history | `GET /api/board/decisions/history` | `voting.controller.ts:58` | BOARD, EDITOR |

---

## 14. Notifications

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List notifications | `GET /api/notifications` | `notification.controller.ts:33` | All (authed) |
| Mark read | `POST /api/notifications/:id/read` | `notification.controller.ts:44` | Owner only |
| Archive notification | `POST /api/notifications/:id/archive` | `notification.controller.ts:59` | Owner only |

---

## 15. Rankings

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List rankings | `GET /api/rankings` | `notification.controller.ts:74` | BOARD, EDITOR; MANGAKA scoped to owned Series |
| Import rankings | `POST /api/rankings/import` | `notification.controller.ts:120` | BOARD |
| List series rankings | `GET /api/series/:seriesId/rankings` | `notification.controller.ts:101` | BOARD, EDITOR; owning MANGAKA |

---

## 16. AI Processing

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| AI health check | `GET /api/ai/health` | `ai.controller.ts:158` | All (authed) |
| Detect bubbles (file) | `POST /api/ai/bubbles/detect` | `ai.controller.ts:163` | EDITOR, MANGAKA |
| Process bubbles (file) | `POST /api/ai/bubbles/process` | `ai.controller.ts:167` | EDITOR, MANGAKA |
| Detect page bubbles | `POST /api/studio/pages/:pageId/ai/detect-bubbles` | `ai.controller.ts:171` | Owning MANGAKA |
| Whiten page bubbles | `POST /api/studio/pages/:pageId/ai/whiten-bubbles` | `ai.controller.ts:246` | Owning MANGAKA |

---

## 17. File Management

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| Presign upload | `POST /api/files/presign-upload` | `series.controller.ts:831` | EDITOR, MANGAKA, ASSISTANT |
| Presign download | `POST /api/files/presign-download` | `series.controller.ts:861` | BOARD, EDITOR, MANGAKA, ASSISTANT |
| Display URL | `POST /api/files/display-url` | `series.controller.ts:869` | EDITOR, MANGAKA, ASSISTANT |
| Local upload (PUT) | `PUT /api/files/local-upload/:token` | `file-token.controller.ts:34` | All (token-authed) |
| Display file (GET) | `GET /api/files/display/:token` | `file-token.controller.ts:46` | All (token-authed) |

---

## 18. Tantou (Series Editor Assignment)

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| Get series editor | `GET /api/series/:seriesId/editor` | `tantou.controller.ts:7` | All (authed) |
| Assign series editor | `POST /api/series/:seriesId/editor` | `tantou.controller.ts:13` | EDITOR (EIC only) |
| Remove series editor | `DELETE /api/series/:seriesId/editor` | `tantou.controller.ts:20` | EDITOR (EIC only) |

---

## 19. Comments

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List comments | `GET /api/comments` | `studio.controller.ts:414` | Non-Admin roles (scoped) |
| Create comment | `POST /api/comments` | `studio.controller.ts:423` | EDITOR, MANGAKA, ASSISTANT |
| Patch comment | `PATCH /api/comments/:commentId` | `studio.controller.ts:441` | EDITOR, MANGAKA (author) |
| Resolve comment | `POST /api/comments/:commentId/resolve` | `studio.controller.ts:457` | Assigned Tantou (EDITOR) |
| Address comment | `POST /api/comments/:commentId/address` | `studio.controller.ts:470` | Owning MANGAKA |
| Reopen comment | `POST /api/comments/:commentId/reopen` | `studio.controller.ts:483` | Assigned Tantou (EDITOR), from `ADDRESSED`/`RESOLVED` |
| List task comments | `GET /api/comments/task/:taskId` | `studio.controller.ts:496` | Non-Admin roles (scoped) |

---

## 20. Admin � User Management

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List users | `GET /api/admin/users` | `admin.controller.ts:12` | ADMIN |
| Get user | `GET /api/admin/users/:userId` | `admin.controller.ts:17` | ADMIN |
| Create user | `POST /api/admin/users` | `admin.controller.ts:26` | ADMIN |
| Update user | `PATCH /api/admin/users/:userId` | `admin.controller.ts:40` | ADMIN |
| Deactivate user | `POST /api/admin/users/:userId/deactivate` | `admin.controller.ts:55` | ADMIN |
| Delete user | `DELETE /api/admin/users/:userId` | `admin.controller.ts:61` | ADMIN |

---

## 21. Admin � Notifications

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List managed notifications | `GET /api/admin/notifications` | `admin.controller.ts:67` | ADMIN |
| Create notification | `POST /api/admin/notifications` | `admin.controller.ts:76` | ADMIN |
| Patch notification | `PATCH /api/admin/notifications/:notificationId` | `admin.controller.ts:89` | ADMIN |
| Delete notification | `DELETE /api/admin/notifications/:notificationId` | `admin.controller.ts:109` | ADMIN |

---

## 22. Admin — Payroll / Earnings (removed — CT-11)

`GET /api/admin/payroll` and `POST /api/admin/payroll/:earningId/{confirm,mark-paid,void}`
and their handlers were **deleted** by CT-11 (already deprecated; FLOW-GAP-04 —
Resolved). Only `GET /api/assistant/earnings` (ASSISTANT — the owner's own
earnings) remains.

---

## 23. Admin — Workflow Overrides (removed — CT-11)

`POST /api/admin/workflow-overrides` and `POST /api/admin/override` and the
`executeOverride` handler were **deleted** by CT-11 (FLOW-GAP-04 — Resolved).

---

## 24. Admin � System

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| Workflow summary | `GET /api/admin/workflow-summary` | `admin.controller.ts:128` | ADMIN |
| Storage summary | `GET /api/admin/storage-summary` | `admin.controller.ts:132` | ADMIN |
| Reset demo data | `POST /api/admin/demo/reset` | `admin.controller.ts:192` | ADMIN |
| Clear demo data | `POST /api/admin/demo/clear` | `admin.controller.ts:198` | ADMIN |

---

## 25. Mobile Aliases (Editor/Board quick-access)

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| Editor review queue | `GET /api/editor/manuscripts/review-queue` | `mobile.controller.ts:17` | EDITOR |
| Start review | `POST /api/editor/series/:seriesId/start-review` | `mobile.controller.ts:49` | EDITOR |
| Request revision | `POST /api/editor/series/:seriesId/request-revision` | `mobile.controller.ts:52` | EDITOR |
| Reject series | `POST /api/editor/series/:seriesId/reject` | `mobile.controller.ts:55` | EDITOR |
| Forward to board | `POST /api/editor/series/:seriesId/forward-to-board` | `mobile.controller.ts:64` | EDITOR |
| Board queue | `GET /api/board/queue` | `mobile.controller.ts:20` | BOARD, EDITOR |
| Get board votes | `GET /api/board/series/:seriesId/votes` | `mobile.controller.ts:24` | BOARD, EDITOR |
| Cast vote | `POST /api/board/series/:seriesId/votes` | `mobile.controller.ts:67` | BOARD |
| Finalize decision | `POST /api/board/series/:seriesId/decisions/finalize` | `mobile.controller.ts:70` | BOARD (Chair) |
| Tie-break decision | `POST /api/board/series/:seriesId/decisions/tie-break` | `mobile.controller.ts:81` | EDITOR with `isEditorInChief=true` |
| At-risk decision | `POST /api/board/series/:seriesId/at-risk-decisions` | `mobile.controller.ts:85` | BOARD (Chair) |

---

## 26. Health / Readiness

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| Health check | `GET /health` | `app.ts:45` | Public |
| Readiness check | `GET /ready` | `app.ts:47` | Public |

---

## 27. Public Reader API (unauthenticated)

Read-only endpoints mounted **before** `requireAuth` (`routes/index.ts`). They
expose only series with `visibility: PUBLIC` that have at least one `PUBLISHED`
chapter; drafts, private series, and unpublished chapters are never returned.

| Capability | Method + Route | Key Files | Roles |
|---|---|---|---|
| List published series | `GET /api/public/series` | `public.controller.ts:55` | Public |
| Get published series | `GET /api/public/series/:slug` | `public.controller.ts:78` | Public |
| Get published chapter (with page images) | `GET /api/public/series/:slug/chapters/:chapterNumber` | `public.controller.ts:87` | Public |

Page image URLs are resolved through `file-access.service.createDisplayUrl`;
the reader receives display URLs only and never signed working-file URLs.

---

## Frontend Routes (React / TanStack Router)

| Route | Description | Primary Role |
|---|---|---|
| `/` | Landing / marketing page | Public |
| `/login` | Login page | Public |
| `/read` | Public reader — published series list, backed by `GET /api/public/series` | Public |
| `/read/:slug` | Public reader series view, backed by `GET /api/public/series/:slug` | Public |
| `/read/:slug/:chapter` | Public reader chapter view with page images, backed by `GET /api/public/series/:slug/chapters/:chapterNumber` | Public |
| `/app` | App shell | All (authed) |
| `/app/dashboard` | Role-aware dashboard | All |
| `/app/admin/*` | Admin section (dashboard, users, rates, notifications) | ADMIN |
| `/app/editor/*` | Editor section (proposals, review, chapters, publications, series, dashboard, notifications) | EDITOR |
| `/app/board/*` | Board section (proposals, sessions, queue, rankings, at-risk, decisions, dashboard, notifications) | BOARD |
| `/app/mangaka/*` | Mangaka section (submissions review) | MANGAKA |
| `/app/assistant/*` | Assistant section (tasks, submissions, series studio, earnings, dashboard, notifications) | ASSISTANT |
| `/app/series/*` | Series list and detail (tabs) | All (authed) |
| `/app/tasks` | Tasks view | All (authed) |
| `/app/submissions/*` | Submissions list and detail | All (authed) |
| `/app/rankings` | Rankings view | MANGAKA, EDITOR, BOARD |
| `/app/notifications` | Notifications view | All (authed) |

---

*Generated from backend route registrations (`routes/*.ts`), controller handlers (`controllers/*.ts`), and workflow service logic (`services/workflow.service.ts`).*
