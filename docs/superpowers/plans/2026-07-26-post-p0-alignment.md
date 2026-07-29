# Post-P0 docs and architecture alignment plan

> Scope: continue the canonical workflow hardening after P0 CT-01/CT-02/CT-03.
> Source of truth: `BUSINESS_CANONICAL_FLOW.md`, `docs/business-flows/`,
> `docs/CODE-TODO.md`, and the current backend/frontend contracts.

## Audit baseline

- Backend: layered Express/Mongoose app, with workflow logic still concentrated in
  `backend/src/services/workflow.service.ts` and schemas concentrated in
  `backend/src/db/models.ts`.
- Web: feature-sliced under `src/entities`, `src/features`, `src/shared`, and
  `src/routes`; this boundary is already aligned with the documented frontend shape.
- Mobile: focused Expo Board/Editor shell with API-ready domain adapters.
- AI service: isolated FastAPI service; local verification is currently blocked by
  the missing `pytest` package in the active Python environment.
- Initial verification baseline: web build, backend typecheck, mobile typecheck, and
  mobile tests passed; web lint had Prettier failures in five files. Those formatting
  failures were fixed as part of this wave, and the final web lint now passes.

## Confirmed documentation gaps

| Item | Evidence | Decision |
| --- | --- | --- |
| CT-04 outbox scheduling | `processOutboxBatch` has no production caller | Implement a bounded in-process runner owned by server lifecycle, with explicit event delivery and retry logging. |
| CT-05 stale submission code | stale `expectedCurrentSubmissionId` check emits `CONFLICT` | Change to `CURRENT_SUBMISSION_CONFLICT` and add an integration assertion. |
| CT-06 ownership taxonomy | chapter/task/comment ownership paths mix `FORBIDDEN` and specific codes | Keep `FORBIDDEN` for role/type denials; use `MANGAKA_OWNER_REQUIRED` and `TANTOU_ASSIGNMENT_REQUIRED` for record assignment failures. |
| CT-09 region lock state | release paths and schema still use `RELEASED` | Migrate stored values and make all write paths use binary `UNLOCKED`/`LOCKED`. |
| CT-07/08/10 legacy cleanup | frontend and seed/migration code referenced `blocking`, `FIXED`, and review aliases | Migrate legacy comments, remove the runtime/client aliases, and reject removed task actions before workflow execution. |

## Implementation sequence

### 1. Establish the runtime boundary

- Add `backend/src/jobs/outbox-runner.ts` for interval, single-flight execution,
  bounded batches, graceful stop, and structured result logging.
- Add `backend/src/services/outbox-delivery.service.ts` as the concrete handler for
  the event types currently emitted by workflow transactions.
- Add explicit `OUTBOX_*` environment settings and start/stop the runner from
  `server.ts`, leaving `createApp()` side-effect free for tests.
- Add focused runner/delivery tests, including a success path and dead-letter path.

### 2. Align API error contracts

- Change the stale submission guard to `CURRENT_SUBMISSION_CONFLICT`.
- Normalize ownership failures at chapter actions, task mutation/submission review,
  and Mangaka comment addressing.
- Keep pure role denials as `FORBIDDEN` and preserve the existing HTTP status/messages.

### 3. Canonicalize region lock lifecycle

- Add an idempotent `migrate:region-lock-status` script with dry-run output and
  `--apply` mode for `RELEASED` → `UNLOCKED`.
- Change schema/type/write paths to the canonical binary enum.
- Add a region lifecycle assertion that an approved/rejected/cancelled task releases
  the region as `UNLOCKED` and permits the next assignment.

### 4. Remove legacy contracts after migration coverage

- CT-07 uses `migrate:canonical-comments` to copy legacy blocking values and remove
  the old field before the schema/runtime cleanup.
- CT-08 maps stored `FIXED` comments to `ADDRESSED`, then removes the status from
  backend and client contracts.
- CT-10 removes the five decision aliases from `TASK_ACTIONS`; chapter review
  actions remain a separate canonical contract and are not conflated with task
  actions.

### 5. Structural follow-up

- Document the target backend shape (`routes → controllers → services/jobs → db`)
  and keep new background work in `jobs/` instead of adding more responsibilities to
  `server.ts` or `workflow.service.ts`.
- Split `workflow.service.ts` by aggregate only in a later bounded change, preserving
  public function names and test seams. This avoids a risky mass move during contract
  hardening.

## Acceptance gates

- Focused CT-04/05/06/09 tests pass.
- Backend lint/typecheck and full Vitest suite pass.
- Web build passes; existing web lint failures are either fixed mechanically or
  reported explicitly.
- Mobile typecheck/tests pass.
- Docs and `docs/CODE-TODO.md` status/evidence match the implemented behavior.
- No unrelated worktree changes are overwritten.

## Completion evidence (2026-07-26)

- CT-07/08/10 cleanup is implemented with the idempotent
  `migrate:canonical-comments` command; run it with `--apply` before deployment.
- Web lint/build, backend lint/build, mobile typecheck, and mobile tests pass.
- Backend focused comment-authority tests pass (10/10), P0 workflow tests pass
  (33/33), and the full serial Vitest suite passes.
- Remaining legacy literals exist only in the one-off migration and regression
  fixtures so old production data can be converted and the boundary can be tested.

## Follow-up business-flow alignment (2026-07-26)

- Material status is now a first-class validated API field. The documented
  transition matrix is enforced: owner/assigned Tantou may activate or archive;
  assigned Tantou alone may approve from `ACTIVE`/`IN_REVIEW`; invalid direct
  `DRAFT -> APPROVED` transitions are rejected.
- `backend/src/scripts/migrate-material-status.ts` provides a dry-run by default,
  explicit `--dry-run`/`--apply`, invalid-value reporting, legacy-key cleanup, and
  idempotent reruns. Production migration remains intentionally unrun.
- Chapter readiness UI now trusts the backend readiness result and canonical
  `StudioComment` data; local `reviewNotes`, assignee, and deadline fields no
  longer override the documented submission guards.
- Studio comment UI permissions now match the assigned-Tantou rules, and resolve/
  reopen actions use their canonical endpoints. The obsolete direct status-patch
  hook was removed.
- Follow-up checks: material/migration tests 9/9, frontend contract tests 4/4,
  material/comment/P0 tests PASS, full backend suite PASS, web lint/build PASS,
  backend lint/build PASS, and mobile lint/tests PASS.
