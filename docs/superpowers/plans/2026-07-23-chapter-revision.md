# Chapter Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Chapter revision loop resubmittable, accurately count revision rounds, and use `StudioComment` as the single feedback-state source.

**Architecture:** Keep the existing initial-submit endpoint unchanged. The workspace uses the existing chapter action endpoint with `RESUBMIT` only in `REVISION_REQUIRED`. The backend owns the revision count and `StudioComment` remains the sole readiness source, so no note/comment synchronization is introduced.

**Tech Stack:** React 19, TanStack Query, Express, Mongoose, Vitest, Supertest.

## Global Constraints

- Reuse the existing `POST /chapters/:chapterId/actions/RESUBMIT` action; do not add an endpoint or dependency.
- `SUBMIT_REVIEW` remains initial submission only; a successful `RESUBMIT` returns the chapter to `TANTOU_REVIEW`.
- Increment `revisionRound` exactly once after an accepted `RESUBMIT`; failed resubmits do not alter it.
- `StudioComment` status (`OPEN`, `ADDRESSED`, `RESOLVED`) is the only blocking-feedback state used for the chapter workspace.
- Keep historic `chapter.reviewNotes` stored for compatibility, but do not synchronize or use them for readiness.
- Do not modify proposal revision behavior or backfill historic data.

---

## File structure

- `backend/src/services/workflow.service.ts` — persist the revision count in the existing accepted-resubmit workflow.
- `backend/src/__tests__/workflow.test.ts` — prove a real revision can be addressed and resubmitted, including count behavior.
- `src/features/series/detail/components/chapter-detail-workspace.tsx` — select the correct action and derive visible blocking feedback from comments.

### Task 1: Persist and verify Chapter resubmission

**Files:**
- Modify: `backend/src/services/workflow.service.ts`
- Modify: `backend/src/__tests__/workflow.test.ts`

**Interfaces:**
- Consumes: `sendChapterToEditorReview(req, chapterId, action)` and `applyChapterAction(...)`.
- Produces: an accepted `RESUBMIT` with `status === "TANTOU_REVIEW"` and `revisionRound === previous + 1`.

- [ ] **Step 1: Write the failing integration test**

Add a test beside the existing Chapter review fixture that performs this exact sequence:

```ts
await request(createApp())
  .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
  .set("Authorization", `Bearer ${mangaka.accessToken}`)
  .expect(200);

await request(createApp())
  .post(`/api/chapters/${fixture.chapterId}/actions/REQUEST_REVISION`)
  .set("Authorization", `Bearer ${editor.accessToken}`)
  .send({ targetType: "PAGE", targetId: fixture.pageId, feedback: "Fix panel spacing." })
  .expect(200);
```

Query the created blocking `StudioComment`, address it through `POST /api/comments/:commentId/address` as the Mangaka, then post `RESUBMIT`. Assert `TANTOU_REVIEW`, `revisionRound === 1`, and a new resubmission snapshot. Before addressing the comment, assert `RESUBMIT` returns `409 BLOCKING_COMMENTS_UNRESOLVED` and the persisted round remains `0`.

- [ ] **Step 2: Run the focused test and confirm the count assertion fails**

Run: `npm test -- --reporter=dot src/__tests__/workflow.test.ts`

Expected: the new resubmit assertion fails because the current server leaves `revisionRound` at `0`.

- [ ] **Step 3: Apply the smallest backend change**

In the existing chapter update within `sendChapterToEditorReview`, add the count only to the accepted resubmit update:

```ts
...(action === "RESUBMIT"
  ? { revisionRound: Number(chapter.revisionRound ?? 0) + 1 }
  : {}),
```

Place it in the single persisted chapter update that also writes the fresh `reviewSnapshot` and `TANTOU_REVIEW` state. Do not change `REQUEST_REVISION`, `StudioComment`, or failure paths.

- [ ] **Step 4: Run the focused test and backend type check**

Run: `npm test -- --reporter=dot src/__tests__/workflow.test.ts && npm run lint`

Expected: focused workflow tests pass and TypeScript exits with code `0`.

- [ ] **Step 5: Commit Task 1**

```bash
git add backend/src/services/workflow.service.ts backend/src/__tests__/workflow.test.ts
git commit -m "fix: complete chapter revision resubmission"
```

### Task 2: Make the Chapter workspace use the canonical revision flow

**Files:**
- Modify: `src/features/series/detail/components/chapter-detail-workspace.tsx`

**Interfaces:**
- Consumes: `useChapterActionMutation`, `useSendChapterToEditorReviewMutation`, `useCommentsQuery`, and `checkChapterAction`.
- Produces: a primary action that calls `RESUBMIT` in `REVISION_REQUIRED`, and visible unresolved feedback derived from blocking `StudioComment`s.

- [ ] **Step 1: Replace the local review-note state with the comment query**

Import `useCommentsQuery`, load `{ chapterId: chapter.id }`, then derive the workspace’s unresolved list from the same condition the backend uses:

```ts
const { data: comments = [] } = useCommentsQuery({ chapterId: chapter.id });
const unresolvedNotes = comments.filter(
  (comment) =>
    (comment.isBlocking || comment.blocking) &&
    !["ADDRESSED", "RESOLVED"].includes(comment.status),
);
```

Use `unresolvedNotes` for readiness messaging and the visible feedback list. Render `comment.text ?? comment.body` where the former note UI renders text. Leave `chapter.reviewNotes` untouched but do not use it for readiness.

- [ ] **Step 2: Select the action by chapter status**

Keep the direct `send-editor-review` mutation for initial submissions. For a revision, reuse the existing action mutation:

```ts
const isResubmission = chapter.status === "REVISION_REQUIRED";
const reviewAction = isResubmission ? "RESUBMIT" : "SUBMIT_REVIEW";
const submitCheck = checkChapterAction(reviewAction, user, chapter, series);

if (isResubmission) {
  await chapterActionMutation.mutateAsync({ action: "RESUBMIT" });
} else {
  await sendEditorReviewMutation.mutateAsync();
}
```

Make the label/title/toast say **Resubmit to Editor** in the revision case. Remove the menu filter only if the now-primary action would otherwise appear twice; it must not expose two competing controls.

- [ ] **Step 3: Run frontend checks**

Run: `npm run lint && npm run build`

Expected: both commands exit with code `0`. No frontend test framework is installed; do not add one for this small conditional. The backend integration test from Task 1 verifies the action contract.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/features/series/detail/components/chapter-detail-workspace.tsx
git commit -m "fix: expose chapter resubmission workflow"
```

## Final verification

- [ ] Run `npm test -- --reporter=dot src/__tests__/workflow.test.ts && npm run lint` in `backend`.
- [ ] Run `npm run lint && npm run build` in the repository root.
- [ ] Manually verify one initial submission still says **Send to Editor Review**, while `REVISION_REQUIRED` says **Resubmit to Editor** and cannot submit while an `OPEN` blocking comment exists.

