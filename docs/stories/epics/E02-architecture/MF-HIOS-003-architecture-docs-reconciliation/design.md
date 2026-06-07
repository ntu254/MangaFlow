# Design

## Approach

Keep the existing architecture choices:

- React/Vite frontend.
- Node.js/Express/TypeScript backend.
- MongoDB Atlas with Mongoose.
- Cloudflare R2 storage and MinIO local development.
- Separate Python FastAPI AI service.
- Vercel frontend deployment and Railway backend/AI deployment.

Clarify the documents so future implementation stories can select backend,
database, auth/security, UI, deployment, or AI plugins without re-deciding the
architecture.

## Non-Goals

- No application scaffold.
- No database migration.
- No auth implementation.
- No API endpoint implementation.
- No package script creation.
- No reader/library architecture.

## Validation Design

Add `scripts/verify-architecture-docs.py` as a deterministic docs-only check.
The verifier should fail if the architecture docs reintroduce reader/library
scope, omit production-only boundary statements, drift from ADR 0001-0003, or
drop critical security/storage invariants.
