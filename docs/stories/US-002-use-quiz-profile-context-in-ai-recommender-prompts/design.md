# Design

## Domain Model

`QuizProfileContext` is a boundary DTO derived from `profiles`. It carries only
styling preference fields needed by the recommender prompt and product
filtering. Unknown JSON remains at the boundary and is normalized before use.

## Application Flow

- `recommenderService.generate` gets the current user, reads their profile
  personalization context, sends it to `generate-outfit`, and uses it for local
  fallback filtering.
- `recommenderService.converse` does the same for `converse`.
- `applyAction` and `listOutfits` use the same context for consistency.
- Edge functions read `profiles` again by authenticated user id and merge it
  with the optional client context.

## Interface Contract

Supabase function request bodies gain optional `profileContext`. The existing
response shapes stay unchanged.

## Data Model

No migration. Data source is the existing `profiles` row.

## UI / Platform Impact

No visual UI change.

## Observability

Harness trace records validation and the lint blocker if it remains.

## Alternatives Considered

1. Passing only gender was insufficient because the user specifically expects
   all quiz preferences to shape AI recommendations.
2. Adding columns was unnecessary because profile already stores the quiz
   fields needed by the recommender.
