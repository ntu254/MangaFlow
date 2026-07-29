# Admin Scope Documentation Update

**Status: Implemented** (FLOW-GAP-04 / CT-11 — Resolved on `fix/ct11-admin-scope`;
see `docs/reports/2026-07-27-ct11-admin-scope-completion.md` for the full record).

Canonical Admin scope is now limited to:

- user list, detail, creation, update, deactivation and guarded deletion;
- assigning `isChair` to one active BOARD user;
- assigning `isEditorInChief` to one active EDITOR user.

Admin does not perform Proposal, Series, Chapter, Material, Ranking, payroll,
Notification, file or Board workflow actions. This is now enforced in code, not
just documented:

- **Deleted** (routes + handlers): admin materials (`/admin/materials*`), admin
  payroll (`/admin/payroll*`), workflow overrides (`/admin/workflow-overrides`,
  `/admin/override`).
- **Restricted** (Admin removed from the role guard, canonical actor unchanged
  or moved): rankings import → BOARD only; tantou assign/remove → **EIC only**
  (not general BOARD); series lifecycle → owning Mangaka/assigned Tantou per the
  §3.1 matrix (START_PRODUCTION owner-or-Tantou, UNPUBLISH Tantou-only, ARCHIVE
  owner-or-Tantou pre-publish then Tantou-only, delete owner-only); proposal
  `RELEASE_CLAIM`/`REASSIGN_CLAIM` → EIC only; proposal `ARCHIVE` → owning
  Mangaka or EIC (requires non-empty `reason` + audit); file presign-download →
  resource owner/member/reviewer scope only.

**Kept exceptions** — the genuinely-necessary account-administrator surface:
`/admin/users*` (incl. Chair/EIC designation via `updateUser`),
`/admin/notifications*` (managed/system notifications),
`GET /admin/workflow-summary` and `GET /admin/storage-summary` (read-only
dashboards), `/admin/rates*` (`MANAGE_RATE_TABLE`), and
`/admin/demo/{reset,clear}` (mounted only when `NODE_ENV !== "production"`,
with a handler-level environment guard as a backstop — 404 in production).

Admin also has no canonical audit console or system-configuration module; the
dashboards are read-only summaries, and the demo-data workflow exists only
outside production. Historical records retained by business workflows do not
create an Admin audit responsibility.
