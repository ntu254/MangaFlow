# Validation

## Proof Strategy

Prove that recommender requests include real profile context and that server
edge functions put profile fields into the AI prompt. Avoid mock-data behavior
as the implementation path.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Client passes profile context to edge invoke; fallback filters from profile context; edge prompt builders include style/color/occasion/budget context. |
| Integration | Existing build compiles the client boundary. |
| E2E | Not required for this service/provider-context fix. |
| Platform | Not required. |
| Performance | |
| Logs/Audit | |

## Fixtures

Unit tests use mocked Supabase rows that represent real `profiles` fields.

## Commands

Add commands after scripts exist.

```text
npm run test -- src/features/recommender/services/recommender.service.test.ts src/features/recommender/services/profile-context.test.ts src/features/quiz/services/quiz.service.test.ts
npm run build
scripts/bin/harness-cli arch-check --story US-002
scripts/bin/harness-cli story verify US-002
```

## Acceptance Evidence

- `npm run test -- src/features/recommender/services/recommender.service.test.ts src/features/recommender/services/profile-context.test.ts src/features/quiz/services/quiz.service.test.ts` passed: 3 files, 12 tests.
- `npm run build` passed.
- `scripts/bin/harness-cli arch-check --story US-002` passed, with no configured architecture files scanned for this app slice.
- `npm run lint` still fails because of pre-existing out-of-scope lint targets: `.kilo/worktrees/*/src/features/quiz/hooks/useQuizRedirect.ts` and `src/features/quiz/hooks/useQuizRedirect.ts` parse JSX in a `.ts` file, plus existing warnings. No newly changed file is listed as a lint error.
