# CT-11 / FLOW-GAP-04 — Admin Scope Reduction — Completion Report

**Date:** 2026-07-27
**Branch:** `fix/ct11-admin-scope`
**Status:** Implemented (Resolved)
**Design spec:** `docs/superpowers/specs/2026-07-27-ct11-admin-scope-design.md`
**Implementation plan:** `docs/superpowers/plans/2026-07-27-ct11-admin-scope.md` (Tasks 1-5)

## Summary

Admin is reduced to the genuinely-necessary account-administrator surface,
full-stack: backend guards/routes, frontend admin UI, Postman collection, and
tests. This resolves FLOW-GAP-04 (CT-11 in `docs/CODE-TODO.md`).

## What changed

### Deleted (routes + handlers, no `410` shim)
- Admin materials: `GET/POST /api/admin/materials`, `POST /api/admin/materials/:id/replace`,
  `/archive`, `/restore`.
- Admin payroll: `GET /api/admin/payroll`, `POST /api/admin/payroll/:earningId/confirm`,
  `/mark-paid`, `/void` (already deprecated before this change).
- Workflow overrides: `POST /api/admin/workflow-overrides`, `POST /api/admin/override`
  (`executeOverride` handler removed).

### Restricted (Admin removed from a shared route's role guard — 403 for Admin)
| Route | Before | After |
|---|---|---|
| `POST /rankings/import` | BOARD, ADMIN | **BOARD only** |
| `POST/DELETE /series/:id/editor` (tantou assign/remove) | BOARD, ADMIN | **EIC only** (`role === "EDITOR" && isEditorInChief`) — general BOARD also removed |
| `POST /series/:id/actions/START_PRODUCTION` | +ADMIN | Owning Mangaka or assigned Tantou |
| `POST /series/:id/actions/UNPUBLISH` | +ADMIN | Assigned Tantou only |
| `POST /series/:id/actions/ARCHIVE` | +ADMIN | Owner or assigned Tantou while never published; **assigned Tantou only** once published |
| `DELETE /series/:id` | +ADMIN | Owning Mangaka only |
| `POST /proposals/:id/actions/RELEASE_CLAIM`, `REASSIGN_CLAIM` | +ADMIN | EIC only (`assertProposalAction`) |
| `POST /proposals/:id/actions/ARCHIVE` | ADMIN only | Owning Mangaka (author) or EIC; requires non-empty `reason`; writes an audit entry |
| `POST /files/presign-download` | +ADMIN | Resource owner/member/reviewer scope only (BOARD, EDITOR, MANGAKA, ASSISTANT) |

### Environment-gated (not deleted, not role-restricted)
- `POST /api/admin/demo/reset`, `POST /api/admin/demo/clear`: the routes are
  mounted only when `NODE_ENV !== "production"` (404 in production); the
  handler/service layer keeps its own environment guard as a backstop.

### Kept unchanged (the confirmed-necessary Admin surface)
- `/admin/users*` — list, get, create, update (incl. `isChair`/`isEditorInChief`
  designation with uniqueness and clear-on-role-change), deactivate, guarded delete.
- `/admin/notifications*` — managed/system notification broadcast.
- `GET /admin/workflow-summary`, `GET /admin/storage-summary` — read-only dashboards.
- `/admin/rates*` — `MANAGE_RATE_TABLE` (RateTable configuration), unrelated to
  payroll and explicitly out of CT-11 scope.

### Frontend
- Removed admin pages whose backing routes were deleted or de-permissioned:
  `app.admin.materials.tsx`, `app.admin.payroll.tsx`, `app.admin.workflows.tsx`,
  `app.admin.series.tsx`, `app.admin.audit.tsx` (no audit API ever existed);
  removed their `navigation.ts` entries and the now-dead client functions in
  `shared/api/{account,governance,media,workflow}.ts`; regenerated
  `routeTree.gen.ts`.
- Kept: `app.admin.dashboard.tsx`, `app.admin.users.tsx`, `app.admin.rates.tsx`,
  `app.admin.notifications.tsx`, `app.admin.index.tsx`, `app.admin.tsx` shell.
- Rankings import stayed a BOARD page (`app.board.rankings.import.tsx`),
  unchanged.

## Actor moves (who owns the action now)

| Capability | Moved to |
|---|---|
| Tantou (series editor) assign/remove | Editor-in-Chief only |
| Series `START_PRODUCTION` | Owning Mangaka or assigned Tantou |
| Series `UNPUBLISH` | Assigned Tantou only |
| Series `ARCHIVE` | Owner-or-Tantou pre-publish; Tantou-only once published |
| Series delete | Owning Mangaka only |
| Proposal `RELEASE_CLAIM` / `REASSIGN_CLAIM` | Editor-in-Chief only |
| Proposal `ARCHIVE` | Owning Mangaka or Editor-in-Chief (reason required) |
| Rankings import | Board only |
| File presign-download | Resource owner/member/reviewer only |

## Demo-in-production behavior

`backend/src/routes/admin.routes.ts` only registers the two demo routes when
`env.NODE_ENV !== "production"`, so a production deployment returns `404` for
`POST /api/admin/demo/reset` and `POST /api/admin/demo/clear` — the routes do
not exist in the router at all in that environment. The underlying
service/handler carries an additional environment check as defense in depth in
case the route is ever mounted unconditionally in a future change.

## Verification evidence

- **Backend full suite:** `npm test` (from `backend/`) — **276/276 passing**.
  `admin.test.ts` and `authorization-perimeter.test.ts` were updated/extended to
  assert the deleted routes 404 and that Admin receives 403 on rankings-import,
  tantou-assign, series lifecycle, and proposal claim/archive actions.
- **Postman contract parity:** `node scripts/verify-postman-contract.mjs` —
  **137/138 OK** after removing the 11 deleted-route entries from
  `postman/MangaFlow-API.postman_collection.json` and updating the expected
  counts in the verify script.
- **Frontend:** `npm run lint`, `npm run typecheck`, `npm run build` — green;
  the admin route bundle now produces 4 chunks (dashboard, users, rates,
  notifications) instead of the prior larger set.

## Kept exceptions (explicit, not oversights)

- Read-only dashboards (`workflow-summary`, `storage-summary`) — account
  administrators need visibility, not workflow control.
- Demo data reset/clear — development/staging convenience, structurally
  inaccessible in production.
- Managed notifications — system-broadcast is an account-administration
  concern, not editorial workflow.
- `RateTable` (`MANAGE_RATE_TABLE`) — an explicit current-MVP exception
  (TECH-FINDING-08 / CT-12), intentionally not touched by this change.

## Traceability

- `docs/CODE-TODO.md` — CT-11 marked Done; compliance matrix "Admin role
  boundary" → PASS (implemented).
- `docs/business-flows/INDEX.md` — FLOW-GAP-04 → Resolved; roles table and
  invariant 16 updated; route tables reflect the restricted/deleted state.
- `docs/DESIGN.md` — §7 Admin boundary marked Implemented; §17 ADR row →
  Implemented; §16 known gaps updated.
- `docs/business-flows/{02-proposal-lifecycle,03-series-lifecycle,09-rankings,11-file-management,08-earnings}.md` —
  per-flow role tables and FLOW-GAP-04 notes updated to "Resolved".
- `docs/reports/ADMIN-SCOPE-UPDATE.md` — updated with the implemented result
  and kept exceptions.
