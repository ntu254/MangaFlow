# MangaFlow Product Docs

These files are the accepted product source of truth for MangaFlow's
production-only MVP:

- `overview.md`
- `problem.md`
- `users.md`
- `requirements.md`
- `user-flow.md`
- `feature-list.md`
- `out-of-scope.md`

The MVP supports internal manga production and editorial workflows. Public
catalog, personal library, chapter reader, and reading-progress behavior
requires a future initiative and is not part of the current product contract.

## Update Rule

When behavior changes:

1. Update the affected product doc.
2. Update or create the story packet.
3. Update durable proof status with `scripts/bin/harness-cli story add` or
   `scripts/bin/harness-cli story update`.
4. Record a decision if the change affects architecture, scope, risk, or a
   previously settled product rule.
