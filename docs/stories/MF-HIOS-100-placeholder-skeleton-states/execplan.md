# Execution Plan

## Selected Skill Pack

- UI
- Build Web Apps frontend testing/debugging
- Vercel React best-practices review
- Validation

## Selected Docs

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/contracts/main.md`
- `docs/contracts/ui-main.md`
- `docs/contracts/ui-admin.md`
- `docs/design/ui-style-guide.md`
- `docs/design/design-tokens.md`
- `docs/design/component-system.md`
- `docs/design/responsive-rules.md`
- `docs/validation/ui-review-checklist.md`

## Lane

normal

## Risks

- Placeholder UI could look like a completed feature.
- Placeholder copy could imply frontend-only permission behavior.
- Lazy fallback could be blank or visually inconsistent.

## Implementation Plan

1. Add shared `MFRouteSkeleton`.
2. Update `ComingSoonPage` to use MangaFlow token classes and shared components.
3. Replace `Suspense fallback={null}` for placeholder/detail lazy routes with route skeleton fallback.
4. Validate client lint/build and server lint/build.

## Validation Plan

1. `npm run lint --prefix client`
2. `npm run build --prefix client`
3. `npm run lint --prefix server`
4. `npm run build --prefix server`
5. `powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-100.ps1`
