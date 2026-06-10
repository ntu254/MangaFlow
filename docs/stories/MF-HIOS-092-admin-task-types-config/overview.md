# Overview

## Story

MF-HIOS-092 Admin Task Types Config

## Status

implemented

## Lane

high-risk

## Goal

Expose backend-enforced Admin task-type configuration routes and wire `/app/admin/task-types` to a real Admin page for listing, creating, updating, activating/deactivating, and safely deleting TaskType records.

## Scope

In scope:

- Backend `GET /api/admin/task-types`.
- Backend `POST /api/admin/task-types`.
- Backend `PATCH /api/admin/task-types/:taskTypeId`.
- Backend `PATCH /api/admin/task-types/:taskTypeId/status`.
- Backend `DELETE /api/admin/task-types/:taskTypeId`.
- Admin-only route protection via `requireAuth` + `requireRole("ADMIN")`.
- Used TaskType records are deactivated instead of hard-deleted.
- Frontend `/app/admin/task-types` page, hook, table, and dialog.

Out of scope:

- Payroll formula changes.
- Task assignment workflow changes.
- Task rate history/versioning.
- Mangaka/Editor task-type management UI.
- Audit-log implementation beyond existing service behavior.

## High-risk reason

This story touches Admin-only workflow configuration, public API routes, and TaskType deletion behavior. It must preserve the invariant that used TaskType records are not hard-deleted.
