# CT-11 / FLOW-GAP-04 — Reduce Admin Scope — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Reduce ADMIN to the confirmed-necessary scope full-stack, resolving FLOW-GAP-04 / CT-11.

**Architecture:** Backend guard/route edits (some remove `ADMIN` → `403`; some delete admin-only routes+handlers); frontend admin UI cleanup; Postman + tests; docs. No `410` deprecation shim.

**Tech Stack:** Node ESM / Express / Mongoose; Vitest + Supertest; React + TanStack Router + Vite; Playwright; Postman + `verify-postman-contract.mjs`.

## Global Constraints

- Confirmed scope is the spec `docs/superpowers/specs/2026-07-27-ct11-admin-scope-design.md` (read it — it has the exact KEEP/REMOVE lists, the §3.1 series matrix, and the removal style). Do not expand scope.
- **KEEP unchanged:** `/admin/users*`, `/admin/notifications*`, `/admin/workflow-summary`, `/admin/storage-summary`, `/admin/rates*` (MANAGE_RATE_TABLE), Chair/EIC designation via `updateUser`.
- **Removal style:** shared routes → remove `ADMIN` from the role guard (Admin gets `403 FORBIDDEN`); admin-only removed capabilities (materials, payroll, overrides) → delete routes + handlers + dead service code; proposal claim/archive → `assertProposalAction`; demo → mount only when `NODE_ENV !== "production"` + service backstop.
- **Tantou assign/remove → EIC only** (`role === "EDITOR" && isEditorInChief`), not BOARD/ADMIN.
- **Series §3.1 matrix:** START_PRODUCTION owner/Tantou; UNPUBLISH Tantou-only; ARCHIVE owner-or-Tantou while never public, Tantou-only once public; delete owner-only.
- **Proposal:** RELEASE_CLAIM/REASSIGN_CLAIM → EIC only; ARCHIVE → owning Mangaka or EIC, require non-empty `reason` + audit; drop the ADMIN branch.
- Canonical backend test command: `npm test` (from `backend/`). Frontend: `npm run lint`/`typecheck`/`build`, `npx playwright test`. Contract: `node scripts/verify-postman-contract.mjs`. Architecture: `npm run audit:architecture`.
- Per-commit TDD: write/adjust the test → run → implement → run focused + relevant regression → commit green. Each commit = code + its tests + the directly-affected docs. No red commit.
- Seeded logins (password === email): ADMIN `admin@beachread.jp`, Board Chair `board@beachread.jp`, EIC `tanaka@beachread.jp` (EDITOR isEditorInChief), Tantou EDITOR `editor@mangaflow.local` (id `u-mobile-editor`), MANGAKA `inoue@beachread.jp`.

---

### Task 1: Backend capability/action guards (shared routes → Admin 403)

**Files:**
- Modify: `backend/src/routes/notification.routes.ts` (rankings import), `backend/src/routes/tantou.routes.ts`, `backend/src/routes/series.routes.ts`, `backend/src/controllers/series.controller.ts` (`seriesLifecycleAction`), `backend/src/services/workflow.service.ts` (`assertProposalAction`), the file presign-download guard (`series.controller.ts` presign handlers / `authorization.service.ts` `assertFileKeyVisible`).
- Test: `backend/src/__tests__/authorization-perimeter.test.ts` (extend) or new `admin-scope.test.ts`.
- Docs: none in this task (docs land in Task 5) — except keep commit self-contained if a flow doc line is trivially tied; otherwise defer to Task 5.

- [ ] **Step 1: Write failing negative-authorization tests**

Add tests asserting ADMIN now gets `403` (and the canonical actor still succeeds) for: rankings import, tantou assign/remove (also assert general BOARD non-chair… BOARD member without EIC is now rejected → 403), series `START_PRODUCTION`/`UNPUBLISH`/`ARCHIVE`, proposal `RELEASE_CLAIM`/`REASSIGN_CLAIM`/`ARCHIVE`, file presign-download. Use the seeded logins. Example shape:

```ts
it("rejects ADMIN importing rankings (403)", async () => {
  const admin = await loginAs("admin@beachread.jp");
  await request(createApp()).post("/api/rankings/import")
    .set("Authorization", `Bearer ${admin.accessToken}`)
    .send({ period: "2026-W30", source: "SURVEY", rows: [{ seriesId: "s-x", score: 9 }] })
    .expect(403);
});
```

