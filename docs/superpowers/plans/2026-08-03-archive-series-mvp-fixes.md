# Archive Series MVP Guard Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chặn mọi thao tác sửa đổi trên Series đã ARCHIVED (backend guard tập trung) và đồng bộ UI (nút Archive, studio) với backend.

**Architecture:** Guard tập trung tại `assertCanMutateSeries` trong `backend/src/services/authorization.service.ts` — mọi mutation (series patch, chapter, task, region, studio page, material) đều đi qua hàm này nên một thay đổi chặn được tất cả. Frontend: đồng bộ điều kiện `canArchive` với gate backend, và chặn vào studio bằng `canEnterStudio: false` khi ARCHIVED (cơ chế `effectiveTab` fallback overview đã có sẵn).

**Tech Stack:** Express + Mongoose + Vitest (backend); React + TanStack Query + zustand (frontend).

**Global Constraints:**
- Không chặn HIATUS — chỉ ARCHIVED (+ `deletedAt` cho deleted).
- `deleteSeries` KHÔNG được đi qua guard mới (nó tự check quyền riêng).
- Lỗi dùng 409 với code `SERIES_ARCHIVED` / `SERIES_DELETED` — không dùng 403 generic (mangaka vẫn đọc được series archived).
- File test backend: `backend/src/__tests__/admin-scope.test.ts` — `loginAs("inoue@beachread.jp")` = mangaka, `loginAs("editor@mangaflow.local")` = Tantou.
- Frontend: KHÔNG có test infra — verify bằng `npm run typecheck`, `npm run lint`, detector, và Playwright smoke script.

---

### Task 1: Backend guard ARCHIVED trong `assertCanMutateSeries` + tests

**Files:**
- Modify: `backend/src/services/authorization.service.ts:106-108`
- Modify: `backend/src/__tests__/admin-scope.test.ts` (import dòng 6 + thêm describe mới sau dòng 267)
- Test: `backend/src/__tests__/admin-scope.test.ts`

**Interfaces:**
- Consumes: `AppError` (đã import sẵn), `SeriesModel`/`ChapterModel` (test).
- Produces: `assertCanMutateSeries` trả 409 `SERIES_ARCHIVED` nếu `series.status === "ARCHIVED"`; 409 `SERIES_DELETED` nếu `series.deletedAt` — trước check quyền.

- [ ] **Step 1: Viết test fail** — thêm vào `admin-scope.test.ts`:

Sửa import dòng 6 thành:

```ts
import { NotificationModel, ProposalModel, SeriesModel, ChapterModel } from "../db/models.js";
```

Thêm describe mới ngay sau `describe("Series lifecycle §3.1 matrix", ...)` (kết thúc dòng 267):

```ts
  describe("Archived series is immutable", () => {
    async function makeArchivedSeries(id: string) {
      await SeriesModel.create({
        id,
        slug: id,
        title: `Archived series ${id}`,
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        editorId: "u-mobile-editor",
        editorName: "Mobile Editor",
        status: "ARCHIVED",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it("rejects PATCH on an archived series (409 SERIES_ARCHIVED)", async () => {
      await makeArchivedSeries("s-admin-scope-archived-patch");
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .patch("/api/series/s-admin-scope-archived-patch")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ title: "Renamed after archive" })
        .expect(409);
      expect(response.body.code).toBe("SERIES_ARCHIVED");
    });

    it("rejects PATCH on a chapter of an archived series (409 SERIES_ARCHIVED)", async () => {
      await makeArchivedSeries("s-admin-scope-archived-chapter");
      await ChapterModel.create({
        id: "ch-admin-scope-archived",
        seriesId: "s-admin-scope-archived-chapter",
        number: 1,
        title: "Archived chapter",
        status: "PLANNED",
        pages: [],
        history: [],
      });
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .patch("/api/chapters/ch-admin-scope-archived")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ title: "Edited after archive" })
        .expect(409);
      expect(response.body.code).toBe("SERIES_ARCHIVED");
    });
  });
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run (workdir `backend`): `npx vitest run src/__tests__/admin-scope.test.ts -t "Archived series is immutable"`

Expected: FAIL — cả 2 test nhận 200 (guard chưa có).

- [ ] **Step 3: Implement guard** — `backend/src/services/authorization.service.ts:106-108`, thay:

```ts
export async function assertCanMutateSeries(actor: RequestActor, series: any) {
  if (!(await canMutateSeries(actor, series))) throw forbidden("You do not have permission to change this series.");
}
```

bằng:

```ts
export async function assertCanMutateSeries(actor: RequestActor, series: any) {
  if (String(series.status) === "ARCHIVED") {
    throw new AppError(409, "Series is archived and cannot be modified.", "SERIES_ARCHIVED");
  }
  if (series.deletedAt) {
    throw new AppError(409, "Series is deleted and cannot be modified.", "SERIES_DELETED");
  }
  if (!(await canMutateSeries(actor, series))) throw forbidden("You do not have permission to change this series.");
}
```

- [ ] **Step 4: Chạy test xác nhận PASS**

Run (workdir `backend`): `npx vitest run src/__tests__/admin-scope.test.ts`

Expected: PASS — cả suite (kể cả test ARCHIVE cũ), 2 test mới pass với 409 SERIES_ARCHIVED.

- [ ] **Step 5: Chạy full backend suite (regression — guard mới có thể đụng test khác)**

Run (workdir `backend`): `npm test`

Expected: toàn bộ PASS. Nếu có test fail do guard mới, sửa test đó theo đúng hành vi mới (mutation trên series ARCHIVED giờ phải 409).

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/authorization.service.ts backend/src/__tests__/admin-scope.test.ts
git commit -m "fix(series): block all mutations on archived or deleted series"
```

