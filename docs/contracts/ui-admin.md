# UI Contract: Admin UI

## Applies To

```txt
Admin Dashboard
Admin Sidebar
User Management
Board Member Management
Series Monitor
Task Type Config
Task Rate Config
Payroll Tracking
Storage Monitor
AI Service Monitor
Audit Logs
System Health
Notifications
```

## Required Components

```txt
PageShell
MFCard
MFTable
MFBadge
MFButton
MFDialog
StatusBadge
RoleSidebar
RoutePlaceholderPage
```

## Admin Role Boundary

Admin is a system operator, not a creative workflow approver.

```txt
Admin manages users, access configuration, workflow configuration, audit, storage, payroll tracking, AI/service health, and system warnings.
Admin must not be presented as the person who approves publication, reviews manuscripts, final-approves submissions, or votes/finalizes Board decisions.
```

## Sidebar Groups

MVP Admin sidebar should stay compact and grouped by system-management purpose:

```txt
Overview
- Dashboard -> /app/admin/dashboard

User & Access
- Users -> /app/admin/users
- Board Members -> /app/admin/board-members

Content Management
- Series -> /app/admin/series

Workflow Config
- Task Types -> /app/admin/task-types
- Task Rates -> /app/admin/task-rates

Finance
- Payroll -> /app/admin/payroll

System
- Storage -> /app/admin/storage
- AI Service -> /app/admin/ai-service
- Audit Logs -> /app/admin/audit-logs
- System Health -> /app/admin/system-health

Notifications
- Notifications -> /app/notifications

Logout
- action only
```

Phase-later Admin sidebar items:

```txt
Roles & Permissions -> /app/admin/permissions
Chapters -> /app/admin/chapters
Manuscripts -> /app/admin/manuscripts
Publication Rules -> /app/admin/publication-rules
```

## Sidebar Badges

Badges should reflect backend-owned summary data when available. Until a dedicated endpoint exists, badges may be conservative placeholders as long as they do not claim false business authority.

```txt
Users: suspended users count
Series: pending/review count
Board Members: missing chair warning
Task Types: inactive/misconfigured count
Task Rates: misconfigured count
Payroll: pending confirmation count
Storage: warning if near limit
AI Service: unhealthy/pending-integration status
Audit Logs: critical events count
System Health: error/warning count
Notifications: unread count
```

## Rules

```txt
Admin UI can be data-dense but must not break visual style.
Tables must be wrapped in MFCard.
Danger actions require confirmation.
System health uses clear status badges.
Sidebar labels must reflect system administration, not Mangaka/Editor/Board workflow ownership.
Admin monitor routes can use placeholders before backend wiring, but copy must state backend-owned permissions and workflow boundaries.
```

## Done Criteria

```txt
[ ] Tables use consistent spacing and badges.
[ ] Create/Edit dialogs use shared form components.
[ ] Danger actions confirm before applying.
[ ] Empty/loading/error states exist.
[ ] Admin sidebar uses grouped system-management sections.
[ ] Admin MVP sidebar includes Dashboard, Users, Series, Board Members, Task Types, Task Rates, Payroll, Storage, AI Service, Audit Logs, System Health, Notifications, and Logout.
[ ] Admin sidebar does not include publication approval, manuscript review, or Board vote actions.
[ ] Admin placeholder copy does not imply Admin can override Board, Editor, publication readiness, or payroll rules.
```
[//]: # (Validation section appended by MF-HIOS-004.)

## Validation

- Uses `PageShell`, `MFCard`, `MFButton`, `MFBadge`, and shared admin dashboard components.
- Admin UI does not imply Admin can override Board decisions.
- Uses design tokens for color, radius, shadow, and spacing.
- Empty, loading, error, and confirmation states are represented.
- Admin sidebar routes are protected by the Admin route guard.
- UI review checklist passes.