- [ ] **Step 2: Run and confirm expected failure** (`npx vitest run src/__tests__/<file>` from `backend/`) — currently Admin succeeds.

- [ ] **Step 3: Implement the guard changes**

- `notification.routes.ts` rankings import: `requireRole("BOARD", "ADMIN")` → `requireRole("BOARD")`.
- `tantou.routes.ts:12-13`: replace `requireRole("BOARD", "ADMIN")` with an EIC guard — `requireRole("EDITOR")` plus an in-handler/middleware check `isEditorInChief`, or a dedicated `requireEditorInChief`. Tantou assign/remove now EIC-only.
- `series.routes.ts:43,46,67,74,88,109`: remove `"ADMIN"` from the role lists.
- `series.controller.ts seriesLifecycleAction`: implement §3.1. START_PRODUCTION: `isOwner || (EDITOR && series.editorId === actor.id)` (drop ADMIN/generic EDITOR). UNPUBLISH: assigned Tantou only. ARCHIVE: if `PUBLIC_SERIES_STATUSES.has(status)` → assigned Tantou only; else owner **or** assigned Tantou. Return `MANGAKA_OWNER_REQUIRED`/`TANTOU_ASSIGNMENT_REQUIRED` as appropriate.
- `assertProposalAction` (`workflow.service.ts`): RELEASE_CLAIM/REASSIGN_CLAIM branch `actor.role !== "ADMIN" && !(EDITOR&&EIC)` → `!(EDITOR&&EIC)` (EIC only). ARCHIVE branch `requireMutationRole(actor,["ADMIN"])` → allow owning Mangaka (`proposal.authorId === actor.id`) or EIC; require `payload.reason` non-empty (else `400 REASON_REQUIRED`) and audit.
- File presign-download: remove `ADMIN` from the allowed roles / `assertFileKeyVisible` so Admin no longer bypasses resource scope.

- [ ] **Step 4: Run focused tests to green.**
- [ ] **Step 5: Regression** — `npm run lint`; `npx vitest run src/__tests__/authorization-perimeter.test.ts src/__tests__/tantou.test.ts src/__tests__/board.test.ts src/__tests__/admin.test.ts src/__tests__/workflow.test.ts`. Update any test that relied on Admin performing these (use the canonical actor). Note each change.
- [ ] **Step 6: Commit** `fix(CT-11): restrict Admin from workflow/content actions (rankings, tantou, series, proposal, files)`.

---

### Task 2: Delete admin-only removed routes, handlers, and dead service code

**Files:**
- Modify: `backend/src/routes/admin.routes.ts` (delete materials `:50-54`, payroll `:47,55-57`, overrides `:58-59`; gate demo `:60-61`), `backend/src/controllers/admin.controller.ts` (remove payroll handlers, `executeOverride`; keep users/notifications/summaries/demo), `backend/src/controllers/material.controller.ts` (remove admin material handlers), `backend/src/server.ts` or `app.ts` if demo mount is conditional there, any now-unused imports.
- Test: `backend/src/__tests__/admin.test.ts`.

- [ ] **Step 1: Write/adjust tests** — deleted routes return `404` (e.g. `POST /api/admin/materials`, `/api/admin/payroll`, `/api/admin/workflow-overrides`); demo routes: mounted in test/dev, and a unit/guard test that the demo handler/service refuses when `NODE_ENV==="production"`.
- [ ] **Step 2: Run and confirm failure.**
- [ ] **Step 3: Implement** — delete the route lines + their handler functions + any dead helpers only they used. Register demo routes only when `NODE_ENV !== "production"`; add the service/handler env backstop. Remove now-dead imports so `npm run lint` (tsc) stays clean.
- [ ] **Step 4: Focused tests green.**
- [ ] **Step 5: Regression** `npm run lint` + `npx vitest run src/__tests__/admin.test.ts`.
- [ ] **Step 6: Commit** `fix(CT-11): remove admin-only materials/payroll/override routes; gate demo to non-production`.

---

### Task 3: Frontend admin UI cleanup

**Files:**
- Remove routes: `src/routes/app.admin.materials.tsx`, `app.admin.payroll.tsx`, `app.admin.workflows.tsx`, `app.admin.series.tsx`, `app.admin.audit.tsx`. Keep `app.admin.dashboard.tsx`, `app.admin.users.tsx`, `app.admin.rates.tsx`, `app.admin.notifications.tsx`, `app.admin.index.tsx`, `app.admin.tsx`.
- Modify: `src/shared/config/navigation.ts` (drop removed nav entries), `src/shared/api/{account,governance,media,workflow}.ts` (remove client fns for deleted endpoints), regenerate `src/routeTree.gen.ts`.

