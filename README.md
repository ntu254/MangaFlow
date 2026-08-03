# MangaFlow

Manga production and publishing workflow platform — from series proposal
through Board approval, studio production, editorial review, and scheduled
publication.

MangaFlow gives a manga studio one system of record for the people who used to
coordinate over spreadsheets and chat threads: the **Mangaka** (creator) who
proposes series and leads production, the **Assistants** who execute
page/panel-level work, the **Tantou Editor** who reviews manuscripts and
chapters, the **Editorial Board** that votes on which series get greenlit, and
an **Admin** who provisions accounts and operates platform configuration.

The canonical business rules and API-role matrix live in
[`docs/business-flows/INDEX.md`](docs/business-flows/INDEX.md). Detailed flows
are linked from that index; `BUSINESS_FLOW.md` and `BUSINESS_CANONICAL_FLOW.md`
are retained only as historical references.

## Monorepo layout

| Path | What it is | Stack |
| --- | --- | --- |
| `frontend/` | Web app | TanStack Start · React 19 · TanStack Router/Query · Zustand · Tailwind |
| `backend/` | REST API + background jobs | Express · TypeScript · MongoDB/Mongoose · JWT auth |
| `ai-service/` | Speech-bubble detection & whitening | FastAPI · YOLO11 (Ultralytics) · OpenCV |
| `mobile/` | Board + Editor mobile shell | Expo · React Native |
| `tools/` | Ask-the-Codebase CLI and server | Node.js |
| `postman/` | Postman API collection | — |

## Roles at a glance

| Role | Does |
| --- | --- |
| `MANGAKA` | Drafts proposals, leads production, assigns and reviews studio work |
| `ASSISTANT` | Executes assigned panel/region work, submits it, tracks earnings |
| `EDITOR` | Reviews proposals and chapters, gates publication readiness |
| `BOARD` | Votes on proposals, governs cadence and rankings |
| `ADMIN` | User lifecycle, Board Chair designation, RateTable, managed notifications, read-only operational dashboards |

Full permission matrix: see
[`docs/business-flows/INDEX.md`](docs/business-flows/INDEX.md#roles).

## Getting started

### Prerequisites

- Node.js 20+ and npm (or [Bun](https://bun.sh) — a `bun.lock` is committed)
- MongoDB, running as a **replica set** (task submission and submission review
  use multi-document transactions)
- Python 3.11+ for the AI service
- A Cloudflare R2 bucket (or R2-compatible storage) for page/material files

### 1. Web app

```bash
cd frontend
npm install
cp .env.example .env      # fill in VITE_API_BASE_URL
npm run dev                # http://localhost:5173
```

### 2. Backend API

```bash
cd backend
npm install
cp .env.example .env       # MONGO_URI, JWT secrets, R2 credentials, AI_SERVICE_URL
npm run seed:demo          # optional: seed demo users/data for all five roles
npm run dev                # http://localhost:3001
```

### 3. AI service (bubble detection)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Mobile app (Board + Editor)

```bash
cd mobile
npm install
npm run web       # or: npm run android / npm run ios
```

## Testing

```bash
cd frontend
npm run test:e2e            # Playwright, web E2E suite
npm run typecheck           # Web TypeScript check
npm run lint                # Web ESLint
npm run audit:architecture  # FDM import-boundary checks
cd backend && npm test       # Vitest, backend unit/integration suite
```

Backend runtime boundaries are layered: `routes/` composes endpoints, `controllers/`
handles HTTP parsing, `services/` owns workflow and delivery logic, `jobs/` owns
scheduled work, and `db/` owns Mongoose models. The production outbox runner is
configured with `OUTBOX_INTERVAL_MS`, `OUTBOX_BATCH_SIZE`, and
`OUTBOX_MAX_ATTEMPTS`. Before deploying the canonical workflow schema, migrate
legacy comment fields/statuses and region lock data with:

```bash
cd backend
npm run migrate:canonical-comments -- --apply
npm run migrate:region-lock-status -- --apply
npm run migrate:material-attachments
npm run migrate:material-attachments:apply
```

`migrate:material-attachments` is dry-run by default. It reports archived legacy
attachments that will be removed and retained standalone/Proposal attachments whose
status fields will be stripped. Do not run the `:apply` command against production without the
deployment backup and rollback procedure.

## Documentation

- [`BUSINESS_FLOW.md`](BUSINESS_FLOW.md) — the as-built business flow,
  architecture diagram, ERD, API reference, and business rules, generated
  from the current codebase.

## Contributing

Keep `BUSINESS_FLOW.md` in sync with `backend/src/services/workflow.service.ts`
and `backend/src/db/models.ts` when workflow behavior or the data model
changes.
