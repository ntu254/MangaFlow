# Overview

## Current Behavior

MangaFlow currently has only Phase 0 foundation behavior:

- `client/` renders a minimal Vite shell.
- `server/` exposes `GET /api/health`.
- `ai-service/` exposes `GET /health`.
- There is no Clerk integration.
- There is no MongoDB connection or internal user model.
- There are no protected routes, route guards, or authenticated API endpoints.

## Target Behavior

MangaFlow has an authenticated identity foundation:

- The client can initialize Clerk and represent signed-in, signed-out, and
  onboarding-pending states.
- The backend can verify Clerk session tokens.
- The backend can idempotently sync a Clerk user into an internal MongoDB user
  record.
- `GET /api/auth/me` returns the current internal user and onboarding/redirect
  state through the standard API response envelope.
- Missing or invalid auth returns `401`.
- Suspended users are blocked from protected product APIs.
- No user can grant themselves privileged roles.

## Affected Users

- Signed-out visitor.
- Newly signed-in user without an assigned role.
- Admin.
- Mangaka.
- Assistant.
- Editor.
- Board member.

## Affected Product Docs

- `docs/product/auth-user-sync.md`
- `docs/product/roles-permissions.md`
- `docs/product/api-storage-data.md`
- `docs/product/architecture.md`
- `docs/product/mvp-roadmap.md`

## Non-Goals

- Full role/permission matrix implementation.
- Series-level membership authorization.
- Admin user management UI.
- Domain CRUD beyond internal user sync.
- Storage/R2/MinIO authorization.
- AI service authorization.
- Production Vercel/Railway deployment.

## Decisions Before Implementation

- Users without roles are stored with `systemRole: null`.
- Onboarding can request `MANGAKA` or `ASSISTANT`, but it cannot assign a role.
- Integration tests mock the Clerk verifier at the backend boundary and use
  repository-level fakes for auth service behavior. Runtime code still wires
  Mongoose and MongoDB for the real application path.

See `docs/decisions/0008-auth-user-sync-boundary.md`.
