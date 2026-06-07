# Design

## Selected Skill Pack

- Product
- HI-OS Governance
- Validation

No application plugin is selected because this story is product-contract work.
After resolution:

- Production UI stories route to Build Web Apps.
- Mobile stories route to Expo only after a mobile contract exists.
- Deployment stories route to Vercel.
- Repository and PR workflows route to GitHub.
- OpenAI Developers is used only for an approved OpenAI-backed AI story.

## Source Hierarchy

Apply this order:

1. User's explicit choice resolving this conflict.
2. Feature contract.
3. Product requirements.
4. Architecture docs.
5. Existing code.

The supplied plan is internally inconsistent, so it cannot provide the missing
reader/library business rules by itself.

## Selected Production-Only Shape

- Treat the four empty reader/library contract files as invalid placeholders.
- Keep the production contracts as the MVP contract map.
- Update the Phase 1 story map and README references accordingly.
- Preserve `docs/product/out-of-scope.md`.

## Future Reader Initiative

Any future expanded reader scope must first define:

- Reader role and identity model.
- Catalog visibility and publication eligibility.
- Library ownership and duplicate rules.
- Reading-progress privacy and retention.
- Chapter/page access and signed URL behavior.
- API endpoints and authorization.
- Acceptance criteria and security tests.

## Non-Goals

- No frontend, backend, database, auth, or deployment implementation.
- No restoration of pre-existing deleted application files.
- No inferred reader/library business rules.
