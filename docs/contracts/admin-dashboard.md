# Admin Dashboard Contract

## Scope

Admin overview and governance.

## Out of scope

Behavior outside this scope and anything listed in
`docs/product/out-of-scope.md`.

## Actors

Admin

## Business rules

- Admin can view system health, user counts, storage, audit.
- Admin does not decide Board outcomes.

## API surface

`GET /api/dashboard/admin/sidebar-summary`
`GET /api/health`

## Acceptance criteria

- Dashboard returns counts.
- Health endpoints work.

## Validation

```bash
npm run test
npm run build
```

Manual QA must prove the main success flow and at least one forbidden flow.
