# Validation

## Proof Strategy

MF-HIOS-100 is done when placeholder routes use shared MangaFlow components and lazy route fallbacks render a skeleton instead of `null`.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | TypeScript compile covers route and component wiring. |
| Integration | No backend integration in scope. |
| E2E | Manual QA only. |
| Platform | Client/server lint and build through story verification script. |

## Commands

```powershell
npm run lint --prefix client
npm run build --prefix client
npm run lint --prefix server
npm run build --prefix server
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-100.ps1
```

## Manual QA

- Open a placeholder route such as `/app/admin/storage`.
- Placeholder uses MangaFlow cards, badges, and token typography.
- Route transition does not show a blank fallback.
- Placeholder copy states backend remains the source of truth for permissions.

## Acceptance Evidence

- Story verification script passes.
- Client lint/build passes.
- Server lint/build passes.
