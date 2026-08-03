# Mobile Publication Scheduling and Card Design

## Goal

Make Editor publication scheduling precise without typed date strings, and make
mobile work cards and action buttons easier to scan and operate.

## Approved interaction

- **Schedule Publication** opens a bottom sheet with a month calendar, then
  independent hour (`00–23`) and minute (`00–59`) wheel selectors.
- The user may select any local minute in the future. The sheet displays the
  complete selected value before submitting, for example `Tue, 12 Aug · 14:35`.
- A past or invalid selection cannot submit. The existing API still receives
  ISO `scheduledAt` and remains authoritative.
- Schedule confirmation uses compact 44px actions with 14–15px semibold,
  one-line labels; secondary Cancel is visually quieter than the violet primary
  confirmation action.

## Card and copy rules

- Cards expose a clear work-type eyebrow, such as `Publication · Chapter 12`.
- The main title is a complete descriptive name; subtitle provides concise
  series/chapter context. Status is a small chip, not a competing heading.
- Chapter references must state the object type explicitly (`Chapter 12`, not
  only `12`). The same copy rule applies to proposal, comment, and publication
  cards.
- Existing colors, typography, spacing, and five-tab navigation are preserved.

## Scope and verification

- Replace only the free-text schedule input; do not alter postpone/publish
  authorization or backend publication rules.
- Unit-test future-minute validation and ISO payload conversion; screen-test
  calendar/wheel selection, disabled past submit, labels, and compact button
  sizing semantics.
- Run mobile tests, lint, Expo web build, and `git diff --check`.
