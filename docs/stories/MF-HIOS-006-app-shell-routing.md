# MF-HIOS-006 App Shell, Routing, and Layout Components

## Status

in_progress

## Lane

normal

## Task Type

Frontend layout component implementation and route configuration.

## Product Contract

Implement the MangaFlow app shell, layout components, and route configuration. Create PageShell, AppNavbar, RoleSidebar, MarketingNavbar, and MarketingFooter as reusable shared components. Set up all routes with the correct layout wrappers.

## Selected Docs

- `docs/design/layout-patterns.md`
- `docs/design/component-system.md`
- `docs/contracts/ui-main.md`
- `docs/architecture/folder-structure.md`

## Acceptance Criteria

- PageShell exists as a reusable layout wrapper
- AppNavbar exists with role-aware navigation
- RoleSidebar exists with role-specific menu items
- MarketingNavbar and MarketingFooter exist for the public landing page
- All routes are configured: /, /login, /register, /dashboard, /series, /series/:id, /chapters/:id, /workspace/:chapterId, /tasks, /review, /board, /admin
- Routes use correct layout wrappers (marketing, auth, dashboard)
- No duplicated sidebar/navbar logic per role
- npm run build passes

## Implementation Plan

1. Create `MarketingNavbar` component
2. Create `MarketingFooter` component
3. Create `AppNavbar` component with role-based menu items
4. Create `RoleSidebar` component with role-specific navigation
5. Create `PageShell` layout wrapper with optional sidebar
6. Create `MarketingLayout` wrapper
7. Create `AuthLayout` wrapper
8. Create `DashboardLayout` wrapper with sidebar + navbar
9. Create route configuration with lazy-loaded page placeholders
10. Create placeholder page components for all routes
11. Build and verify

## Validation Plan

| Layer | Expected proof |
| --- | --- |
| Integration | App builds without errors |
| Platform | All routes render correct layout |
