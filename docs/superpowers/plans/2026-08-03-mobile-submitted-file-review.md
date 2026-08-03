# Mobile Submitted File Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Give Board and assigned Tantou Editor users a role-scoped mobile file-review surface with on-demand signed URLs that remain usable across a 900-second URL lifetime.

**Architecture:** Backend exposes review-file metadata per review context and authorizes a display URL for each open. Mobile stores only metadata and an in-memory URL lease, then renders reusable submitted-files and full-screen image/PDF viewer components. The lease manager refreshes before expiry and performs exactly one refresh-and-retry after a preview failure.

**Tech Stack:** Express, TypeScript, Mongoose, Vitest/Supertest; Expo 56, React Native, expo-image, react-native-webview; Node test runner.

## Global Constraints

- Board receives proposal review files only; it must never receive chapter, page, task, or submission files.
- Editor receives only files visible through assigned proposal/chapter review authority.
- Every display-url request re-runs backend authorization; mobile never signs, persists, logs, or fabricates a URL.
- Treat a signed URL as expired after server expiresAt, or after eight minutes when absent; do not prefetch URLs.
- On preview loading failure, refresh the URL once, retry once, then show a recoverable error.
- A 403 clears the active URL and shows access denied; a 404 shows unavailable; unsupported MIME types use external open/share only.
- Use test-first red/green steps. Do not change workflow state, upload files, or broaden permissions beyond this matrix.

---

## File Structure

- backend/src/services/review-file.service.ts: builds authorized proposal/chapter review-file metadata.
- backend/src/controllers/review-file.controller.ts, backend/src/routes/review-file.routes.ts: read-only API.
- backend/src/routes/series.routes.ts: permits Board on the existing scoped display URL route.
- backend/src/__tests__/review-file.service.test.ts, backend/src/__tests__/file-key-visibility.test.ts: boundary tests.
- mobile/src/domain/review-files.ts: DTOs, preview type, pure 900-second lease decisions.
- mobile/src/services/mobile-file-review.ts: authenticated metadata and display URL reads without mock URL fallback.
- mobile/src/components/submitted-files-panel.tsx, mobile/src/components/review-file-viewer.tsx: list and viewer.
- mobile/src/screens/editor-proposal-detail-screen.tsx, mobile/src/screens/editor-chapter-detail-screen.tsx, mobile/src/screens/board-session-detail-screen.tsx: placement in the live detail screens. mobile/src/hooks/use-editor-proposal.ts, mobile/src/hooks/use-editor-chapter.ts, mobile/src/hooks/use-board-session.ts: per-detail review-file state.
- mobile/src/__tests__/mobile-file-review.test.tsx: mobile contract/lifecycle tests.
- mobile/README.md, mobile/MOBILE_AGENT_CONTEXT.md, docs/business-flows/11-file-management.md, docs/business-flows/INDEX.md: maintained documentation.

### Task 1: Add a role-scoped backend review-file metadata contract

**Files:**
- Create: backend/src/services/review-file.service.ts
- Create: backend/src/controllers/review-file.controller.ts
- Create: backend/src/routes/review-file.routes.ts
- Modify: backend/src/app.ts
- Test: backend/src/__tests__/review-file.service.test.ts

**Interfaces:**

~~~
export type ReviewFile = {
  id: string; key: string; name: string; mimeType: string; size: number | null;
  version?: string; submittedAt?: string; submittedBy?: string;
  previewKind: "image" | "pdf" | "external";
};
export async function listReviewFiles(
  actor: RequestActor,
  input: { context: "proposal" | "chapter"; id: string },
): Promise<ReviewFile[]>;
~~~

- [ ] **Step 1: Write the failing tests**

