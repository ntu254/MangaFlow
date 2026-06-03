# MF-028 Sidebar Layout Wiring

## Current Behavior

The page layout in various workspaces was using separate inline layouts and headers, causing visual inconsistency.

## Target Behavior

A unified `AppShell` with `RoleSidebar` and `AppHeader` controls the page layout for all 5 roles:
- Admin
- Board
- Editor
- Mangaka
- Assistant

## Affected Users

- All roles (Admin, Board, Editor, Mangaka, Assistant)

## Affected Product Docs

- `docs/04_frontend_routes_ui_screens.md`
