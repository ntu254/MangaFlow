# Validation

## Proof Strategy

The first proof target is static TypeScript correctness for the mobile workspace
and behavior-level checks for permission-sensitive UI states. Runtime Expo
verification requires mobile dependencies to be installed.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Role tab selection, ranking formula preview, readiness blocker state. |
| Integration | Future: authenticated calls to dashboard, comments, voting, and ranking APIs. |
| E2E | Future: mobile simulator flow for Editor approval and Board vote. |
| Platform | Expo start/build smoke after dependencies are available. |
| Performance | Future: list rendering and image preview load checks. |
| Logs/Audit | Future: decision and vote audit evidence from backend. |

## Fixtures

- Editor seed user with assigned series, urgent reviews, comments, and chapter readiness.
- Board seed user with approval queue, ranking period, at-risk series, and vote summary.
- Board Chair seed flag for tie-break visibility.

## Commands

```text
npm run typecheck --workspace mobile
npm run test --workspace mobile
npm run start --workspace mobile
```

## Acceptance Evidence

- `npm run typecheck --workspace mobile` passed.
- `npm run test --workspace mobile` passed.
- `npm run typecheck` passed for client, server, and mobile workspaces.
- `npm run test` passed for server, client, and mobile workspaces.
- `npm run build` passed for client, server, and mobile workspaces.
- `.\repository-harness\scripts\bin\harness-cli.exe story verify MF-003`
  passed.
- `npm run start --workspace mobile -- --port 8084` reached
  `Starting Metro Bundler`; the command was stopped by timeout because Expo
  dev server is long-running.
- `npm audit --audit-level=high` exited 0. It reports moderate Expo dependency
  chain advisories through `uuid`/`xcode` with no fix available from npm audit.
