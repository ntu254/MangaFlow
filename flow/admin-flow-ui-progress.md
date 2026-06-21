# Admin Flow UI Progress

## 2026-06-21 - Admin role flow refresh

Requested admin flow:

Admin Login -> Dashboard -> Users -> Board Members -> Task Rates -> Payroll -> Storage -> Audit Logs -> Settings -> Logout.

Implemented UI scope:

- Sidebar now gives Admin a system-focused navigation lane:
  - Dashboard
  - Users
  - Board Members
  - Task Rates
  - Payroll
  - Storage
  - Audit Logs
  - Settings
- Admin production/editor/board menu entries were removed from the Admin sidebar view so the role does not mix with Mangaka, Editor, or Board workspaces.
- Added `client/src/routes/app/admin/user-management.tsx`
  - View users
  - Search by name/email/team/notes
  - Filter by role/status
  - View detail panel
  - Change role
  - Change status
  - Create/delete remains available from existing admin user API
- Added `client/src/routes/app/admin/board-members.tsx`
  - View board members
  - Add active BOARD user as member
  - Remove/restore board permission via membership active status
  - Set/change Board Chair
- Added `client/src/routes/app/admin/task-rates.tsx`
  - View task rates from `/admin/task-types`
  - Create rate
  - Update rate
  - Disable/enable rate
- Added `client/src/routes/app/admin/payroll.tsx`
  - View payroll earnings from `/payroll/earnings`
  - Review assistant earnings
  - Confirm pending payroll by task id
  - Mark confirmed earning as paid
- Added `client/src/routes/app/admin/storage.tsx`
  - View storage usage from current file asset records
  - View uploaded files
  - Check file status via `/admin/reconcile-files`
  - Review unused working-file candidates
- Added `client/src/routes/app/admin/audit-logs.tsx`
  - View system logs from `/audit-logs`
  - Filter by action, actor id, target id
  - Inspect user action metadata
- Added `client/src/routes/app/admin/settings.tsx`
  - View/update/save system config, currently AI service URL and session-minute display config.
- Added API/query helpers:
  - `client/src/shared/api/admin.ts`
  - `client/src/shared/api/payroll.ts`
  - `client/src/shared/queries/useAdmin.ts`

Notes:

- Existing `client/src/routes/app/admin/users.tsx` could not be patched through the sandbox helper, so the updated Users flow lives at `/app/admin/user-management` and sidebar points there.
- Existing `/app/payroll` remains for non-admin/editor use; admin sidebar now points to `/app/admin/payroll`.
- Storage file listing still uses current mock file asset records because there is no backend endpoint for a global file asset list yet.

## 2026-06-21 - SaaS admin dashboard visual refresh

Design direction applied:

- Hybrid Linear/Vercel + Retool admin console.
- Dark-first graphite control-plane look.
- Dense operational layout with low-shadow cards, thin borders, consistent blue/green/amber/red status semantics.

Implemented:

- Replaced `client/src/features/dashboard/components/AdminDash.tsx` demo dashboard with a real admin command center:
  - System hero with operational status.
  - Active users, Board seats, Task Rates, and Storage metric cards.
  - Action queue linked to admin modules.
  - System health panel.
  - Quick actions.
  - Recent audit activity preview.
- Admin dashboard now reads current admin queries where available:
  - users
  - board members
  - task rates
  - audit logs
  - file asset storage footprint
- Updated `DashboardView` so Admin no longer gets the generic welcome header above the new command center.
- Added admin-specific CSS classes in `client/src/styles.css`:
  - `.admin-console`
  - `.admin-hero`
  - `.admin-metric`
  - `.admin-panel`
  - `.admin-pill`
  - quick action and action queue styles

Verification:

- `npm --prefix client run build` passed.

## 2026-06-21 - Admin module SaaS skin pass

Implemented:

- Applied the admin SaaS console visual layer to all admin subpages:
  - `/app/admin/user-management`
  - `/app/admin/board-members`
  - `/app/admin/task-rates`
  - `/app/admin/payroll`
  - `/app/admin/storage`
  - `/app/admin/audit-logs`
  - `/app/admin/settings`
- Added `.admin-page` styling in `client/src/styles.css` so existing admin CRUD surfaces inherit the same graphite SaaS system:
  - dark card/background skin
  - thin low-contrast borders
  - dark inputs/selects/options
  - primary button/accent calibration
  - consistent 8px radius
  - tactile button active state
  - muted text calibration inside admin pages

Verification:

- `npm --prefix client run build` passed after applying the skin to all admin modules.

## 2026-06-21 - Theme-aware admin color correction

Issue:

- The graphite SaaS skin was hardcoded, so light mode stayed visually dark while the rest of the app used the cream/card theme. This made admin pages feel disconnected from the current global theme.

Fix:

- Added a final theme-aware admin override in `client/src/styles.css`.
- Light mode now derives admin colors from existing app tokens:
  - `--background`
  - `--card`
  - `--foreground`
  - `--primary`
  - `--border`
- Dark mode keeps the graphite SaaS look through `.dark .admin-console`.
- Admin text, cards, panels, inputs, selects, borders, primary buttons, white utility classes, and quick-action rows now resolve through admin CSS variables instead of fixed white/graphite values.

Verification:

- `npm --prefix client run build` passed.

## 2026-06-22 - Admin color system unified with app theme

Issue:

- Admin tabs/pages and the sidebar still had a slight color mismatch because admin used a separate graphite palette plus later theme overrides.
- Dark mode and light mode could feel like two different surface systems inside the same app shell.

Fix:

- Reworked `client/src/styles.css` so `.admin-console` variables now derive from the global app theme tokens only:
  - `--background`
  - `--card`
  - `--foreground`
  - `--muted-foreground`
  - `--border`
  - `--primary`
- Removed the separate hardcoded dark graphite override for admin surfaces.
- Kept the SaaS admin feel through layout, borders, radius, low-contrast layers, hover states, and semantic status colors.
- Updated `client/src/features/dashboard/components/AdminDash.tsx` to use theme-neutral Tailwind tokens instead of `text-white`, `bg-white/*`, `border-white/*`, and `divide-white/*`.

Verification:

- `npm --prefix client run build` passed.
- Targeted ESLint on `AdminDash.tsx` passed; `styles.css` is ignored by the current ESLint config.
- Full `npm --prefix client run lint` still fails due to existing unrelated repo-wide lint/prettier/type issues.
