# Validation

## Proof Strategy

Unit tests cover owner/non-owner upload-init behavior. Build validates API and UI TypeScript.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Owner Mangaka gets signed URL and records Manuscript/FileAsset. Non-owner is blocked before URL generation. |
| Integration | Deferred; no live Mongo/R2 fixture in CI. |
| E2E | Not configured. |
| Platform | Root build. |
| Performance | N/A. |
| Logs/Audit | Deferred audit story. |

## Fixtures

- Owned Series with ownerId `owner-1`.
- Non-owner actor `intruder`.
- Signed URL mock returning `uploads/file.pdf`.

## Commands

```bash
npm run test --prefix server
npm run build
```

## Acceptance Evidence

- `npm run test --prefix server`: 9 files passed, 43 tests passed.
- `npm run build`: server TypeScript build passed; client TypeScript + Vite build passed.