- [ ] **Step 1:** Remove the pages, drop their nav entries, delete the API client functions that call removed/forbidden endpoints; regenerate the route tree (TanStack Router codegen via `npm run dev`/build or the router CLI).
- [ ] **Step 2:** `npm run lint` + `npm run typecheck` + `npm run build` — fix any dangling imports/links so the admin section builds with only the kept pages.
- [ ] **Step 3:** Verify the admin nav shows only Dashboard, Users, Rates, Notifications (no dead links).
- [ ] **Step 4: Commit** `fix(CT-11): remove admin UI for de-permissioned capabilities`.

---

### Task 4: Postman parity + finalize negative-authorization tests

**Files:**
- Modify: `postman/MangaFlow-API.postman_collection.json` (remove deleted routes), `scripts/verify-postman-contract.mjs` (update expected counts), backend authz tests as needed.

- [ ] **Step 1:** Remove the deleted admin routes from the Postman collection; update the route-parity baseline in `verify-postman-contract.mjs`.
- [ ] **Step 2:** Run `node scripts/verify-postman-contract.mjs` → parity OK.
- [ ] **Step 3:** Ensure the backend negative-authz suite (Task 1/2) fully covers: Admin 403 on each de-permissioned action; 404 on each deleted route; EIC-only tantou; series matrix (owner vs Tantou vs published); proposal ARCHIVE reason-required + owner/EIC.
- [ ] **Step 4:** `npm test` (backend) green.
- [ ] **Step 5: Commit** `test(CT-11): postman parity + admin negative-authorization coverage`.

---

### Task 5: Documentation / evidence sync

**Files:** `docs/CODE-TODO.md`, `docs/business-flows/INDEX.md`, `docs/DESIGN.md`, `docs/business-flows/{02-proposal-lifecycle,03-series-lifecycle,09-rankings,11-file-management,08-earnings}.md`, `docs/reports/ADMIN-SCOPE-UPDATE.md`, and a new `docs/reports/2026-07-27-ct11-admin-scope-completion.md`.

- [ ] **Step 1:** CODE-TODO CT-11 → **Done** + implemented write-up; compliance-matrix "Admin role boundary" → **PASS (implemented)**.
- [ ] **Step 2:** INDEX gap register FLOW-GAP-04 → **Resolved**; roles table + Admin invariant now enforced. DESIGN §7 Admin boundary → implemented; §17 ADR row → Implemented.
- [ ] **Step 3:** In each flow doc, change "Admin removed by FLOW-GAP-04 / CT-11" notes to "enforced"; record the kept exceptions (dashboards, demo dev-only, managed notifications, RateTable) and the moved actors (tantou→EIC, series matrix, proposal claim/archive→EIC/owner).
- [ ] **Step 4:** Write the completion report (what changed, kept exceptions, verification evidence).
- [ ] **Step 5: Commit** `docs(CT-11): mark FLOW-GAP-04 resolved and sync admin-scope docs`.

---

### Task 6: Full verification (final gate — not a code commit)

- [ ] Backend: `npm test` (from `backend/`) + `npm run lint`/`build` — green; record command+result.
- [ ] Frontend: `npm run lint`/`typecheck`/`build` + `npx playwright test` — green.
- [ ] Contract: `node scripts/verify-postman-contract.mjs` — parity OK.
- [ ] Architecture: `npm run audit:architecture` — exit 0.
- [ ] Open one PR to `main` summarizing the kept/removed Admin scope, actor moves (tantou→EIC, series matrix, proposal→EIC/owner), demo-in-prod behavior, and all verification commands/results.

## Self-review checklist

- Admin KEEP set untouched (users, notifications, summaries, rates, Chair/EIC designation).
- Every removed capability: shared → 403; admin-only → 404; verified by tests.
- Tantou = EIC only; series matrix (published nuance) enforced; proposal ARCHIVE reason+audit; RELEASE/REASSIGN = EIC.
- Demo routes absent in production (`NODE_ENV`), with a service backstop.
- Frontend admin section builds and shows only kept pages; no dead API calls.
- Postman parity green; docs mark FLOW-GAP-04/CT-11 resolved with the kept-exception list.
