# Overview

## Story

MF-HIOS-090 Admin Board Members

## Status

in_progress

## Lane

high-risk

## Goal

Expose backend-enforced Admin board-member management routes and wire `/app/admin/board-members` to a real Admin page for listing, adding, activating/deactivating members, and assigning Board Chair.

## Scope

In scope:

- Backend `GET /api/admin/board-members`.
- Backend `POST /api/admin/board-members`.
- Backend `PATCH /api/admin/board-members/:userId/status`.
- Backend `PATCH /api/admin/board-members/:userId/chair`.
- Frontend `/app/admin/board-members` page and dialog.

Out of scope:

- Board voting/finalization behavior.
- Admin override of Board decisions.
- New Board workflow rules.

## High-risk reason

Touches admin-only membership and chair assignment for the Board boundary.
