# US-001 Respect Gender in Recommender Outfits

## Status

implemented

## Lane

normal

## Product Contract

When a user selects a gender in the style quiz, recommender generation must use
that preference so a male user is not offered clearly female outfits or products.
The rule applies to local fallback recommendations and to Supabase edge
generation context.

## Relevant Product Docs

- `README.md`
- `docs/PROJECT_DOCS.md`

## Acceptance Criteria

- Quiz completion persists the selected gender in the profile personalization
  data without requiring a schema migration.
- Recommender generation and chat include the user's gender preference in edge
  requests when the user is logged in.
- Local fallback product selection excludes clearly female products for male
  users while still allowing unisex items.
- Unit coverage proves male fallback recommendations do not include women-only
  product names.

## Design Notes

- Commands: recommender `generate` and `converse`.
- Queries: user profile lookup by current Supabase user id.
- API: existing Supabase edge functions receive optional `gender`.
- Tables: reuse `profiles.fashion_preferences.gender`.
- Domain rules: `male` excludes women-only signals such as dress, skirt, heels,
  blouse, bra, clutch, Vascara, Elise; `female`, `lgbtq`, and skipped gender do
  not narrow inventory.
- UI surfaces: quiz persistence only; no visual changes.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-001 --unit 1 --integration 0 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | `npm run test -- src/features/recommender/services/recommender.service.test.ts src/features/quiz/services/quiz.service.test.ts` |
| Integration | Not required for this local behavior fix. |
| E2E | Not required for this service-level bug fix. |
| Platform | Not required. |
| Release | Not required. |

## Harness Delta

None expected.

## Evidence

- `npm run test -- src/features/recommender/services/recommender.service.test.ts src/features/quiz/services/quiz.service.test.ts` passed: 2 files, 8 tests.
- `npm run build` passed.
- `scripts/bin/harness-cli arch-check --story US-001` passed, with no configured architecture files scanned for this app slice.
- `npm run lint` did not pass because of pre-existing out-of-scope lint targets: `.kilo/worktrees/*/src/features/quiz/hooks/useQuizRedirect.ts` and `src/features/quiz/hooks/useQuizRedirect.ts` parse JSX in a `.ts` file, plus existing warnings.
