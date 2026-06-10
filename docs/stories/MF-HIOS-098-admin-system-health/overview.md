# Overview

## Story

MF-HIOS-098 Admin System Health

## Status

implemented

## Lane

normal

## Goal

Wire `/app/admin/system-health` to a read-only Admin health page using the existing Admin dashboard summary and public API health endpoint.

## Scope

In scope:

- Admin System Health page at `/app/admin/system-health`.
- `GET /api/dashboard/admin/sidebar-summary` client reuse for backend-owned service status.
- `GET /api/health` client check for API health.
- Loading, error, empty, summary, and refresh states.
- UI copy that states storage, AI service, and runtime checks are backend-owned.

Out of scope:

- New backend health endpoints.
- Storage object listing.
- Signed URL access.
- Direct AI service calls from frontend.
- Audit-log persistence or workflow override actions.

## Risk reason

This page is adjacent to storage, AI, and runtime hardening boundaries. It must remain read-only and must not expose private file or AI service access from the frontend.
