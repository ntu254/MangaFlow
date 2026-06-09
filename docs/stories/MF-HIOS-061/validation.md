# Validation

## Proof Strategy

This hardening story is done only when runtime/security-sensitive boundaries are both documented and mechanically proven where commands exist.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | env validation rejects missing prod secrets; AccessPolicy denies Assistant overreach; file policy denies out-of-scope signed URL; workflow guard tests remain intact. |
| Integration | server does not listen on MongoDB failure; Assistant cannot open unassigned task workspace; Assistant cannot read page/file outside task/context; board tie-break path still enforced. |
| E2E | Not required yet. |
| Platform | server build passes; client build passes if touched; AI service config reviewed; startup behavior manually verified. |
| Performance | Not a focus. |
| Logs/Audit | deny/fail-fast paths log non-secret operational messages. |

## Fixtures

Use deterministic roles and records:

- `admin-default`
- `mangaka-owner`
- `assistant-a`
- `assistant-b`
- `editor-1`
- `board-chair`
- one approved series
- one non-approved series
- one assigned task with `contextPageIds`
- one foreign task assigned to another assistant
- one file for manuscript/original page
- one task reference file
- one own submission file
- one foreign submission file

## Commands

Expected verification commands after implementation:

```text
npm run lint --prefix server
npm run test --prefix server
npm run build --prefix server
npm run build --prefix client
```

## Acceptance Evidence

- `npm run lint --prefix server` -> PASS.
- `npm run build --prefix server` -> PASS.
- `npm run test --prefix server -- accessPolicy env dashboard task submission comment` -> PASS.
- `npm run lint --prefix client` -> PASS.
- `npm run build --prefix client` -> PASS.
- Forbidden-string scan for hardcoded admin password, permissive AI CORS, and DB soft-start messages found no active matches in touched runtime code.

Required evidence targets:

- Production env validation rejects missing/weak secrets through `buildConfig` tests.
- Server exits before listen when MongoDB connection fails in `index.ts` startup path.
- No hardcoded admin password remains in `index.ts` or `seed.ts`; admin seed is env-driven.
- Assistant cannot gain page/file access from SeriesMember alone; `AccessPolicyService` tests cover denial.
- Signed URL path enforces file access policy before returning presigned download URLs.
- AI service CORS uses backend origin and no longer allows wildcard origins.
- MongoDB stores FileAsset/object references, not base64 payloads, for this hardening slice.
- UTF-8 cleanup completed for touched runtime files.
