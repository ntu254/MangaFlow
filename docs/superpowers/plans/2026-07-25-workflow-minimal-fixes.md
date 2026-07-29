# Workflow Minimal Fixes (Q1, Q4, +Q5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two approved must-fix business gaps from the workflow reconstruction — a Series `CANCEL` action (Q1) and non-zero assistant earnings via the existing `rateSnapshot` (Q4) — plus an optional data-integrity task deriving board voters from actual BOARD users (Q5). No confirmed workflow changes.

**Architecture:** Small, additive backend changes. Q1 extends the existing `seriesLifecycleAction`. Q4 adds a tiny static default-rate helper used at task creation and removes a dead 0-rate stub. Q5 replaces a hardcoded voter array with a DB query. Each task ships one focused test.

**Tech Stack:** Node ESM, Express 5, Mongoose, Zod, vitest + supertest + mongodb-memory-server.

## Global Constraints

- ESM: all relative imports use the `.js` extension.
- Tests live in `backend/src/__tests__/*.test.ts`; run from the `backend/` directory with `npx vitest run <file>`.
- API success envelope is `{ data: ... }`; supertest reads `response.body.data`.
- DB-backed tests: `MongoMemoryReplSet.create({ replSet: { count: 1 } })`, `mongoose.connect`, `seedDatabase()` in `beforeEach`. Login helper: `POST /api/auth/login` `{ email, password }` where `password === email`; response is `res.body.data`.
- Seed fixtures: admin `admin@beachread.jp`, mangaka `inoue@beachread.jp`, assistant `jun@beachread.jp`, board chair `board@beachread.jp`; series `s-berserk-prod` (status `ONGOING`, author `u-mangaka`, editor `u-editor`); 6 active BOARD users.
- Keep confirmed workflows unchanged. One commit per task; run from repo root `E:/website/storyboard-nexus`.

---

### Task 1: Q1 — Series CANCEL lifecycle action

**Files:**
- Modify: `backend/src/controllers/series.controller.ts` (`seriesLifecycleAction`, ~L327-346)
- Modify: `backend/src/db/models.ts` (`SeriesRecord` type ~L437-442 and `seriesSchema` ~L474-479 — add `cancelledAt`/`cancelledById`/`cancelReason`)
- Test: `backend/src/__tests__/series-cancel.test.ts` (create)

**Interfaces:**
- Produces: `POST /api/series/:id/actions/CANCEL` → sets Series `status: "CANCELLED"`, `cancelledAt`, optional `cancelReason`. Guarded by the existing route (`requireExactRole("ADMIN","EDITOR","MANGAKA")`) plus `assertCanMutateSeries` and the Admin/Editor check already in the handler.

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/series-cancel.test.ts`:

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

describe("series CANCEL action", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);
  beforeEach(async () => { await seedDatabase(); }, 30_000);
  afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); }, 30_000);

  it("lets an admin cancel a series", async () => {
    const admin = await loginAs("admin@beachread.jp");
    const res = await request(createApp())
      .post("/api/series/s-berserk-prod/actions/CANCEL")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ reason: "Discontinued for demo" })
      .expect(200);
    expect(res.body.data.status).toBe("CANCELLED");
    expect(res.body.data.cancelledAt).toBeTruthy();
  });

  it("rejects a non-privileged role", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    await request(createApp())
      .post("/api/series/s-berserk-prod/actions/CANCEL")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ reason: "nope" })
      .expect(403);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/__tests__/series-cancel.test.ts`
Expected: FAIL — the admin case returns `400 INVALID_ACTION` (CANCEL not handled yet).

- [ ] **Step 3: Add the cancel fields to the Series model**

In `backend/src/db/models.ts`, in the `SeriesRecord` type add after `archiveReason?: string;` (~L439):

```ts
  cancelledAt?: Date;
  cancelledById?: string;
  cancelReason?: string;
```

In `seriesSchema` add after `archiveReason: { type: String },` (~L476):

```ts
  cancelledAt: { type: Date },
  cancelledById: { type: String },
  cancelReason: { type: String },
```

- [ ] **Step 4: Handle CANCEL in `seriesLifecycleAction`**

In `backend/src/controllers/series.controller.ts`, replace:

```ts
  const status = action === "UNPUBLISH" ? "HIATUS" : action === "ARCHIVE" ? "ARCHIVED" : null;
  if (!status) throw new AppError(400, "Unknown series lifecycle action.", "INVALID_ACTION");
  const patch: Record<string, unknown> = { status, updatedAt: nowIso() };
  if (action === "ARCHIVE") patch.archivedAt = nowIso();
  if (action === "UNPUBLISH") patch.unpublishedAt = nowIso();
```