---

### Task 2: Đồng bộ `canArchive` frontend với backend

**Files:**
- Modify: `frontend/src/features/series/detail/components/series-overview.tsx:132`
- Verify: `frontend/src/features/series/detail/components/series-overview.tsx`

**Interfaces:**
- Consumes: `isPublic` (dòng 128, đã = `["ONGOING","COMPLETED","PUBLISHED","PUBLIC"].includes(series.status)`), `isOwner`, `isAssignedTantou`.
- Produces: `canArchive` — boolean đúng gate backend: status ∈ {PLANNING, PRE_PRODUCTION, ONGOING, PUBLISHED, PUBLIC} và (public ? Tantou : owner hoặc Tantou).

- [ ] **Step 1: Sửa `canArchive`** — `frontend/src/features/series/detail/components/series-overview.tsx:132`, thay:

```ts
  const canArchive = !!user && series.status !== "ARCHIVED" && (isOwner || isAssignedTantou);
```

bằng:

```ts
  const canArchive =
    !!user &&
    ["PLANNING", "PRE_PRODUCTION", "ONGOING", "PUBLISHED", "PUBLIC"].includes(series.status) &&
    (isPublic ? isAssignedTantou : isOwner || isAssignedTantou);
```

Không sửa gì khác — dialog/handler/lifecycle mutation giữ nguyên.

- [ ] **Step 2: Typecheck**

Run (workdir `frontend`): `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Lint**

Run (workdir `frontend`): `npx eslint src/features/series/detail/components/series-overview.tsx`

Expected: không có error mới.

- [ ] **Step 4: Detector (anti-pattern)**

Run (workdir root): `node .agents/skills/impeccable/scripts/detect.mjs frontend/src/features/series/detail/components/series-overview.tsx`

Expected: không có finding liên quan tới thay đổi này.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/series/detail/components/series-overview.tsx
git commit -m "fix(series): sync archive button visibility with backend transition gate"
```

---

### Task 3: Chặn studio khi series ARCHIVED

**Files:**
- Modify: `frontend/src/features/series/detail/model/studio-permissions.ts:50-249`
- Verify: `frontend/src/features/series/detail/components/series-detail-page.tsx` (chỉ đọc — không sửa)

**Interfaces:**
- Consumes: `series.status` (ProductionSeries).
- Produces: `getStudioPermissions` trả `canEnterStudio: false` khi `series.status === "ARCHIVED"` (giữ nguyên `mode`, `title`, `summary` theo role).

- [ ] **Step 1: Thêm helper `finalizeArchived` + guard** — `frontend/src/features/series/detail/model/studio-permissions.ts`:

Sau dòng 48 (`const VIEWER_TOOLS ...`), thêm:

```ts
function withArchivedLock(
  permissions: StudioPermissionSet,
  archived: boolean,
): StudioPermissionSet {
  return archived ? { ...permissions, canEnterStudio: false } : permissions;
}
```

Trong `getStudioPermissions`, ngay sau `const assignedEditor = series.editorId === user.id;` (dòng 54), thêm:

```ts
  const archived = series.status === "ARCHIVED";
```

Đổi 5 branch role từ `return {` thành `return withArchivedLock({` và đóng `};` thành `}, archived);` — cụ thể:
- dòng 57: `if (role === "mangaka") {` → `return withArchivedLock({ ... }, archived);` (kết thúc dòng 93)
- dòng 96: `if (role === "assistant") {` → tương tự (kết thúc dòng 133)
- dòng 136: `if (role === "editor") {` → tương tự (kết thúc dòng 173)
- dòng 176: `if (role === "board") {` → tương tự (kết thúc dòng 211)
- cuối hàm (dòng 214, admin) → `return withArchivedLock({ ... }, archived);` (kết thúc dòng 248)

