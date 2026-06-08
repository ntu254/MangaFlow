# Validation

## Proof Strategy

Unit tests verify status mappings and invalid-state guard. Root build validates route/model/service TypeScript.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Forward to Board, request revision, reject, invalid state guard. Series submit syncs latest Manuscript to `EDITOR_REVIEW`. |
| Integration | Deferred; no live Mongo fixture in CI. |
| E2E | Not configured. |
| Platform | Root build. |
| Logs/Audit | Deferred audit story. |

## Commands

```bash
npm run test --prefix server
npm run build
```

## Acceptance Evidence

- `npm run test --prefix server`: 10 files passed, 47 tests passed.
- `npm run build`: server TypeScript build passed; client TypeScript + Vite build passed.