with:

```ts
  const status =
    action === "UNPUBLISH" ? "HIATUS" :
    action === "ARCHIVE" ? "ARCHIVED" :
    action === "CANCEL" ? "CANCELLED" : null;
  if (!status) throw new AppError(400, "Unknown series lifecycle action.", "INVALID_ACTION");
  const patch: Record<string, unknown> = { status, updatedAt: nowIso() };
  if (action === "ARCHIVE") patch.archivedAt = nowIso();
  if (action === "UNPUBLISH") patch.unpublishedAt = nowIso();
  if (action === "CANCEL") {
    patch.cancelledAt = nowIso();
    patch.cancelledById = actor.id;
    patch.cancelReason = typeof req.body?.reason === "string" ? req.body.reason : "";
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run src/__tests__/series-cancel.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/series.controller.ts backend/src/db/models.ts backend/src/__tests__/series-cancel.test.ts
git commit -m "feat: add Series CANCEL lifecycle action"
```

---

### Task 2: Q4 — Non-zero assistant earnings via default rate

**Files:**
- Create: `backend/src/domain/rates.ts`
- Modify: `backend/src/controllers/studio.controller.ts` (`createTask`, ~L255-256)
- Modify: `backend/src/services/workflow.service.ts` (remove dead `resolveTaskRate` ~L329 and `createEarningItemIfMissing` ~L338-386; drop the now-unused `EarningItemModel` import if it becomes unused)
- Test: `backend/src/__tests__/task-default-rate.test.ts` (create)

**Interfaces:**
- Produces: `resolveDefaultRate(workUnitType?: string): number` — returns a non-zero VND rate for known work-unit types, else a non-zero fallback. `createTask` uses it when no positive `rateSnapshot` is supplied, so `Earning.amount = quantity × rateSnapshot` (computed unchanged in `submissionDecision`) is non-zero.

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/task-default-rate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveDefaultRate, FALLBACK_TASK_RATE } from "../domain/rates.js";