(Lưu ý: đóng ngoặc đúng — object `}` thành `}, archived);`.)

- [ ] **Step 2: Typecheck**

Run (workdir `frontend`): `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Lint**

Run (workdir `frontend`): `npx eslint src/features/series/detail/model/studio-permissions.ts`

Expected: không có error.

- [ ] **Step 4: Detector**

Run (workdir root): `node .agents/skills/impeccable/scripts/detect.mjs frontend/src/features/series/detail/model/studio-permissions.ts`

Expected: không có finding mới.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/series/detail/model/studio-permissions.ts
git commit -m "fix(series): lock studio entry for archived series"
```

---

### Task 4: Verify end-to-end + smoke test

**Files:**
- Create (tạm, xóa sau): `frontend/archive-smoke.mjs`

**Interfaces:**
- Consumes: dev servers (frontend 8080, backend 3001 — nếu chưa chạy, restart theo pattern: `Start-Process cmd.exe -ArgumentList "/c","npm run dev > <log> 2>&1" -WindowStyle Hidden` trong `frontend` và `backend`).
- Produces: xác nhận UI đúng trên series ARCHIVED thật.

- [ ] **Step 1: Chuẩn bị dữ liệu** — series ARCHIVED thật trong dev DB (seed không có series archived; route `POST /api/series` không tồn tại nên chèn trực tiếp bằng mongoose):

Tạo `backend/prep-archive.mjs` (chạy 1 lần, xóa sau; dev DB = `mongodb://127.0.0.1:27017/mangaflow`):

```js
import mongoose from "mongoose";
import { SeriesModel } from "./src/db/models.js";
await mongoose.connect("mongodb://127.0.0.1:27017/mangaflow");
await SeriesModel.deleteOne({ id: "s-archive-smoke" });
await SeriesModel.create({
  id: "s-archive-smoke",
  slug: "s-archive-smoke",
  title: "Archive smoke series",
  authorId: "u-mangaka",
  authorName: "Inoue Takehiko",
  editorId: "u-mobile-editor",
  editorName: "Mobile Editor",
  status: "ARCHIVED",
  visibility: "UNLISTED",
  createdAt: new Date(),
  updatedAt: new Date(),
});
await mongoose.disconnect();
```

Tạo `frontend/archive-smoke.mjs`:

```js
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const base = "http://localhost:8080";
async function login(email) {
  await page.goto(`${base}/login`);
  await page.fill("#email", email);
  await page.fill("#password", email);
  await Promise.all([
    page.waitForURL("**/app/**", { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
}
await login("inoue@beachread.jp");
await page.goto(`${base}/app/series/s-archive-smoke/overview`);
await page.waitForLoadState("networkidle");
console.log("NO_ARCHIVE_BUTTON:", (await page.getByRole("button", { name: "Archive" }).count()) === 0);
console.log("HAS_ARCHIVED_BADGE:", (await page.textContent("body")).includes("Archived"));
console.log("OPEN_STUDIO_HIDDEN:", (await page.getByText("Open Studio", { exact: true }).count()) === 0);
await page.goto(`${base}/app/series/s-archive-smoke/studio`);
await page.waitForTimeout(2500);
console.log("STUDIO_FALLBACK_URL:", page.url().includes("/overview"));
await browser.close();
```

- [ ] **Step 2: Chạy prep + smoke — xác nhận cả 4 kết quả đúng**

Run (workdir `backend`, server đang chạy): `node prep-archive.mjs`

Run (workdir `frontend`): `node archive-smoke.mjs`

Expected:
```
NO_ARCHIVE_BUTTON: true
HAS_ARCHIVED_BADGE: true
OPEN_STUDIO_HIDDEN: true
STUDIO_FALLBACK_URL: true
```

- [ ] **Step 3: Xóa script + commit kết quả verify**

```bash
Remove-Item frontend/archive-smoke.mjs
Remove-Item backend/prep-archive.mjs
```

Chạy lại lần cuối: `npm test` (backend, workdir `backend`), `npm run typecheck` + `npm run lint` (frontend, workdir `frontend`).

Expected: toàn bộ PASS.

- [ ] **Step 4: Commit cuối (nếu còn thay đổi nào chưa commit)**

```bash
git status
git add -A
git commit -m "chore: verify archive series guard fixes end-to-end"
```
