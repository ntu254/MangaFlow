# Mobile Scheduler and Native Clipboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace horizontal schedule button grids with true scroll-to-select wheels and provide native support-diagnostic copy on iOS/Android.

**Architecture:** A reusable local wheel component in publication confirmation derives selection from a snapped vertical `ScrollView` offset while preserving existing schedule state. The clipboard adapter selects Expo Clipboard for native runtime and browser Clipboard for web; the workflow-state surface continues to consume its stable boolean/result interface.

**Tech Stack:** React Native / Expo, `expo-clipboard`, Jest Expo, TypeScript.

## Global Constraints

- Keep the existing calendar, local-future-minute validation, ISO request payload, and English UI copy.
- Hour wheel contains exactly 00–23; minute wheel exactly 00–59.
- Wheel viewport uses three 44px rows, vertical paging/snap, a centered selection, and scroll-to-select behavior.
- Native support details always offers a Copy action via `expo-clipboard`; web retains `navigator.clipboard` fallback.
- Do not touch `frontend/src/routeTree.gen.ts` or unrelated plan files.

---

### Task 1: Implement wheels, native copy, and accurate guide copy

**Files:**
- Modify: `mobile/src/components/publication-confirmation.tsx`
- Modify: `mobile/src/__tests__/publication-confirmation.test.tsx`
- Modify: `mobile/src/services/mobile-clipboard.ts`
- Modify: `mobile/src/__tests__/mobile-clipboard.test.ts`
- Modify: `mobile/package.json`
- Modify: `mobile/package-lock.json`
- Modify: `mobile/MOBILE_AGENT_CONTEXT.md`

**Interfaces:**
- Produces: `copyToClipboard(text): Promise<boolean>` that works through native Expo clipboard and browser clipboard.
- Produces: hour/minute wheel controls whose settled scroll event maps `contentOffset.y / 44` to the selected value.

- [ ] **Step 1: Write failing tests**

Add publication tests that assert the hour/minute picker has `snapToInterval={44}`, `decelerationRate="fast"`, an accessibility-selected center value, and that a momentum scroll ending at `44 * 14` selects hour 14 (minute analogously). Update clipboard tests to mock `expo-clipboard`, prove native copy is offered without `navigator`, and prove write failure returns false.

- [ ] **Step 2: Run focused tests and verify RED**

Run `npm test --prefix mobile -- publication-confirmation mobile-clipboard --runInBand`; expect wheel/native-copy assertions to fail.

- [ ] **Step 3: Implement minimum changes**

Install the Expo-compatible clipboard package with `npx expo install expo-clipboard`. Implement a three-row, 44px vertical wheel using a vertical `ScrollView`, `snapToInterval={44}`, `snapToAlignment="center"`, `decelerationRate="fast"`, padding rows before/after values, and `onMomentumScrollEnd` rounded/clamped to set state. Use Expo Clipboard's async setter when native; use browser clipboard only on web. Keep clipboard error handling boolean and non-throwing. Update guide wording from Today/dashboard summary to Priority and `/editor/activity`.

- [ ] **Step 4: Verify**

Run focused tests, then `npm run check:utf8 --prefix mobile`, `npm run lint --prefix mobile`, `npm test --prefix mobile`, `npm run build --prefix mobile`, and `git diff --check`.

- [ ] **Step 5: Commit**

Stage only the task files and commit `fix: complete mobile scheduler and clipboard support`.

## Plan self-review

- Spec coverage: one task covers both final Important findings and the stale documentation minor.
- Placeholder scan: values, events, package, and checks are explicit.
- Type consistency: clipboard callers retain the existing asynchronous boolean interface.