describe("resolveDefaultRate", () => {
  it("returns a non-zero rate for a known work-unit type", () => {
    expect(resolveDefaultRate("PAGE")).toBeGreaterThan(0);
    expect(resolveDefaultRate("page")).toBe(resolveDefaultRate("PAGE"));
  });
  it("falls back to a non-zero rate for unknown or missing types", () => {
    expect(resolveDefaultRate("something-else")).toBe(FALLBACK_TASK_RATE);
    expect(resolveDefaultRate(undefined)).toBe(FALLBACK_TASK_RATE);
    expect(FALLBACK_TASK_RATE).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/__tests__/task-default-rate.test.ts`
Expected: FAIL — cannot resolve `../domain/rates.js` (module does not exist).

- [ ] **Step 3: Create the default-rate helper**

Create `backend/src/domain/rates.ts`:

```ts
// Minimal static default rates (VND) per studio work-unit type. Applied when a
// task is created without an explicit rateSnapshot so that assistant earnings
// (quantity × rateSnapshot) are non-zero. Mangaka may still override per task.
export const DEFAULT_TASK_RATES: Record<string, number> = {
  PAGE: 200000,
  PANEL: 50000,
  REGION: 30000,
  BUBBLE: 10000,
};

export const FALLBACK_TASK_RATE = 50000;

export function resolveDefaultRate(workUnitType?: string): number {
  if (!workUnitType) return FALLBACK_TASK_RATE;
  return DEFAULT_TASK_RATES[workUnitType.toUpperCase()] ?? FALLBACK_TASK_RATE;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/__tests__/task-default-rate.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Apply the default rate in `createTask`**

In `backend/src/controllers/studio.controller.ts`, add the import near the top (with the other imports):

```ts
import { resolveDefaultRate } from "../domain/rates.js";
```

Then replace:

```ts
  const quantity = Number(body.quantity ?? 1);
  const rateSnapshot = Number(body.rateSnapshot ?? 0);
  const estimatedAmount = quantity * rateSnapshot;
```

with:

```ts
  const quantity = Number(body.quantity ?? 1);
  const providedRate = Number(body.rateSnapshot ?? 0);
  const rateSnapshot = providedRate > 0 ? providedRate : resolveDefaultRate(body.workUnitType);
  const estimatedAmount = quantity * rateSnapshot;
```

- [ ] **Step 6: Remove the dead 0-rate stub**

In `backend/src/services/workflow.service.ts`, delete the unused `resolveTaskRate` function (the `function resolveTaskRate(taskType: string): number { ... return 0; }` block, ~L329) and the unused `createEarningItemIfMissing` function (the whole `async function createEarningItemIfMissing(...) { ... }` block, ~L338-386). Neither has any caller (`resolveTaskRate` is used only inside `createEarningItemIfMissing`, which is never called).

Then, if `EarningItemModel` is no longer referenced in this file, remove it from the model import list at the top of the file. Verify with:

Run: `cd backend && grep -n "EarningItemModel\|resolveTaskRate\|createEarningItemIfMissing" src/services/workflow.service.ts`
Expected: no matches remain (if `EarningItemModel` still appears only in the import line, delete that import entry).

- [ ] **Step 7: Typecheck and run the earnings-touching suites**

Run: `cd backend && npm run lint`
Expected: PASS — no unused-symbol or type errors.

Run: `cd backend && npx vitest run src/__tests__/task-default-rate.test.ts src/__tests__/production-completion.test.ts`
Expected: PASS — default-rate unit tests green; existing production/earnings flow unaffected.

- [ ] **Step 8: Commit**

```bash
git add backend/src/domain/rates.ts backend/src/controllers/studio.controller.ts backend/src/services/workflow.service.ts backend/src/__tests__/task-default-rate.test.ts
git commit -m "feat: default task rate so assistant earnings are non-zero"
```

---

### Task 3 (OPTIONAL): Q5 — Derive board voters from active BOARD users

**Files:**
- Modify: `backend/src/controllers/voting.controller.ts` (`createVotingSession`, ~L221-240; add an exported helper)
- Test: `backend/src/__tests__/board-eligibility.test.ts` (create)

**Interfaces:**
- Produces: `activeBoardVoterIds(): Promise<string[]>` — ids of all active `BOARD` users. `createVotingSession` uses it for `eligibleVoterIds` instead of the hardcoded array.

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/board-eligibility.test.ts`:

```ts
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedDatabase } from "../seed.js";
import { UserModel } from "../db/models.js";
import { activeBoardVoterIds } from "../controllers/voting.controller.js";

let mongo: MongoMemoryReplSet;

describe("activeBoardVoterIds", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);
  beforeEach(async () => { await seedDatabase(); }, 30_000);
  afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); }, 30_000);

  it("returns exactly the active BOARD user ids", async () => {
    const ids = await activeBoardVoterIds();
    const expected = (await UserModel.find({ role: "BOARD", active: true }).select({ id: 1 }).lean())
      .map((u: any) => u.id);
    expect([...ids].sort()).toEqual([...expected].sort());
    expect(ids.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/__tests__/board-eligibility.test.ts`
Expected: FAIL — `activeBoardVoterIds` is not exported from the controller.

- [ ] **Step 3: Add the helper and use it**

In `backend/src/controllers/voting.controller.ts`, ensure `UserModel` is imported from `../db/models.js`, then add near the top-level exports:

```ts
export async function activeBoardVoterIds(): Promise<string[]> {
  const boardUsers = await UserModel.find({ role: "BOARD", active: true }).select({ id: 1 }).lean();
  return boardUsers.map((user: any) => user.id);
}
```

In `createVotingSession`, replace the hardcoded line:

```ts
    eligibleVoterIds: ["u-board", "u-board-2", "u-board-3", "u-board-4", "u-board-5"],
```

with:

```ts
    eligibleVoterIds: await activeBoardVoterIds(),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/__tests__/board-eligibility.test.ts`
Expected: PASS.

- [ ] **Step 5: Confirm the board voting suite still passes**

Run: `cd backend && npx vitest run src/__tests__/board.test.ts`
Expected: PASS — session creation still works; `eligibleVoterIds` now reflects seeded BOARD users.

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/voting.controller.ts backend/src/__tests__/board-eligibility.test.ts
git commit -m "feat: derive board voter eligibility from active BOARD users"
```

---

### Task 4: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the entire backend suite**

Run: `cd backend && npm test`
Expected: PASS — all existing suites plus the new `series-cancel`, `task-default-rate`, and (if Task 3 done) `board-eligibility` files.

- [ ] **Step 2: Typecheck the whole backend**

Run: `cd backend && npm run lint`
Expected: PASS — no type errors.

- [ ] **Step 3: If anything fails, fix inline and re-run before concluding.**
