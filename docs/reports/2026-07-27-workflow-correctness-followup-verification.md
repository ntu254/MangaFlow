# Workflow Correctness Follow-up Verification

**Date:** 2026-07-27  
**Scope:** Backend workflow guards, frontend contracts, Postman collection, documentation, and dependency verification

## Result

The remediation is verified for the requested local codebase scope. The only intentionally unexecuted item is a live Newman/Postman seeded run because Newman is not installed in the workspace; the collection JSON, role variables, route parity, and negative request definitions were verified locally.

## Requirement evidence

| Requirement | Evidence | Result |
|---|---|---|
| Resolve/reopen route actor contract | `backend/src/routes/studio.routes.ts`; `comment-authority.test.ts` | PASS |
| Assistant removal cannot orphan open tasks | `assignment-workload.service.ts`; `assignment-removal.test.ts` | PASS |
| Tantou removal cannot orphan editorial workload | `assignment-workload.service.ts`; `assignment-removal.test.ts`; `tantou.test.ts` | PASS |
| Material transition matrix and APPROVED authorization | `material-status.service.ts`; `material-status-transition.test.ts`; `materials-mf032.test.ts` | PASS |
| Approved Material version immutability | `material.controller.ts`; `material-status-transition.test.ts` | PASS |
| Frontend readiness/comment/material contracts | `tests/business-flow-contracts.spec.ts` | PASS |
| Postman role tokens and ID capture | `postman/MangaFlow-API.postman_collection.json`; local environment | PASS |
| Postman route parity | `scripts/verify-postman-contract.mjs` | PASS: 148 backend routes, 149 collection routes including one negative duplicate |
| Backend regression | 25 files, 255 tests | PASS |
| Frontend E2E | 23 Playwright tests | PASS |
| Mobile verification | 23 Node tests, TypeScript lint, Expo web build | PASS |
| Architecture audit | `npm run audit:architecture` | PASS, exit 0 |
| Dependency audit | root and backend `npm audit --audit-level=high` | PASS: 0 vulnerabilities |
| Diff hygiene | `git diff --check` | PASS |

## Commands and outcomes

```text
npm --prefix backend test
  25 test files passed, 255 tests passed

npm --prefix backend run lint
npm --prefix backend run build
  PASS

npm run lint
  PASS: 0 errors, 29 existing Fast Refresh warnings

npm run typecheck
npm run build
  PASS

npx playwright test
  23 passed

npm --prefix mobile test
npm --prefix mobile run lint
npm --prefix mobile run build
  23 tests passed; lint/build passed

npm run audit:architecture
  PASS, exit 0

node scripts/verify-postman-contract.mjs
  Postman contract OK: 148 backend routes and 149 collection routes.

npm audit --audit-level=high
npm --prefix backend audit --audit-level=high
  0 vulnerabilities
```

The backend audit fix upgraded transitive `postcss` from `8.5.15` to `8.5.23`. Root lint dependencies were upgraded to ESLint 10-compatible versions; React Compiler diagnostics that are not yet part of this project’s migration were explicitly kept opt-in in `eslint.config.js`. This preserves the existing runtime/lint contract while removing the audit findings.

## Explicit limitations

- `npx --no-install newman --version` reported `newman unavailable`; no live collection run is claimed.
- Production migration commands were not run.
- The pre-existing unrelated worktree deletion `test-results/admin-users-reference.png` remains unstaged and was not modified by this remediation.
- The code-review graph commit hook prints a Windows `cp1252` encoding traceback after successful commits; commits still completed successfully and the hook reported its analysis.

## Commits

- `bace662` — workflow correctness design spec
- `d1cf545` — workflow correctness implementation plan
- `ea82fe1` — comment route authorization contracts
- `415cf6f` — assignment removal workload guards
- `924a127` — canonical Material transitions
- `2bcbef2` — multi-role Postman workflow
- `3b76a01` — frontend workflow contract tests
- `f9b3f68` — lint and audit dependency refresh
