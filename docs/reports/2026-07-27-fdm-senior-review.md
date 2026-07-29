# FDM senior review — 2026-07-27

## Scope

This review treated the repository as a feature/domain-oriented monorepo:

- Web: `shared -> entities -> features -> routes`
- Backend: `routes -> controllers -> services -> db/jobs`
- Mobile and AI service: API consumers/providers behind explicit service
  boundaries

Canonical business behavior remains owned by `docs/business-flows/` and
`docs/CODE-TODO.md`. No new workflow transition was introduced.

## Remediation completed

1. Architecture checks no longer depend on a developer machine path. Both
   `scripts/pass12-check-boundaries.cjs` and
   `scripts/pass12-check-architecture.cjs` resolve `src/` relative to the
   repository.
2. The boundary check now exits non-zero when it finds an import violation,
   making `npm run audit:architecture` usable as a real quality gate.
3. Web route guards now use the shared, validated
   `getPersistedAuthUser()` helper. Invalid or incomplete persisted auth data
   fails closed, and route code no longer parses the Zustand storage key directly.
4. Root commands now expose `npm run typecheck` and
   `npm run audit:architecture`; the commands are documented in `README.md`.
5. Backend workflow seams, persistence model boundaries, frontend API contracts,
   authentication rate limiting, and business-flow regression coverage were
   implemented in the current branch.

## Verification

| Check | Result |
| --- | --- |
| Architecture audit from repo root | PASS |
| Architecture audit from a different current directory | PASS |
| Web TypeScript check | PASS |
| Web ESLint | PASS |
| Web production build | PASS |
| Business-contract Playwright tests | PASS — 6/6 |
| Full web Playwright suite | PASS — 20/20 |
| Mobile typecheck/tests | PASS — 23/23 |
| Backend TypeScript lint/build | PASS |
| AI service compile check | PASS |
| `git diff --check` | PASS; existing CRLF normalization warnings only |
| Backend full Vitest suite | PASS — sequential single-fork run, exit 0, approximately 248 seconds |

The authoritative backend aggregate run is sequential/single-fork. A parallel
per-file experiment was discarded because it saturated MongoMemory instances;
the sequential aggregate run passed.

## Remaining documented decisions/gaps

- `FLOW-GAP-04 / CT-11`: Admin workflow/content scope is still open and needs an
  approved deprecation plan before route reduction.
- Token persistence in `localStorage` remains an accepted deployment risk. The
  login/refresh rate limiter is implemented, but its bucket store is process-local
  and must move to Redis/shared storage before horizontal scaling.
- The compatibility orchestration layer in `workflow.service.ts` and central model
  registry in `db/models.ts` remain decomposition candidates, while bounded domain
  owners have already been extracted and verified.
- Production migrations were not run.
- Mobile non-breaking dependency updates were applied; 11 moderate Expo/Xcode
  `uuid` findings remain and no breaking force-upgrade was applied.
