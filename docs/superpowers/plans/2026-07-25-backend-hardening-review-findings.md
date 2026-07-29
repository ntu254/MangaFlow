# Backend Hardening — Fix Review Findings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the seven backend auth/authorization/workflow findings from the `main` review with the smallest correct diff each.

**Architecture:** Seven independent fixes in `backend/src`. Behavioral fixes (1, 2, 4, 5) get a vitest test; mechanical fixes (3, 6, 7) rely on typecheck plus the existing suite. No shared architecture — order is by review severity.

**Tech Stack:** Node ESM, Express 5, Mongoose, Zod, vitest 4 + supertest + mongodb-memory-server, `express-rate-limit` (new).

## Scope revision (2026-07-25, post-implementation)

**Task 2 (login/refresh rate limiting) was descoped and removed from the
branch** as over-engineering for an internal course project, together with its
`AUTH_RATE_LIMIT_MAX` NaN-guard follow-up. Tasks 1, 3, 4, 5, 6, 7 are kept and
delivered. The task text below is retained for record only; Task 2 is not part
of the final branch.

## Global Constraints

- ESM project: **all relative imports use the `.js` extension** (e.g. `../app.js`), even for `.ts` sources.
- Tests live in `backend/src/__tests__/*.test.ts`; run from the `backend/` directory.
- Vitest runs single-fork (`vitest.config.ts`) — do not add parallelism assumptions.
- API success envelope is `{ data: ... }`; supertest reads `response.body.data`.
- DB-backed tests use `MongoMemoryReplSet.create({ replSet: { count: 1 } })`, `mongoose.connect`, and `seedDatabase()` in `beforeEach`. Seed login helper: `POST /api/auth/login` with `{ email, password }` where `password === email`.
- Seeded users: editor `editor@mangaflow.local`, board `board@beachread.jp`, assistant `jun@beachread.jp`, mangaka author of `p-001`/`p-002` is `u-mangaka`.
- All commits run from the repo root `E:/website/storyboard-nexus` on branch `fix/backend-hardening-review-findings`.

---

### Task 1: Restore board-quorum safety floor

**Files:**
- Modify: `backend/src/services/workflow.service.ts` (`configuredBoardQuorum`, ~L44-51)
- Test: `backend/src/__tests__/board-quorum.test.ts` (create)

**Interfaces:**
- Produces: `export function configuredBoardQuorum(): number` — reads `process.env.BOARD_QUORUM` on each call; returns `3` when the value is absent, non-finite, or `< 2`, otherwise `Math.min(Math.floor(raw), BOARD_TOTAL)` where `BOARD_TOTAL === 5`.

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/board-quorum.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { configuredBoardQuorum } from "../services/workflow.service.js";

