# CT-11 / FLOW-GAP-04 — Reduce Admin Scope — Design

**Date:** 2026-07-27
**Type:** Full-stack behavior change (backend permissions + frontend admin UI + Postman + tests + docs)
**Branch:** `fix/ct11-admin-scope` (from `main` @ 8abccfa) → PR(s) to `main`
**Canonical source:** FLOW-GAP-04, `docs/CODE-TODO.md` CT-11, `docs/reports/ADMIN-SCOPE-UPDATE.md`

---

## 1. Goal

Reduce the ADMIN role to the genuinely-necessary capabilities and remove the broad
workflow/content permissions it currently holds, resolving FLOW-GAP-04 / CT-11. Scope is
full-stack: backend guards/routes, frontend admin UI, Postman collection, tests, and docs.
Guiding rule (user): **keep only what an account administrator truly needs.**

## 2. Confirmed decisions

### KEEP (Admin genuinely needs)
- **User account lifecycle:** `/admin/users` list, get, create, update, deactivate, guarded delete.
- **Board Chair designation** via `updateUser` (`isChair` for active BOARD; uniqueness;
  clear on role change/deactivation). Admin assigns the flag but never executes the
  designee's workflow actions.
- **RateTable admin:** `/admin/rates` list/create/patch (the `MANAGE_RATE_TABLE` capability).
- **Read-only system dashboards:** `GET /admin/workflow-summary`, `GET /admin/storage-summary`.
- **Managed notifications:** `/admin/notifications` list/create/patch/delete (system broadcast).
- **Demo data reset/clear:** `/admin/demo/reset`, `/admin/demo/clear` — the routes are
  **only mounted when `NODE_ENV !== "production"`** (production returns `404`), and the
  service/handler additionally enforces an environment guard as defense in depth.

### REMOVE Admin permission
| Capability | Current | Action |
|---|---|---|
| Admin materials (upload/replace/archive/restore) | `/admin/materials*` ADMIN | **Delete routes + handlers** (materials belong to Mangaka/Tantou via `/api/materials`) |
| Payroll (list/confirm/mark-paid/void) | `/admin/payroll*` ADMIN | **Delete routes + handlers** (already deprecated) |
| Workflow overrides | `/admin/workflow-overrides`, `/admin/override` ADMIN | **Delete routes + handler** (dangerous, non-canonical) |
| Rankings import | `POST /rankings/import` BOARD,ADMIN | Remove ADMIN → **BOARD only** |
| Tantou assign/remove | `/series/:id/editor` BOARD,ADMIN | Remove ADMIN and general BOARD → owning Mangaka only |
| Series lifecycle | `START_PRODUCTION`/`UNPUBLISH`/`ARCHIVE`/delete ADMIN | Remove ADMIN; see the per-action matrix in §3.1 |
| Proposal claim mgmt | `RELEASE_CLAIM`/special reassignment ADMIN | Remove ADMIN → claiming Editor releases; another Editor can claim after release |
| Proposal ARCHIVE | `ARCHIVE` ADMIN-only | Remove ADMIN → owning Mangaka only; require `reason` + audit |
| File presign-download | ADMIN in role list / visibility | Remove ADMIN → resource owner/member/reviewer only |

## 3. Removal style

- **Shared routes** (rankings, tantou, series lifecycle, file download): remove `ADMIN` from
  the role guard so Admin receives `403 FORBIDDEN`; the route stays for canonical roles.
- **Admin-only removed capabilities** (materials, payroll, overrides): **delete the routes and
  their handlers** (and the frontend pages). Clean removal — no `410` deprecation window
  (internal course project, not a public API with external clients).
- **Proposal claim release:** only the Editor who owns the claim can release it; there is no
  special reassignment action.
- **Proposal `ARCHIVE`:** remove the ADMIN branch; allow the owning Mangaka (author) only.
  Require a non-empty `reason` and write an audit entry.
- **Tantou assign/remove (`/series/:id/editor`):** owning Mangaka only; the target must be an
  active `EDITOR`, and removal is blocked while review workload remains.
- **Demo reset/clear:** the routes are **only registered when `NODE_ENV !== "production"`**
  (production → `404`), and the handler/service enforces the same environment guard as a
  backstop.

### 3.1 Series lifecycle per-action matrix (canonical)

| Action | Canonical actor | Notes |
|--------|-----------------|-------|
| `START_PRODUCTION` | owning Mangaka or assigned Tantou | requires an approved source Proposal |
| `UNPUBLISH` | **assigned Tantou only** | |
| `ARCHIVE` | owner **or** assigned Tantou **while never published**; **assigned Tantou only** once the Series has been published | a published Series may only be archived by the Tantou |
| delete | owning Mangaka (private/no-related-data guard) | |

ADMIN is removed from all of the above.

## 4. Backend changes (evidence from current code)

