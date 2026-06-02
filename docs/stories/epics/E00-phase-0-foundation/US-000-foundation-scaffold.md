# US-000 Foundation Scaffold

## Status

implemented

## Lane

normal

## Product Contract

MangaFlow has living product docs and a minimal monorepo foundation for the
declared client, backend API, and AI service surfaces. The foundation proves
only build and health smoke behavior; it does not implement auth, domain
models, storage providers, AI processing, or production workflow behavior.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/architecture.md`
- `docs/product/roles-permissions.md`
- `docs/product/workflow.md`
- `docs/product/api-storage-data.md`
- `docs/product/ui-direction.md`
- `docs/product/mvp-roadmap.md`
- `docs/decisions/0007-mangaflow-ui-direction.md`

## Acceptance Criteria

- Product docs split the accepted source specs into living contract files under
  `docs/product/`.
- `docs/TEST_MATRIX.md` has a row for `US-000`.
- Root package scripts can run client and server workspace checks with npm.
- `client/` contains a buildable React + Vite + TypeScript app shell.
- `server/` contains a buildable Express + TypeScript API.
- `GET /api/health` returns the standard MangaFlow success envelope.
- `ai-service/` contains a FastAPI health placeholder that matches the future
  AI service boundary.
- Environment example files exist and no secrets are committed.
- No Clerk, MongoDB, R2, MinIO, domain CRUD, role guard, route guard, or AI model
  behavior is implemented in this story.

## Design Notes

- Commands: npm workspaces for `client` and `server`; Python syntax smoke for
  `ai-service`.
- Queries: none.
- API: `GET /api/health` only.
- Tables: none.
- Domain rules: none implemented; product rules captured in product docs.
- UI surfaces: a minimal MangaFlow shell, not role dashboards.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-000 --unit 0 --integration 0 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | Not required for Phase 0 because no domain rules exist yet. |
| Integration | Not required because no provider, database, auth, or domain integration exists yet. |
| E2E | Not required because no product workflow is implemented yet. |
| Platform | `npm run build`, `npm run typecheck`, backend health smoke, and Python syntax smoke. |
| Release | Not required until deployment story. |

## Harness Delta

- This story is the first MangaFlow product story under the Harness flow.
- Durable proof status is synced with
  `scripts/bin/harness-cli.exe story update --id US-000 --status implemented --unit 0 --integration 0 --e2e 0 --platform 1`.
- Decision `0007-mangaflow-ui-direction` is recorded in the durable decision
  table.
- A previous missing-CLI backlog note is retained as historical friction in
  `docs/HARNESS_BACKLOG.md`.

## Evidence

- `npm install` completed with 0 vulnerabilities.
- `npm run typecheck` passed for `client` and `server`.
- `npm run build` passed for `client` and `server`.
- `npm run test:quick` passed from the repository root.
- `python -m py_compile ai-service\app\main.py` passed.
- Backend smoke passed:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "service": "mangaflow-api",
    "status": "healthy"
  }
}
```

- AI service smoke passed:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "service": "mangaflow-ai-service",
    "status": "healthy"
  }
}
```

- Durable Harness record for `US-000` is now updated.
