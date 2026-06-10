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
- `docs/contracts/task-assignment.md`
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

- Accidentally changing payroll calculation semantics.
- Accidentally implying default-rate edits update existing task snapshots.
- Accidentally broadening TaskType lifecycle behavior from the rates page.
- Missing backend proof for the snapshot invariant.

## Implementation Plan

1. Register MF-HIOS-093 in Harness and local story docs.
2. Add a rate-focused Admin hook derived from existing Admin TaskType API calls.
3. Add a Task Rates table and edit dialog scoped to `baseRate`.
4. Replace the `/app/admin/task-rates` placeholder route with the new page.
5. Add backend regression proof for TaskType base-rate snapshot on task creation.
6. Add verification script and update matrix/backlog evidence.

## Validation Plan

1. `npm run lint --prefix server`
2. `npm run build --prefix server`
3. `npm run test --prefix server -- task`
4. `npm run lint --prefix client`
5. `npm run build --prefix client`
6. `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-093.ps1`
7. `scripts/bin/harness-cli.exe story verify MF-HIOS-093`
