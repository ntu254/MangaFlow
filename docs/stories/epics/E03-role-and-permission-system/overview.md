# Overview

## Current Behavior

The system syncs user roles from Clerk but does not enforce RBAC natively on the backend (except inside specific routes manually). The frontend manually conditionally renders based on roles but lacks a robust declarative guard component.

## Target Behavior

The system will enforce system-wide and series-level Role-Based Access Control using declarative backend middlewares (`requireSystemRole`, `requireSeriesRole`) and frontend route wrappers (`RoleGuard`).

## Affected Users

- All roles (Admin, Mangaka, Editor, Assistant, Board).

## Affected Product Docs

- `docs/06_mvp_task_breakdown.md`

## Non-Goals

- Dynamically changing roles without Admin review.
- Complex attribute-based access control (ABAC).
