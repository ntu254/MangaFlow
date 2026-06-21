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
