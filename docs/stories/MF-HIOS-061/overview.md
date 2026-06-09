# Overview

## Current Behavior

MangaFlow docs already define private storage, task-scoped Assistant access, backend-owned permissions, and no base64 AI output in MongoDB, but the implementation gap remains high-risk:

- server bootstrap still allows unsafe defaults and mixed seed/startup concerns.
- Assistant access boundaries risk drifting if series membership checks are reused for workspace or file access.
- Signed URL/file access policy is not yet documented as a dedicated backend access-policy surface.
- AI service currently returns base64 and allows broad CORS in local source.
- Runtime env strictness and fail-fast startup expectations are under-specified.

## Target Behavior

Before more workflow/API wiring, MangaFlow should have a documented hardening slice that locks the runtime and security contracts for:

- strict production env validation
- fail-fast MongoDB startup
- no hardcoded admin credentials in source
- AccessPolicy-based Assistant/task/file/page access enforcement
- signed URL permission checks
- AI service backend-only access boundary and temporary base64 handling rule
- UTF-8 source/doc normalization where mojibake exists

## Affected Users

- Admin
- Mangaka
- Assistant
- Editor
- Board
- Operators/Developers

## Affected Product Docs

- `docs/contracts/main.md`
- `docs/contracts/auth.md`
- `docs/contracts/page-workspace.md`
- `docs/contracts/task-assignment.md`
- `docs/contracts/ai-bubble-translation.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/architecture/storage.md`
- `docs/architecture/deployment.md`
- `docs/operations/env.md`
- `docs/validation/test-plan.md`

## Non-Goals

- New product workflow features.
- OpenAPI/client generation.
- Realtime notifications.
- Public reader/catalog behavior.
- Broad UI redesign.
