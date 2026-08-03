# Mobile Editor Activity Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Editor activity endpoint accurately represent only actions performed while the authenticated actor was an Editor and resolve every supported comment target to its real chapter context.

**Architecture:** The backend activity projection adds immutable-role filtering at the audit query boundary and reuses the inbox-style target-to-chapter resolution pattern inside the activity service. Tests exercise HTTP endpoint output with role-change and all indirect target fixtures; the mobile contract remains unchanged because it already consumes resolved activity rows.

**Tech Stack:** Express, Mongoose, Vitest, TypeScript, existing MongoMemoryReplSet test stack.

## Global Constraints

- Preserve the `GET /api/editor/activity` authenticated Editor endpoint and its response schema.
- Filter audit rows by both `actorId` and immutable `actorRole: "EDITOR"`.
- Do not present actions performed in another role as editorial activity.
- Resolve PAGE, REGION, TASK, and SUBMISSION comments to actual Chapter/Series context when their targets still exist.
- Do not touch `frontend/src/routeTree.gen.ts` or previously untracked plan files.

---

### Task 1: Harden audited Editor activity filtering and comment context

**Files:**
- Modify: `backend/src/services/mobile-editor-activity.service.ts`
- Modify: `backend/src/__tests__/mobile-editor-workflows.test.ts`

**Interfaces:**
- Consumes: `AuditEntry.actorId`, immutable `AuditEntry.actorRole`, and `StudioComment` target fields.
- Produces: existing `EditorActivityRecord[]` with truthful actor-role membership and resolved `seriesTitle`/`chapterNumber` for comment activity.

- [ ] **Step 1: Write failing endpoint tests**

Extend `mobile-editor-workflows.test.ts` with an audit record for the logged-in Editor actor but `actorRole: "MANGAKA"`; assert `/api/editor/activity` excludes it. Create comments with no direct `chapterId` for PAGE, REGION, TASK, and SUBMISSION targets tied to a seeded chapter. Add Editor audit rows for each comment and assert every returned row has the seeded series title and chapter number.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test --prefix backend -- --run src/__tests__/mobile-editor-workflows.test.ts --pool=threads --maxWorkers=1`

Expected: failure because the current query does not filter `actorRole`, and indirect comment targets fall back to `Chapter`.

- [ ] **Step 3: Implement the minimal projection changes**

Add an audit query filter that includes `actorId: actor.id`, `actorRole: "EDITOR"`, and the existing editorial-action regular expression. Make comment-to-chapter lookup asynchronous. Resolve direct chapter IDs first, then use `StudioTaskModel`, `StudioRegionModel`, `SubmissionModel`, or an owning `ChapterModel` page lookup according to target type/IDs. Retain a safe fallback if no target resolves.

- [ ] **Step 4: Run verification**

Run the focused endpoint test, then `npm run lint --prefix backend` and `npm run build --prefix backend`. All commands must exit `0`.

- [ ] **Step 5: Commit**

Stage only the service and its integration test, then commit with `fix: preserve editor activity audit integrity`.

## Plan self-review

- Spec coverage: Task 1 explicitly covers immutable role filtering plus every missing comment target.
- Placeholder scan: no deferred implementation or unspecified test remains.
- Type consistency: response interfaces remain unchanged, so existing mobile consumers stay compatible.
