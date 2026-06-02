# 0007 MangaFlow UI Direction

Date: 2026-06-02

## Status

Accepted

## Context

The complete spec includes an older note that the application should use a
dark technology dashboard tone. Later screen and component specifications define
a bright pastel creative studio direction and explicitly say the UI should not
use a dark technology theme as the main direction.

The conflict needs one living product rule before frontend scaffolding starts.

## Decision

MangaFlow will use the bright pastel creative studio direction as the current
UI contract.

The product should feel like a friendly manga production workspace, not a dark
cyberpunk or navy technology dashboard. The living UI contract is
`docs/product/ui-direction.md`.

## Alternatives Considered

1. Keep the dark technology direction from the complete spec.
2. Delay the visual direction decision until role dashboards are implemented.

## Consequences

Positive:

- Frontend foundation can start with one visual direction.
- Later role dashboards, canvas tools, and ShadCN theme tokens can share one
  consistent palette.
- The product better matches manga/art production workflows.

Tradeoffs:

- Some older complete-spec wording is now superseded by product docs.
- Future screenshots or mockups using a dark theme need to be treated as stale
  unless the product contract changes again.

## Follow-Up

- Add design tokens to the client when the UI foundation story begins.
- Durable decision row is recorded as `0007-mangaflow-ui-direction`.
