# Pre-push Notification and Projection Integrity Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make notifications fully reachable and badge-accurate beyond one page, preserve valid untitled publication labels, and prevent redundant audit rows from consuming the Editor activity cap.

**Architecture:** The notification list response becomes a mobile-specific paginated envelope containing validated items, `pagination`, and server-derived `unreadTotal`. The mobile hook uses React Query infinite pages, derives list rows from all loaded pages, and provides explicit Load more behavior. Backend projection fixes use existing fallbacks and exclude redundant actions at query time before the limit.

**Tech Stack:** Express/Mongoose, React Native/Expo, TanStack React Query, Zod, Vitest/Jest.

## Global Constraints

- Notification feed remains authenticated and never exposes `actionUrl` to mobile.
- The unread badge uses an authoritative server count, not just loaded rows.
- The user can explicitly reach pages after the default 50 notification rows.
- Existing notification read mutation must refresh all loaded notification state and badge.
- Publication `chapterContext.chapterTitle` must never be literal `"undefined"`; use `Chapter N` fallback.
- Editor activity returns up to 50 classified non-redundant rows, scoped to immutable Editor audits.
- Do not touch `frontend/src/routeTree.gen.ts`.

---

### Task 1: Correct notification pagination, publication context, and activity cap

**Files:**
- Modify: `backend/src/controllers/notification.controller.ts`
- Modify/Create: backend tests for notification pagination, publication inbox, and editor activity cap
- Modify: `backend/src/services/mobile-inbox.service.ts`
- Modify: `backend/src/services/mobile-editor-activity.service.ts`
- Modify: `mobile/src/domain/mobile-notification.ts`
- Modify: `mobile/src/services/mobile-notification-data-source.ts`
- Modify: `mobile/src/hooks/use-mobile-notifications.ts`
- Modify: `mobile/src/screens/notifications-screen.tsx`
- Modify: `mobile/src/__tests__/notifications.test.tsx`

**Interfaces:**
- `GET /notifications?page=<n>&limit=<n>` returns `{ data, pagination, unreadTotal }` in its existing success envelope.
- `getMobileNotifications(page)` returns a validated page with `items`, `page`, `totalPages`, and `unreadTotal`.

- [ ] **Step 1: Write failing tests**

Add backend coverage with 51+ notifications mixed read/unread; assert page 1 carries `unreadTotal` for all rows and page 2 remains reachable. Add mobile tests that load two pages, render rows from both, show server unread total, and refresh after marking read. Add an untitled publication inbox test asserting `chapterContext.chapterTitle === "Chapter <number>"`. Add a >50 mixed-audit activity test asserting redundant chapter audits do not crowd out 50 classified records.

- [ ] **Step 2: Verify RED**

Run targeted backend and mobile notification tests. Expected: current data source discards envelope metadata, screen has no second-page affordance, chapter context becomes `undefined`, and activity applies limit before redundancy filtering.

- [ ] **Step 3: Implement minimum changes**

Implement notification controller pagination directly with owned-user filter, sorted page query, total count, unread count, and the existing success envelope. Validate the envelope in mobile Zod, migrate hook to `useInfiniteQuery`, flatten pages for the screen, use first-page `unreadTotal`, and expose `fetchNextPage`/`hasNextPage`. Render an explicit accessible `Load more notifications` button. Update read success to invalidate all notification pages. Use the existing `Chapter ${chapter.number}` fallback in both work title and chapter context. Exclude `REDUNDANT_CHAPTER_AUDITS` in the Mongo action filter before sort/limit.

- [ ] **Step 4: Verify**

Run targeted backend/mobile tests, then mobile UTF-8/lint/full test/build, backend lint/build, and `git diff --check`.

- [ ] **Step 5: Commit**

Stage only task files and commit `fix: complete mobile notification pagination`.

## Plan self-review

- Spec coverage: all three pre-push review findings have executable behavior and regression evidence.
- Placeholder scan: response shape, paging behavior, fallback, and query-order requirements are explicit.
- Type consistency: mobile caller consumes validated page envelope and keeps safe notification item shape.
