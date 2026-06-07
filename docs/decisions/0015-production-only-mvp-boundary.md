# Decision 0015: Production-Only MVP Boundary

Date: 2026-06-07

## Status

Accepted

## Context

The supplied Phase 1 plan referenced manga catalog, personal library, chapter
reader, and reading-progress contracts. Those contract files were empty and
the accepted MangaFlow requirements instead described an internal manga
production workflow. The product out-of-scope document explicitly excluded a
public manga reader from the MVP.

Implementing the empty contracts would require inventing reader identity,
ownership, privacy, access, and retention rules.

## Decision

MangaFlow's MVP is production-only.

The MVP covers internal studio and editorial workflows from series proposal
through publication readiness, ranking, and payroll tracking. Public manga
catalog, personal library, chapter reader, and end-user reading progress are
not MVP contracts.

The four empty placeholder contracts are removed. A future reader product area
requires a new initiative, approved product requirements, contracts, security
rules, and HI-OS stories.

## Alternatives Considered

1. Expand the MVP with reader and library behavior.
2. Leave empty contract placeholders in the canonical contract set.

## Consequences

Positive:

- Product docs and contracts describe one coherent production workflow.
- No reader privacy or ownership rules are invented.
- Implementation stories can route to the existing production contracts.

Tradeoffs:

- Public reading and personal library features require a future initiative.
- The earlier phase list must not be used as authority for those removed
  contracts.

## Follow-Up

- Validate all canonical MVP product contracts.
- Create a separate initiative before adding any reader-facing behavior.
