# Mobile Publication Scheduling and Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace typed publication scheduling with calendar/wheel selection and make publication cards/actions compact and explicit.

**Architecture:** Extract date-time conversion/validation into a pure helper used by `PublicationConfirmation`; retain the current ISO API contract. Rework only the publication confirmation and work-card presentation primitives.

**Tech Stack:** Expo 56, React Native, TypeScript, Jest Expo.

## Global Constraints

- Schedule accepts any local future minute and sends ISO `scheduledAt`.
- Publish now confirms public visibility; Postpone stays tertiary.
- Buttons are 44px high with one-line 14–15px labels.
- Cards state object types explicitly, including `Chapter <number>`.

---

### Task 1: Schedule date-time selection

**Files:**
- Modify: `mobile/src/components/publication-confirmation.tsx`
- Create: `mobile/src/domain/publication-schedule.ts`
- Test: `mobile/src/__tests__/publication-confirmation.test.tsx`

**Interfaces:** Produces `toScheduledAt(date: Date, hour: number, minute: number, now: Date): string | null`.

- [ ] **Step 1: Write failing pure-helper and screen tests**

```ts
expect(toScheduledAt(new Date(2026, 7, 12), 14, 35, new Date(2026, 7, 12, 14, 34))).toBe("2026-08-12T07:35:00.000Z")
expect(toScheduledAt(new Date(2026, 7, 12), 14, 34, new Date(2026, 7, 12, 14, 34))).toBeNull()
```

Assert month calendar, hour/minute picker controls, selected timestamp and disabled Schedule confirm for a past minute.

- [ ] **Step 2: Verify red**

Run: `npm test --prefix mobile -- publication-confirmation --runInBand`

- [ ] **Step 3: Implement minimal helper and sheet**

Use local `Date(year, month, day, hour, minute)` then require `getTime() > now.getTime()` before `.toISOString()`. Render a month day grid and bounded hour/minute pickers; remove the text input. Keep existing error surface and API payload.

- [ ] **Step 4: Verify and commit**

Run: `npm test --prefix mobile -- publication-confirmation --runInBand`

Commit: `git commit -m "feat: add publication schedule picker"`

### Task 2: Publication card copy and compact actions

**Files:**
- Modify: `mobile/src/components/work-item-card.tsx`
- Modify: `mobile/src/components/publication-confirmation.tsx`
- Test: `mobile/src/__tests__/today-screens.test.tsx`
- Test: `mobile/src/__tests__/publication-confirmation.test.tsx`

**Interfaces:** `WorkItemCard` continues consuming `MobileWorkItem`; publication title/copy derives from `kind`, `title`, and `entityType`.

- [ ] **Step 1: Write failing UI tests**

Assert a publication card exposes `Publication · Chapter 12`, an explicit title/context, and Schedule / Publish now / Postpone actions have 44px accessible controls with one-line labels.

- [ ] **Step 2: Verify red**

Run: `npm test --prefix mobile -- today-screens publication-confirmation --runInBand`

- [ ] **Step 3: Implement visual/copy changes**

Add the work-type eyebrow and normalized object names; add a distinct Publish now confirmation stating immediate public visibility; keep Postpone visually tertiary. Use 44px action styles and 14–15px semibold labels.

- [ ] **Step 4: Verify and commit**

Run: `npm test --prefix mobile -- today-screens publication-confirmation --runInBand`

Commit: `git commit -m "feat: clarify publication cards and actions"`

### Task 3: Acceptance verification

- [ ] Run `npm test --prefix mobile -- --runInBand`, `npm run lint --prefix mobile`, `npm run build --prefix mobile`, and `git diff --check`.
- [ ] Verify Schedule, Publish now, and Postpone call their existing mobile APIs with the expected payloads.

## Self-review

- Task 1 covers arbitrary future minute selection and ISO conversion.
- Task 2 covers card clarity and three publication actions.
- Task 3 covers the full mobile quality gate.
