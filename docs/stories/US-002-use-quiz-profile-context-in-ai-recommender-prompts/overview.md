# Overview

## Current Behavior

The recommender AI prompt receives the user's free-text prompt and optional
style, season, occasion, and gender. The rest of the quiz-derived profile data
stored in `profiles` is not sent as AI context, so generated outfits can ignore
preferred styles, colors, occasions, budget, and quiz completion state.

## Target Behavior

When a logged-in user asks the recommender AI for outfit suggestions, the
request must use real profile data from `profiles` as context:

- `style_dna`
- `favorite_colors`
- `preferred_styles`
- `preferred_occasions`
- `budget_min` / `budget_max`
- `fashion_preferences.gender`
- `quiz_completed`

The edge functions must also load the profile server-side so a missing client
payload cannot remove personalization.

## Affected Users

- Logged-in shoppers using recommender generation or recommender chat.

## Affected Product Docs

- `README.md`
- `docs/PROJECT_DOCS.md`

## Non-Goals

- No mock-data recommender behavior.
- No schema migration.
- No change to quiz UI.
- No broader AI model/provider replacement.
