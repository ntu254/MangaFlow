# Execution Plan

## Selected Skill Pack

- HI-OS governance
- Backend/API
- Database/data lifecycle
- Auth/security
- Validation
- Vercel and Build Web Apps frontend routing/component guidance

## Selected Docs

- `AGENTS.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/CONTEXT_RULES.md`
- `docs/TRACE_SPEC.md`
- `docs/product/overview.md`
- `docs/product/requirements.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-admin.md`
- `docs/contracts/payroll.md`
- `docs/architecture/overview.md`
- `docs/architecture/database.md`
- `docs/architecture/api.md`
- `docs/architecture/auth.md`
- `docs/architecture/security.md`
- `docs/validation/test-plan.md`

## Lane

high-risk

## Risks

- UI copy could imply real payment execution instead of tracking.
- Admin actions could appear to override creative approval gates.
- Frontend could duplicate payroll formula instead of displaying backend fields.
- Missing proof that Admin receives the correct payroll list scope.

## Implementation Plan

1. Register MF-HIOS-094 in Harness and local story docs.
2. Add admin payroll client types and API methods for existing payroll endpoints.
3. Add Admin payroll hook with summary derivation and guarded action handlers.
4. Add payroll table and page at `/app/admin/payroll`.
5. Replace Admin payroll placeholder route with the real page.
6. Add backend regression proof for Admin list scope.
7. Add verification script and update backlog/matrix evidence.

## Validation Plan

1. `npm run lint --prefix server`
2. `npm run build --prefix server`
3. `npm run test --prefix server -- payroll`
4. `npm run lint --prefix client`
5. `npm run build --prefix client`
6. `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-094.ps1`
7. `scripts/bin/harness-cli.exe story verify MF-HIOS-094`
