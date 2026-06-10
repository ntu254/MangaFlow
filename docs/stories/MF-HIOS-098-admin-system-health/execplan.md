# Execution Plan

## Selected Skill Pack

- HI-OS governance
- UI
- Backend/API read-only contract review
- Auth/security boundary review
- Validation
- Build Web Apps and Vercel frontend verification guidance

## Selected Docs

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-admin.md`
- `docs/contracts/admin-dashboard.md`
- `docs/architecture/overview.md`
- `docs/architecture/api.md`
- `docs/architecture/security.md`
- `docs/architecture/storage.md`
- `docs/validation/test-plan.md`

## Lane

normal

## Risks

- UI could imply Admin can perform runtime/security actions that are not implemented.
- UI could imply direct storage object or signed URL access.
- UI could imply frontend-to-AI-service calls.
- Health status could be faked outside backend-owned summary fields.

## Implementation Plan

1. Add client API helper for `GET /api/health`.
2. Add `useAdminSystemHealth` hook that loads health and Admin dashboard summary in parallel.
3. Add `/app/admin/system-health` page with read-only status cards and boundary notes.
4. Replace the System Health placeholder route with the real page.
5. Validate client/server lint and build.

## Validation Plan

1. `npm run lint --prefix client`
2. `npm run build --prefix client`
3. `npm run lint --prefix server`
4. `npm run build --prefix server`
5. `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-098.ps1`
