# MangaFlow MVP FDM Architecture

This rebuild uses `flow.md` as the product source of truth. Existing code can be
used as a business reference, but legacy architecture and non-MVP workflows are
not carried forward when they conflict with the flow.

## Server modules

Each server module should follow the same boundaries:

```text
server/src/modules/<module>/
  domain/           # entities, value objects, domain policies
  application/      # commands, queries, authorization orchestration
  infrastructure/   # mongoose repositories, external adapters
  presentation/     # routes, controllers, request/response mapping
  tests/            # module-local unit/integration tests
```

MVP modules:

- `auth`
- `users`
- `proposals`
- `board`
- `series`
- `chapters`
- `studio`
- `submissions`
- `publications`
- `rankings`
- `at-risk`
- `earnings`
- `notifications`
- `files`

Business logic belongs in application services. Controllers map HTTP to
commands/queries and never directly patch workflow status fields.

## Client modules

The client should be organized by responsibility:

```text
client/src/
  app/        # providers, router, role layouts
  shared/     # axios, query client, table/form helpers, UI primitives
  entities/   # typed domain models and pure domain helpers
  features/   # workflow actions, forms, tables
  pages/      # route-level composition
```

Frontend action gating is only a UX affordance. Server authorization remains
the source of truth.

## Non-MVP exclusions

Do not rebuild these in the MVP flow:

- Board Voting Sessions as a standalone workflow.
- Manual Tantou assignment/removal routes.
- Admin override / force-status workflow.
- Admin audit dashboard.
- Admin payroll confirm/paid/void.
- Standalone Material Library module.
- Biweekly cadence.

Allowed cadence values are only `WEEKLY` and `MONTHLY`.