- `routes/admin.routes.ts:50-54` (materials), `:47,55-57` (payroll), `:58-59` (overrides) —
  delete. `:60-61` (demo) — **register only when `NODE_ENV !== "production"`**. Keep `:37-46`
  (users+notifications), `:48-49` (summaries).
- Remove the now-unrouted handlers: admin material handlers (`material.controller.ts`),
  payroll handlers, `executeOverride` (`admin.controller.ts`). Demo handlers/service keep an
  environment-guard backstop.
- `routes/notification.routes.ts:20` rankings import → `requireRole("BOARD")`.
- `routes/tantou.routes.ts:12-13` → owning Mangaka only, not BOARD/ADMIN.
- `routes/series.routes.ts:43,46,67` (lifecycle/delete) and `:74,88,109` (file/presign) —
  remove `ADMIN`; `series.controller.ts` `seriesLifecycleAction` (`:282,330` region) — enforce
  the §3.1 matrix: `START_PRODUCTION` owner/Tantou, `UNPUBLISH` Tantou-only, `ARCHIVE`
  owner-or-Tantou while never published else Tantou-only, delete owner-only.
- `routes/proposal.routes.ts:23,28` role list may stay broad, but `assertProposalAction`
  (`workflow.service.ts`) enforces claiming-Editor release and owning-Mangaka archive, with
  a non-empty `reason` and audit.
- File visibility: remove `ADMIN` from `assertFileKeyVisible` / presign-download role list.

## 5. Frontend changes

- **Remove admin pages** whose backing routes are deleted or de-permissioned:
  `app.admin.materials.tsx`, `app.admin.payroll.tsx`, `app.admin.workflows.tsx`,
  `app.admin.series.tsx`, `app.admin.audit.tsx` (no audit API exists). Regenerate
  `routeTree.gen.ts`.
- **Keep:** `app.admin.dashboard.tsx` (summaries), `app.admin.users.tsx`,
  `app.admin.rates.tsx`, `app.admin.notifications.tsx`, `app.admin.index.tsx`,
  `app.admin.tsx` shell.
- `shared/config/navigation.ts` — drop nav entries for removed pages.
- `shared/api/{account,governance,media,workflow}.ts` — remove client functions for the
  removed endpoints so nothing calls a deleted/forbidden route.
- Rankings import stays a **BOARD** page (`app.board.rankings.import.tsx`), unchanged.

## 6. Postman + tests

- **Postman:** remove deleted routes from `postman/MangaFlow-API.postman_collection.json`;
  update the expected counts in `scripts/verify-postman-contract.mjs` so parity passes.
- **Backend tests:** update `admin.test.ts` (drop tests for deleted routes; assert removed
  routes now 404) and `authorization-perimeter.test.ts`; add focused assertions that Admin
  gets `403` on rankings-import, tantou-assign, series lifecycle, proposal claim, and
  file-download, and that demo reset is blocked in a production-like env.
- Full backend suite (`npm test`) green.

## 7. Documentation sync

Update to reflect FLOW-GAP-04 / CT-11 **Resolved/Done**:
- `docs/CODE-TODO.md` — CT-11 status Done + implemented write-up; compliance matrix
  "Admin role boundary" → PASS.
- `docs/business-flows/INDEX.md` — gap register FLOW-GAP-04 → Resolved; roles table + Admin
  invariants updated to enforced.
- `docs/DESIGN.md` §7 (Admin boundary now enforced), §17 ADR row → Implemented.
- Flow docs whose "FLOW-GAP-04 / Admin removed by CT-11" notes become "enforced":
  `03-series-lifecycle.md`, `09-rankings.md`, `11-file-management.md`, `08-earnings.md`,
  `02-proposal-lifecycle.md`.
- `docs/reports/ADMIN-SCOPE-UPDATE.md` — note the kept exceptions (dashboards, demo, managed
  notifications, proposal ARCHIVE, RateTable).

## 8. Verification

Backend full suite; `npm run lint`/`build`; frontend `lint`/`typecheck`/`build`/Playwright;
`node scripts/verify-postman-contract.mjs`; `npm run audit:architecture`. Record commands +
results in the PR.

## 9. Risks & notes

- **Seed/demo data** may assume Admin performed some of the removed actions — update seed or
  the affected tests to use the canonical actor.
- **Postman parity count** changes when routes are deleted — update the baseline in the same
  change so the contract check stays green.
- **RateTable admin** (`MANAGE_RATE_TABLE`) is intentionally retained; not touched here.
- Kept dashboards/demo/notifications/ARCHIVE are explicit "necessary" exceptions recorded in
  the docs so the canonical boundary is unambiguous.

## 10. Out of scope

No new Admin capabilities; no dedicated Operations role (future); `MANAGE_RATE_TABLE`,
localStorage token risk, and the rate limiter are unchanged. No `410` deprecation shim.