describe("configuredBoardQuorum", () => {
  const original = process.env.BOARD_QUORUM;
  afterEach(() => {
    if (original === undefined) delete process.env.BOARD_QUORUM;
    else process.env.BOARD_QUORUM = original;
  });

  it("rejects a quorum of 1 and falls back to 3", () => {
    process.env.BOARD_QUORUM = "1";
    expect(configuredBoardQuorum()).toBe(3);
  });

  it("rejects a non-numeric quorum and falls back to 3", () => {
    process.env.BOARD_QUORUM = "abc";
    expect(configuredBoardQuorum()).toBe(3);
  });

  it("passes valid quorum values through, capped at BOARD_TOTAL", () => {
    process.env.BOARD_QUORUM = "2";
    expect(configuredBoardQuorum()).toBe(2);
    process.env.BOARD_QUORUM = "3";
    expect(configuredBoardQuorum()).toBe(3);
    process.env.BOARD_QUORUM = "9";
    expect(configuredBoardQuorum()).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/__tests__/board-quorum.test.ts`
Expected: FAIL — `configuredBoardQuorum` is not exported (import is `undefined`), and/or the `"1" → 3` case fails because the current floor is `raw < 1`.

- [ ] **Step 3: Apply the fix**

In `backend/src/services/workflow.service.ts`, change the function to export it and raise the floor. Replace:

```ts
function configuredBoardQuorum() {
  const raw = Number(process.env.BOARD_QUORUM ?? 3);
  // Floor lowered to 1 for local testing (single-vote quorum flows). Revert to
  // `raw < 2` before shipping — a quorum of 1 lets one Board member unilaterally
  // decide a proposal, which the production default (3) is meant to prevent.
  if (!Number.isFinite(raw) || raw < 1) return 3;
  return Math.min(Math.floor(raw), BOARD_TOTAL);
}
```

with:

```ts
export function configuredBoardQuorum() {
  const raw = Number(process.env.BOARD_QUORUM ?? 3);
  // A quorum below 2 would let a single Board member unilaterally decide a
  // proposal; fall back to the production default (3) in that case.
  if (!Number.isFinite(raw) || raw < 2) return 3;
  return Math.min(Math.floor(raw), BOARD_TOTAL);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/__tests__/board-quorum.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/workflow.service.ts backend/src/__tests__/board-quorum.test.ts
git commit -m "fix: restore board quorum safety floor to reject quorum of 1"
```

---

### Task 2: Add login/refresh rate limiting

**Files:**
- Create: `backend/src/middleware/rate-limit.ts`
- Modify: `backend/src/routes/auth.routes.ts`
- Modify: `backend/package.json` (adds `express-rate-limit` dependency)
- Test: `backend/src/__tests__/auth-rate-limit.test.ts` (create)

**Interfaces:**
- Produces: `export function createAuthLimiter(max: number, windowMs?: number): RequestHandler` and `export const authLimiter: RequestHandler`. `authLimiter`'s max comes from `AUTH_RATE_LIMIT_MAX`, defaulting to `1000` under `VITEST` and `10` otherwise; window is 15 minutes.

- [ ] **Step 1: Install the dependency**

Run: `cd backend && npm install express-rate-limit`
Expected: `express-rate-limit` added under `dependencies` in `backend/package.json`.

- [ ] **Step 2: Write the failing test**

Create `backend/src/__tests__/auth-rate-limit.test.ts`:

```ts
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createAuthLimiter } from "../middleware/rate-limit.js";

describe("createAuthLimiter", () => {
  it("returns 429 once the request count exceeds the max", async () => {
    const app = express();
    app.use("/probe", createAuthLimiter(2), (_req, res) => res.json({ ok: true }));

    await request(app).get("/probe").expect(200);
    await request(app).get("/probe").expect(200);
    await request(app).get("/probe").expect(429);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx vitest run src/__tests__/auth-rate-limit.test.ts`
Expected: FAIL — cannot resolve `../middleware/rate-limit.js` (module does not exist yet).

- [ ] **Step 4: Create the middleware**

Create `backend/src/middleware/rate-limit.ts`:

```ts
import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export function createAuthLimiter(max: number, windowMs: number = FIFTEEN_MINUTES): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      ok: false,
      error: { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." },
    },
  });
}

const defaultMax = process.env.VITEST ? 1000 : 10;

export const authLimiter = createAuthLimiter(Number(process.env.AUTH_RATE_LIMIT_MAX ?? defaultMax));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run src/__tests__/auth-rate-limit.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Apply the limiter to the auth routes**

In `backend/src/routes/auth.routes.ts`, import the limiter and attach it to login and refresh. Replace the file body with:

```ts
import { Router } from "express";
import { loginHandler, refreshHandler, meHandler, logoutHandler } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rate-limit.js";

const router = Router();

router.post("/auth/login", authLimiter, loginHandler);
router.post("/auth/refresh", authLimiter, refreshHandler);
router.get("/auth/me", requireAuth as any, meHandler);
router.post("/auth/logout", requireAuth as any, logoutHandler);

export default router;
```

- [ ] **Step 7: Verify existing auth suites still pass (limiter relaxed under VITEST)**

Run: `cd backend && npx vitest run src/__tests__/authorization-perimeter.test.ts`
Expected: PASS — repeated `loginAs` calls are unaffected because `defaultMax` is `1000` under VITEST.

- [ ] **Step 8: Commit**

```bash
git add backend/src/middleware/rate-limit.ts backend/src/routes/auth.routes.ts backend/src/__tests__/auth-rate-limit.test.ts backend/package.json backend/package-lock.json
git commit -m "fix: rate-limit login and refresh endpoints"
```

---

### Task 3: Pin CORS to the configured client origin

**Files:**
- Modify: `backend/src/app.ts` (~L19-24)
- Test: `backend/src/__tests__/cors-origin.test.ts` (create)

**Interfaces:**
- Consumes: `env.CLIENT_URL` (already imported in `app.ts`), which defaults to `http://localhost:5173`.

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/cors-origin.test.ts`:

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("CORS origin", () => {
  it("does not echo an arbitrary request origin", async () => {
    const res = await request(createApp())
      .get("/health")
      .set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).not.toBe("https://evil.example");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/__tests__/cors-origin.test.ts`
Expected: FAIL — with `origin: true`, cors reflects the request origin, so the header equals `https://evil.example`.

- [ ] **Step 3: Apply the fix**

In `backend/src/app.ts`, replace:

```ts
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
```

with:

```ts
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true
    })
  );
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/__tests__/cors-origin.test.ts`
Expected: PASS — allow-origin is now the fixed `env.CLIENT_URL`, never the attacker origin.

- [ ] **Step 5: Commit**

```bash
git add backend/src/app.ts backend/src/__tests__/cors-origin.test.ts
git commit -m "fix: pin CORS to configured client origin"
```

---

### Task 4: Scope the dashboard summary endpoint to the actor's role

**Files:**
- Modify: `backend/src/controllers/bootstrap.controller.ts`
- Test: `backend/src/__tests__/dashboard-scope.test.ts` (create)

**Interfaces:**
- Consumes: `requireActor(req)` (from `./helpers.js`), `apiToWebRole` (from `../domain/roles.js`), `AppError` (from `../lib/http.js`).

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/dashboard-scope.test.ts`:

```ts
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string) {
  const res = await request(createApp()).post("/api/auth/login").send({ email, password: email }).expect(200);
  return res.body.data as { accessToken: string };
}

describe("dashboard summary scoping", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);
  beforeEach(async () => { await seedDatabase(); }, 30_000);
  afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); }, 30_000);

  it("blocks a board user from requesting the editor dashboard", async () => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .get("/api/dashboard/editor/summary")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(403);
  });

  it("allows a board user to request their own dashboard", async () => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .get("/api/dashboard/board/summary")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/__tests__/dashboard-scope.test.ts`
Expected: FAIL — the first case returns `200` (no scoping yet).

- [ ] **Step 3: Apply the fix**

In `backend/src/controllers/bootstrap.controller.ts`, add `AppError` to the http import and rewrite the handler. Change the import line:

```ts
import { asyncRoute, ok } from "../lib/http.js";
```

to:

```ts
import { asyncRoute, ok, AppError } from "../lib/http.js";
```

Then replace:

```ts
export const dashboardSummaryHandler = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await dashboardSummary(String(req.params.role)));
});
```

with:

```ts
export const dashboardSummaryHandler = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const requestedRole = String(req.params.role);
  if (actor.role !== "ADMIN" && requestedRole !== apiToWebRole[actor.role]) {
    throw new AppError(403, "You do not have permission for this dashboard.", "FORBIDDEN");
  }
  ok(res, await dashboardSummary(requestedRole));
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/__tests__/dashboard-scope.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/bootstrap.controller.ts backend/src/__tests__/dashboard-scope.test.ts
git commit -m "fix: scope dashboard summary endpoint to actor role"
```

---

### Task 5: Restrict editor file-key visibility to non-DRAFT proposals

**Files:**
- Modify: `backend/src/services/studio-access.service.ts` (`assertFileKeyVisible`, ~L85-90)
- Test: `backend/src/__tests__/file-key-visibility.test.ts` (create)

**Interfaces:**
- Consumes: `ProposalModel` (to set fixtures), the existing `POST /api/files/display-url` route which calls `assertFileKeyVisible`.

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/file-key-visibility.test.ts`:

