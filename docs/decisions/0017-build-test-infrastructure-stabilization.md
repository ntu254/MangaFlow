# 0017 Build/Test Infrastructure Stabilization

Date: 2026-06-08

## Status

Accepted

## Context

The MangaFlow repository had build and test infrastructure issues that blocked reliable local validation. Specifically, the server build failed due to a TypeScript unused import error in `server/src/modules/series/series.repository.ts`, while the client lacked a configured test runner despite having Vitest dependencies.

A previous story, MF-HIOS-003, documented these infrastructure caveats but did not resolve them. This created a blocker for subsequent stories that require automated build/test proof.

## Decision

1. Fix the server TypeScript build error by removing the unused `mongoose` import in `series.repository.ts`.
2. Add Vitest-based test infrastructure to the client with minimal configuration (`client/vitest.config.ts`).
3. Install required client test dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
4. Add a `test` script to `client/package.json` using `vitest run`.
5. Restrict changes to tooling and configuration only; no domain logic or new modules are added.

## Alternatives Considered

1. Ignore TypeScript errors via `tsconfig` options like `noUnusedLocals: false`.
2. Perform a wider refactor of all backend modules under the same story.
3. Add full client test suite as part of this infrastructure story.
4. Switch the client to a different test runner.

## Consequences

Positive:
- Server build and test now run successfully, restoring automated validation for backend changes.
- Client test infrastructure is in place for future stories.
- Scope remains narrow and focused on tooling.

Tradeoffs:
- Client tests were not written in this story; only infrastructure was added.
- The server fix is localized; similar unused-import issues may exist elsewhere.
- Vitest configuration for the client is minimal and may need refinement as tests are added.
- `.env` files are not part of this change.
