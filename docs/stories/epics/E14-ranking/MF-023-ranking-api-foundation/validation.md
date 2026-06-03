# Validation

## Proof Strategy
MF-023 is verified when:
1. Mongoose schema is tested.
2. Ranking calculation logic is unit tested.
3. Import endpoint processes score input, performs ranking sorting, and records previous rank.
4. Historical and detail routes authenticate successfully.
5. All backend tests pass and TypeScript typechecks compile cleanly.