```ts
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { ProposalModel } from "../db/models.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string) {
  const res = await request(createApp()).post("/api/auth/login").send({ email, password: email }).expect(200);
  return res.body.data as { accessToken: string };
}

describe("editor file-key visibility", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);
  beforeEach(async () => {
    await seedDatabase();
    await ProposalModel.updateOne(
      { id: "p-001" },
      { $set: { status: "DRAFT", coverFileKey: "proposals/p-001/cover.png" } },
    );
    await ProposalModel.updateOne(
      { id: "p-002" },
      { $set: { status: "PENDING_EDITOR", coverFileKey: "proposals/p-002/cover.png" } },
    );
  }, 30_000);
  afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); }, 30_000);

  it("blocks an editor from resolving a DRAFT proposal cover key", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ key: "proposals/p-001/cover.png" })
      .expect(403);
  });

  it("still allows an editor to resolve a non-DRAFT proposal cover key", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ key: "proposals/p-002/cover.png" })
      .expect(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/__tests__/file-key-visibility.test.ts`
Expected: FAIL — the DRAFT case returns `200` (editors currently see any proposal cover).

- [ ] **Step 3: Apply the fix**

In `backend/src/services/studio-access.service.ts`, inside `assertFileKeyVisible`, replace:

```ts
    const canRead =
      actor.role === "ADMIN" ||
      (actor.role === "BOARD" && boardVisibleStatuses.has(String((proposal as any).status))) ||
      actor.role === "EDITOR" ||
      (actor.role === "MANGAKA" && (proposal as any).authorId === actor.id);
```

