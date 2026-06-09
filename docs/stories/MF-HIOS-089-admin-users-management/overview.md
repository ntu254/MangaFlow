# Overview

## Story

MF-HIOS-089 Admin Users Management

## Status

implemented

## Lane

high-risk

## Goal

Expose backend-enforced Admin user-management HTTP routes and wire `/app/admin/users` to a real Admin users page for listing, creating, changing role, and activating/suspending users.

## Scope

In scope:

- Backend `GET /api/admin/users`.
- Backend `POST /api/admin/users`.
- Backend `PATCH /api/admin/users/:userId/role`.
- Backend `PATCH /api/admin/users/:userId/status`.
- Admin-only route protection via `requireAuth` + `requireRole("ADMIN")`.
- Existing self-suspend guard remains backend-owned.
- Frontend admin users page, hook, table, and dialog against real endpoints.

Out of scope:

- Board decision override.
- Publication, review, payroll, or file access behavior.
- New roles outside the canonical role enum.
- Audit-log implementation beyond existing token revocation behavior.

## High-risk reason

This story touches role update and account activation/suspension endpoints.
