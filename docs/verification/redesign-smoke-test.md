# Redesign Smoke Test

Verification workflow for the Table + CommandBar + Detail Drawer redesign and the
Admin Earnings populate fix. Run this before migrating further admin pages.

## Preconditions

- A running dev MongoDB whose database already contains the standard test users:
  `mangaka@mangaflow.local`, `editor@mangaflow.local`, `board@mangaflow.local`,
  `assistant@mangaflow.local` (password = email for each). Only the admin user is
  created by `npm --prefix server run seed`; the role users must already exist in
  the dev DB.

## Automated checks

```bash
# 1. Start the API server (leave running)
npm --prefix server run dev

# 2. Full golden-path workflow at the API level
#    series proposal -> editor -> board approval -> chapter production ->
#    task execution -> review/comments -> approval -> payroll calculate+confirm ->
#    readiness -> ranking
npx tsx server/scripts/test-e2e.ts

# 3. Earnings populate check (covers what the e2e does not: the list-populate
#    shape and the mark-paid mutation path). Run after test-e2e.ts, which leaves
#    a CONFIRMED earning for mark-paid to act on.
npx tsx server/scripts/verify-earnings-populate.ts
```

## Manual browser smoke (client dev server on :5173)

1. **Mangaka Dashboard → Series Hub → tabs deep-link** — tab selection reflects
   in the URL and deep-links restore the correct tab.
2. **Editor Review Queue → select item → detail pane updates** — selecting a row
   updates the master/detail pane without a full navigation.
3. **Page Studio / Task Studio → sidebar hidden + canvas bleed** — the app sidebar
   is hidden and the canvas bleeds to the workspace edges.
4. **Admin Earnings → populated assistant/task data persists after Mark as paid** —
   rows show assistant name/email + task title/type/status; after "Mark as paid"
   the drawer keeps the populated data (no fallback to raw ids).