with:

```ts
    const canRead =
      actor.role === "ADMIN" ||
      (actor.role === "BOARD" && boardVisibleStatuses.has(String((proposal as any).status))) ||
      (actor.role === "EDITOR" && String((proposal as any).status) !== "DRAFT") ||
      (actor.role === "MANGAKA" && (proposal as any).authorId === actor.id);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/__tests__/file-key-visibility.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/studio-access.service.ts backend/src/__tests__/file-key-visibility.test.ts
git commit -m "fix: hide DRAFT proposal cover keys from editors"
```

---

### Task 6: Collapse duplicate role middleware into aliases

**Files:**
- Modify: `backend/src/middleware/auth.ts` (L26-44)

**Interfaces:**
- Produces: `requireExactRole` and `requireExactBoardChair` exported names preserved (now aliases), so the ~60 route call sites remain valid with no behavior change.

- [ ] **Step 1: Apply the fix**

In `backend/src/middleware/auth.ts`, replace the two `export function requireExactRole(...)` and `export function requireExactBoardChair(...)` definitions (currently identical copies of `requireRole` / `requireBoardChair`) with aliases:

```ts
// requireExactRole / requireExactBoardChair are intentional aliases of the base
// guards, kept as distinct exported names only so existing route call sites do
// not churn. They enforce identical rules — there is no stricter "exact" check.
export const requireExactRole = requireRole;
export const requireExactBoardChair = requireBoardChair;
```

Leave `requireAuth`, `requireRole`, and `requireBoardChair` unchanged.

- [ ] **Step 2: Typecheck to confirm no call site breaks**

Run: `cd backend && npm run lint`
Expected: PASS (no type errors; `requireExactRole`/`requireExactBoardChair` still resolve at every call site).

- [ ] **Step 3: Run the auth-touching suites**

Run: `cd backend && npx vitest run src/__tests__/authorization-perimeter.test.ts src/__tests__/admin.test.ts`
Expected: PASS — guard behavior is unchanged.

- [ ] **Step 4: Commit**

```bash
git add backend/src/middleware/auth.ts
git commit -m "refactor: collapse duplicate requireExact role guards into aliases"
```

---

### Task 7: Remove the dead FORCE_STATUS handler

**Files:**
- Modify: `backend/src/services/workflow.service.ts` (`applyProposalAction` switch, ~L1013-1026)

**Interfaces:**
- Consumes: nothing new. `assertProposalAction` already throws `410 WORKFLOW_REMOVED` for `FORCE_STATUS` before the switch runs, so the switch case is unreachable.

- [ ] **Step 1: Apply the fix**

In `backend/src/services/workflow.service.ts`, inside the `applyProposalAction` switch, delete the entire unreachable `case "FORCE_STATUS"` block:

```ts
    case "FORCE_STATUS": {
      if (!payload.forceStatus)
        throw new AppError(400, "forceStatus is required.", "VALIDATION_ERROR");
      patch.status = payload.forceStatus;
      // Board picks the publication cadence when finalizing an approval.
      if (payload.forceStatus === "APPROVED") {
        const pubType = normalizePublicationType(payload.publicationType);
        if (!pubType) {
          throw new AppError(400, "Invalid publicationType.", "VALIDATION_ERROR");
        }
        patch.boardApprovedPublicationType = pubType;
      }
      break;
    }
```

Leave the `FORCE_STATUS` guard in `assertProposalAction` (the `410 WORKFLOW_REMOVED` throw) untouched — it stays the single source of truth.

- [ ] **Step 2: Typecheck**

Run: `cd backend && npm run lint`
Expected: PASS — no unused-variable or type errors (`normalizePublicationType` is still used by `ensureProductionSeriesForApprovedProposal`).

- [ ] **Step 3: Run the workflow + proposal suites**

Run: `cd backend && npx vitest run src/__tests__/workflow.test.ts src/__tests__/p0-workflow-refactor.test.ts`
Expected: PASS — `FORCE_STATUS` still yields `410` via the guard.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/workflow.service.ts
git commit -m "chore: remove dead FORCE_STATUS proposal handler"
```

---

### Task 8: Final full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the entire backend test suite**

Run: `cd backend && npm test`
Expected: PASS — all pre-existing suites plus the four new test files (`board-quorum`, `auth-rate-limit`, `cors-origin`, `dashboard-scope`, `file-key-visibility`) green.

- [ ] **Step 2: Typecheck the whole backend**

Run: `cd backend && npm run lint`
Expected: PASS — no type errors.

- [ ] **Step 3: If anything fails, fix inline and re-run before proceeding.**
