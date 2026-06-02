# Product Docs

MangaFlow product docs are the living product contract derived from the
accepted source specs in `docs/01_complete_spec.md` through
`docs/08_component_design_specification.md`.

The source specs remain useful reference material, but new work should update
these smaller contract files, story packets, the test matrix, and decision
records instead of extending a monolithic spec.

## Contract Files

- `overview.md` - product purpose, users, MVP outcome, and non-goals.
- `architecture.md` - selected stack, runtime surfaces, deployment targets, and
  local boundaries.
- `auth-user-sync.md` - Clerk identity boundary, local user sync, onboarding,
  and auth API rules.
- `roles-permissions.md` - system roles, series roles, and access rules.
- `workflow.md` - core manga production workflow and state rules.
- `api-storage-data.md` - API conventions, data domains, file storage, and AI
  service boundary.
- `ui-direction.md` - current UI direction, design tokens, layout rules, and
  responsive expectations.
- `mvp-roadmap.md` - MVP epics and Harness-aligned delivery phases.

## Update Rule

When behavior changes:

1. Update the affected product doc.
2. Update or create the story packet.
3. Update durable proof status with `scripts/bin/harness-cli story add` or
   `scripts/bin/harness-cli story update`.
4. Record a decision if the change affects architecture, scope, risk, or a
   previously settled product rule.
