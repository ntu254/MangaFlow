# MF-008 Validation

## Automated Proof

Command:

```powershell
npm run test --workspace server
```

Result:

- 6 server source test files passed.
- 19 server source tests passed.

Covered behaviors:

- Local fallback storage writes files under `uploads/`, returns local URLs,
  resolves fallback signed URLs, checks file existence, copies files, and
  deletes files.
- Multipart chapter page upload authenticates a Mangaka owner, writes original,
  AI, preview, and thumbnail files through storage, creates a `Page`, and
  creates matching `FileAsset` metadata.

Command:

```powershell
npm run typecheck --workspace server
```

Result:

- Server TypeScript compilation passed.

Command:

```powershell
npm run test:quick
```

Result:

- Client and server typecheck passed.
- Server source tests passed.
- Client tests passed.
- Client and server production builds passed.

Command:

```powershell
.\scripts\bin\harness-cli.exe story verify MF-008
```

Result:

- Story verification passed.

## Implementation Notes

- `createApiRouter` now passes injected `fileRepository` dependencies through
  page and manuscript routers. This keeps upload route tests isolated and
  prevents accidental Mongo writes in route-level tests.
- Server Vitest now excludes `dist/**` so production build artifacts are not
  treated as duplicate test files.
- Client page/manuscript API helpers now read backend error text from the
  standard `message` field in MangaFlow's API response envelope.

## Deferred Proof

- No browser E2E upload was recorded for this story because it needs an active
  authenticated Mangaka, a Series, and a Chapter fixture in the local Google OAuth/Mongo
  environment.
- Live R2/MinIO connectivity is not asserted in automated tests; the validated
  contract is S3-compatible configuration plus local fallback behavior.