~~~
it("returns only Board-visible proposal files", async () => {
  const board = await loginAs("board@beachread.jp");
  const response = await request(createApp())
    .get("/api/review-files/proposal/p-002")
    .set("Authorization", "Bearer " + board.accessToken).expect(200);
  expect(response.body.data).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: expect.any(String), key: expect.any(String), previewKind: expect.any(String) }),
  ]));
});
it("rejects Board access to chapter review files", async () => {
  const board = await loginAs("board@beachread.jp");
  await request(createApp()).get("/api/review-files/chapter/ch-s-berserk-prod-5")
    .set("Authorization", "Bearer " + board.accessToken).expect(403);
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: npm test --prefix backend -- review-file.service.test.ts

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement the minimum service, controller, and route**

~~~
router.get("/review-files/:context/:id",
  requireExactRole("BOARD", "EDITOR") as any, listReviewFilesController);

export async function listReviewFiles(actor: RequestActor, input: ReviewFileContext) {
  if (input.context === "proposal") return proposalReviewFiles(actor, input.id);
  if (actor.role !== "EDITOR") {
    throw new AppError(403, "Chapter review files require an assigned Tantou.", "FORBIDDEN");
  }
  return chapterReviewFiles(actor, input.id);
}
~~~

Proposal records include only current manuscript/attachments with a visible non-empty file key. Chapter records include only frozen chapter-review assets and current linked submissions after assigned-Tantou authorization. Normalize metadata and omit records with no key.

- [ ] **Step 4: Run the test to verify it passes**

Run: npm test --prefix backend -- review-file.service.test.ts

Expected: PASS; Board gets proposal metadata and a Board chapter query returns 403.

- [ ] **Step 5: Commit**

~~~
git add backend/src/services/review-file.service.ts backend/src/controllers/review-file.controller.ts backend/src/routes/review-file.routes.ts backend/src/app.ts backend/src/__tests__/review-file.service.test.ts
git commit -m "feat: expose scoped review file metadata"
~~~

### Task 2: Restrict Board display URLs to Board-review Proposal keys

**Files:**
- Modify: backend/src/routes/series.routes.ts:101-112
- Modify: backend/src/services/studio-access.service.ts
- Test: backend/src/__tests__/file-key-visibility.test.ts

**Interfaces:** consumes Task 1 ReviewFile.key. `assertFileKeyVisible` remains the enforcement point, but gains a Board-specific branch that authorizes only Proposal file keys belonging to a Proposal visible to Board. It must never use generic Board series scope for a display URL.

- [ ] **Step 1: Write the failing route-authorization test**

~~~
it("allows a Board user to resolve a Board-review proposal file but not a draft file", async () => {
  const board = await loginAs("board@beachread.jp");
  await request(createApp()).post("/api/files/display-url")
    .set("Authorization", "Bearer " + board.accessToken)
    .send({ key: "proposals/p-002/cover.png", fileName: "cover.png" }).expect(200);
  await request(createApp()).post("/api/files/display-url")
    .set("Authorization", "Bearer " + board.accessToken)
    .send({ key: "proposals/p-001/cover.png", fileName: "cover.png" }).expect(403);
});
it.each(["chapters/ch-1/pages/p-1.png", "series/s-1/cover.png", "materials/ch-1/reference.pdf", "submissions/sub-1/work.png"])("blocks Board display URL for production key %s", async (key) => {
  const board = await loginAs("board@beachread.jp");
  await request(createApp()).post("/api/files/display-url")
    .set("Authorization", "Bearer " + board.accessToken).send({ key }).expect(403);
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: npm test --prefix backend -- file-key-visibility.test.ts

Expected: FAIL on the allowed request because the route excludes BOARD. After adding the route gate, production-key tests must fail until the Board-specific guard exists.

- [ ] **Step 3: Add a Board-specific Proposal-key guard and route gate**

~~~
router.post("/files/display-url",
  requireExactRole("BOARD", "EDITOR", "MANGAKA", "ASSISTANT") as any, displayUrl);
~~~

Before generic key checks, `assertFileKeyVisible` must branch on `actor.role === "BOARD"`, resolve only a Proposal record containing the requested key, and authorize it through Proposal visibility for Board-review states. It must throw `FORBIDDEN` for every non-Proposal key without evaluating generic series scope. Keep `displayUrl` unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run: npm test --prefix backend -- file-key-visibility.test.ts

Expected: PASS; Board-review Proposal key works while draft, series, chapter, page, task, submission, and material keys remain blocked.

- [ ] **Step 5: Commit**

~~~
git add backend/src/routes/series.routes.ts backend/src/services/studio-access.service.ts backend/src/__tests__/file-key-visibility.test.ts
git commit -m "fix: restrict Board display URLs to proposals"
~~~

### Task 3: Add mobile DTOs and the expiring URL lease manager

**Files:**
- Create: mobile/src/domain/review-files.ts
- Create: mobile/src/services/mobile-file-review.ts
- Test: mobile/src/__tests__/mobile-file-review.test.tsx

**Interfaces:**

~~~
export function derivePreviewKind(mimeType: string): "image" | "pdf" | "external";
export function shouldRefreshLease(lease: FileUrlLease | null, nowMs: number): boolean;
export async function getReviewFiles(context: "proposal" | "chapter", id: string, role: MobileApiRole): Promise<ReviewFile[]>;
export async function openReviewFile(file: ReviewFile, role: MobileApiRole): Promise<FileUrlLease>;
~~~

- [ ] **Step 1: Write the failing lease tests**

~~~
test("review-file lease refreshes before a 900-second URL expires", () => {
  const lease = { url: "https://signed.example/file", expiresAtMs: 900_000 };
  assert.equal(shouldRefreshLease(lease, 869_999), false);
  assert.equal(shouldRefreshLease(lease, 870_000), true);
});
test("file URLs are acquired only when a user opens a file", () => {
  assert.match(serviceSource, /openReviewFile\(file/);
  assert.doesNotMatch(serviceSource, /Promise\.all\(.*display-url/s);
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: npm test --prefix mobile -- mobile-file-review.test.tsx

Expected: FAIL because the domain/service modules do not exist.

- [ ] **Step 3: Implement the minimum pure lease and request logic**

~~~
const DEFAULT_LEASE_MS = 8 * 60 * 1000;
const REFRESH_SKEW_MS = 30 * 1000;
export function shouldRefreshLease(lease: FileUrlLease | null, nowMs: number) {
  return !lease || nowMs >= lease.expiresAtMs - REFRESH_SKEW_MS;
}
~~~

openReviewFile posts key and name to /files/display-url, uses server expiresAt when present, otherwise Date.now() plus DEFAULT_LEASE_MS, and stores only in memory. It surfaces HTTP statuses and never uses mock fallback URLs.

- [ ] **Step 4: Run the test to verify it passes**

Run: npm test --prefix mobile -- mobile-file-review.test.tsx

Expected: PASS; 870 seconds refreshes a 900-second lease and acquisition is lazy.

- [ ] **Step 5: Commit**

~~~
git add mobile/src/domain/review-files.ts mobile/src/services/mobile-file-review.ts mobile/src/__tests__/mobile-file-review.test.tsx
git commit -m "feat: add expiring mobile review file leases"
~~~

### Task 4: Build reusable submitted-file list and full-screen viewer

**Files:**
- Create: mobile/src/components/submitted-files-panel.tsx
- Create: mobile/src/components/review-file-viewer.tsx
- Modify: mobile/package.json, mobile/src/design/icons.tsx
- Test: mobile/src/__tests__/mobile-file-review.test.tsx

**Interfaces:** consumes Task 3 types/functions and produces SubmittedFilesPanel plus ReviewFileViewer.

- [ ] **Step 1: Write failing viewer/panel contract tests**

~~~
test("submitted file UI renders metadata and an explicit empty state", () => {
  assert.match(panelSource, /No submitted files are available for this review/);
  assert.match(panelSource, /submittedBy/);
  assert.match(panelSource, /submittedAt/);
});
test("viewer refreshes one expired URL before showing Retry", () => {
  assert.match(viewerSource, /hasRetriedRef/);
  assert.match(viewerSource, /shouldRefreshLease/);
  assert.match(viewerSource, /Retry/);
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: npm test --prefix mobile -- mobile-file-review.test.tsx

Expected: FAIL because panel and viewer do not exist.

- [ ] **Step 3: Add PDF rendering and implement both components**

Run: npx expo install react-native-webview --prefix mobile

Render images with expo-image; render PDFs in a WebView only with a fresh in-memory URL; use expo-web-browser or Linking.openURL for external files. On load failure, refresh once when hasRetriedRef.current is false, then show manual Retry. On 403 clear URL and close; on 404 show unavailable; use full-screen modal styling and accessible Close/Open actions.

- [ ] **Step 4: Run the test to verify it passes**

Run: npm test --prefix mobile -- mobile-file-review.test.tsx

Expected: PASS; metadata, one automatic retry, and manual recovery are present.

- [ ] **Step 5: Commit**

~~~
git add mobile/package.json mobile/package-lock.json mobile/src/design/icons.tsx mobile/src/components/submitted-files-panel.tsx mobile/src/components/review-file-viewer.tsx mobile/src/__tests__/mobile-file-review.test.tsx
git commit -m "feat: add mobile submitted file preview"
~~~

### Task 5: Wire file review into Editor and Board details

**Files:**
- Modify: mobile/src/screens/editor-proposal-detail-screen.tsx
- Modify: mobile/src/screens/editor-chapter-detail-screen.tsx
- Modify: mobile/src/screens/board-session-detail-screen.tsx
- Modify: mobile/src/hooks/use-editor-proposal.ts
- Modify: mobile/src/hooks/use-editor-chapter.ts
- Modify: mobile/src/hooks/use-board-session.ts
- Modify: mobile/src/services/editor-mobile-data-source.ts
- Modify: mobile/src/services/board-mobile-data-source.ts
- Test: mobile/src/__tests__/mobile-file-review.test.tsx

**Interfaces:** consumes Task 3 getReviewFiles and Task 4 SubmittedFilesPanel. There is no `series-proposal-summary-panel.tsx`, `editor-panels.tsx`, `use-editor-mobile-flow.ts`, `use-board-mobile-flow.ts`, or `mobile-workflow-data-source.ts` in this codebase — those were an earlier mock-era screen layer removed because nothing imported them; the live Editor/Board detail screens and their per-detail hooks (listed above) are the only mount points. Board's review context is the session's proposal (`data.session.proposalId` from `BoardSessionDetail`), not a `selectedSeries` — the Board session detail screen has no such field.

- [ ] **Step 1: Write failing integration wiring tests**

~~~
test("Board session detail loads proposal review files but never chapter files", () => {
  assert.match(boardSessionScreenSource, /getReviewFiles\("proposal", data\.session\.proposalId, "board"\)/);
  assert.doesNotMatch(boardSessionScreenSource, /getReviewFiles\("chapter"/);
});
test("Editor proposal and chapter detail screens mount the submitted-file panel", () => {
  assert.match(editorProposalScreenSource, /SubmittedFilesPanel/);
  assert.match(editorChapterScreenSource, /SubmittedFilesPanel/);
  assert.match(editorChapterScreenSource, /getReviewFiles\("chapter",/);
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: npm test --prefix mobile -- mobile-file-review.test.tsx

Expected: FAIL because none of the three live detail screens load review-file metadata yet.

- [ ] **Step 3: Add per-detail state and mount panels**

Add `getReviewFiles` to `editor-mobile-data-source.ts` (proposal and chapter contexts) and to `board-mobile-data-source.ts` (proposal context only), without signed-URL fallback. Cancel stale requests when the selected item changes. `board-session-detail-screen.tsx` requests only `getReviewFiles("proposal", data.session.proposalId, "board")`, guarded by `data.session.proposalId` being non-null. `editor-proposal-detail-screen.tsx` requests `getReviewFiles("proposal", proposalId, "editor")`. `editor-chapter-detail-screen.tsx` requests `getReviewFiles("chapter", chapterId, "editor")`. Neither Editor detail screen requests the other screen's context.

- [ ] **Step 4: Run the test to verify it passes**

Run: npm test --prefix mobile -- mobile-file-review.test.tsx

Expected: PASS; Board is proposal-only and Editor gets both allowed contexts.

- [ ] **Step 5: Commit**

~~~
git add mobile/src/screens/editor-proposal-detail-screen.tsx mobile/src/screens/editor-chapter-detail-screen.tsx mobile/src/screens/board-session-detail-screen.tsx mobile/src/hooks/use-editor-proposal.ts mobile/src/hooks/use-editor-chapter.ts mobile/src/hooks/use-board-session.ts mobile/src/services/editor-mobile-data-source.ts mobile/src/services/board-mobile-data-source.ts mobile/src/__tests__/mobile-file-review.test.tsx
git commit -m "feat: show submitted files in mobile review flows"
~~~

### Task 6: Update maintained documentation and validate the complete feature

**Files:**
- Modify: mobile/README.md, mobile/MOBILE_AGENT_CONTEXT.md
- Modify: docs/business-flows/11-file-management.md, docs/business-flows/INDEX.md
- Test: mobile/src/__tests__/mobile-file-review.test.tsx

- [ ] **Step 1: Write the failing documentation-contract test**

~~~
test("mobile documentation records URL refresh and role boundaries", () => {
  assert.match(readmeSource, /900-second/);
  assert.match(contextSource, /Board.*proposal.*only/s);
  assert.match(fileFlowSource, /Mobile submitted-file review/);
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: npm test --prefix mobile -- mobile-file-review.test.tsx

Expected: FAIL because the maintained docs do not yet describe the feature.

- [ ] **Step 3: Update documentation**

Document lazy POST /api/files/display-url, eight-minute fallback lease, 30-second refresh skew, one automatic retry, and 403/404 outcomes. Replace non-existent docs/contracts, docs/product, and docs/stories references in MOBILE_AGENT_CONTEXT.md with maintained docs/business-flows and docs/superpowers locations.

- [ ] **Step 4: Run complete verification**

~~~
npm test --prefix backend
npm test --prefix mobile
npm run lint --prefix mobile
npm run build --prefix mobile
git diff --check
~~~

Expected: every command exits 0; backend role/key tests and mobile lifecycle tests pass.

- [ ] **Step 5: Commit**

~~~
git add mobile/README.md mobile/MOBILE_AGENT_CONTEXT.md docs/business-flows/11-file-management.md docs/business-flows/INDEX.md mobile/src/__tests__/mobile-file-review.test.tsx
git commit -m "docs: document mobile file review lifecycle"
~~~

## Plan self-review

- Coverage: Tasks 1-2 implement backend metadata and Board visibility; Tasks 3-5 implement lazy URLs, 900-second renewal, retry, viewer UX, and Editor/Board integration; Task 6 keeps documentation current and verifies the feature.
- Scope: no upload, persistent download/cache, annotations, or workflow mutation is added.
- Consistency: all tasks use ReviewFile, FileUrlLease, getReviewFiles, openReviewFile, 30-second refresh skew, and a one-retry policy.
- No unresolved decisions or implementation placeholders remain.

