# MF-018 Page Workspace Comment Panel UI

## Current Behavior

The backend (MF-017) supports a robust Comment data model and status transitions. However, the frontend Page Workspace only has basic annotation support without real-time comment streams, workflow transition controls (Mark Fixed, Verify Fixed, Resolve, Reopen), or role-based action buttons in the workspace sidebar.

## Target Behavior

Implement the Comment Panel UI in the Page Workspace sidebar. When a user selects a page or annotation target, they see a list of comments with status badges. Users can submit new comments. Depending on their system role and series-level role, users can trigger transition operations:
- Assistant can click `Mark Fixed`.
- Mangaka can click `Verify Fixed`.
- Editor or Admin can click `Resolve` or `Reopen`.

## Affected Users

- Assistant
- Mangaka
- Editor
- Admin

## Affected Product Docs

- `docs/06_mvp_task_breakdown.md`
- `docs/04_frontend_routes_ui_screens.md`

## Non-Goals

- E2E browser tests (deferred until Google OAuth authentication is mocked in E2E).
- Real-time WebSockets synchronization of comments (polling or react-query cache invalidation is sufficient).
- Notification list integration.
