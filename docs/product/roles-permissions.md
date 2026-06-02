# Roles and Permissions

## System Roles

| Role | Product responsibility |
| --- | --- |
| `ADMIN` | Manage users, roles, settings, task rates, storage visibility, and operational dashboards. |
| `MANGAKA` | Own series, submit manuscripts, manage chapters/pages, assign tasks, and review assistant work. |
| `ASSISTANT` | Complete assigned production tasks and submit work for review. |
| `EDITOR` | Review manuscripts/pages, comment, request revision, approve work, and support publication readiness. |
| `BOARD` | Vote on series approval, review ranking, and finalize publication or cancellation decisions. |

## Series-Level Roles

System roles are not enough for all access. A user can also have a series-level
membership that controls what they can do inside one series.

| Series role | Intended use |
| --- | --- |
| `OWNER` | Main mangaka or series owner. |
| `COLLABORATOR` | Trusted contributor with limited series access. |
| `ASSIGNED_ASSISTANT` | Assistant with access only to assigned tasks and related assets. |
| `ASSIGNED_EDITOR` | Editor responsible for reviewing the series. |

## Access Rules

- Authentication is required for all `/app/*` product routes except public
  auth and error pages.
- The backend is the source of truth for permissions.
- Frontend route guards improve UX but do not replace backend enforcement.
- Admin can manage users and system settings, but product workflow actions
  should still respect domain rules.
- Mangaka can manage their own series and production work.
- Assistants can only access assigned tasks, related regions, related assets,
  their submissions, and their earnings.
- Editors can review assigned series and approve or request revisions according
  to workflow state.
- Board members can vote on eligible series. The board chair finalizes board
  decisions.

## Role Assignment Boundary

Users cannot grant themselves system roles. After `MF-001`, signed-in users
without an assigned role remain pending with `systemRole: null`. Onboarding may
record a requested role, but role assignment must happen through an admin-owned
flow.

The first role assignment story is `MF-002`. It should let admins review pending
users, assign a valid `systemRole`, suspend users, and reactivate users without
introducing series-level permissions.

## Redirect Rules

After Clerk login, the client calls `/api/auth/me` and redirects by internal
role:

| Role | Redirect |
| --- | --- |
| `ADMIN` | `/app/admin/dashboard` |
| `MANGAKA` | `/app/mangaka/dashboard` |
| `ASSISTANT` | `/app/assistant/dashboard` |
| `EDITOR` | `/app/editor/dashboard` |
| `BOARD` | `/app/board/dashboard` |

Users without an assigned role go to `/app/onboarding`.

## Permission Non-Goals for Phase 0

Phase 0 foundation scaffolding must not implement Clerk auth, role checks,
series permissions, or onboarding. Those require their own story packets and
validation.
