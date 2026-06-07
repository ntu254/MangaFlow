# Design

## Approach

Keep the accepted MangaFlow UI direction:

- Clean Pastel Creative SaaS.
- Light theme only by default.
- Rounded bento layout.
- White cards on pastel backgrounds.
- Soft purple ambient shadows.
- Plus Jakarta Sans.
- Reusable MangaFlow components before feature-specific UI.

## Plugin Application

Use Build Web Apps-style frontend guidance only for UI direction and reusable
component constraints. No application code is implemented in this story.

## Non-Goals

- No React implementation.
- No Tailwind config creation.
- No shadcn installation.
- No browser verification.
- No public reader/library UI.

## Validation Design

Add a deterministic docs-only verifier that checks UI docs and contracts for:

- Production-only boundary.
- Required design tokens.
- Required shared components.
- Required anti-shortcut rules.
- Per-contract validation sections.
