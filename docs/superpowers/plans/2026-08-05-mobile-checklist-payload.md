# Mobile Checklist Payload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent repeat checklist saves from submitting read-only server metadata.

**Architecture:** Construct a six-key request DTO at the mobile data-source boundary; keep backend metadata and validation unchanged.

**Tech Stack:** TypeScript, React Native Testing Library, Jest.

## Global Constraints

- Only `hook`, `characterMotivation`, `audienceFit`, `storyboardFlow`, `manuscriptQuality`, and `serializePotential` may be sent in `editorialChecklist`.
- Do not change backend validation, authorization, or checklist metadata persistence.

### Task 1: Serialize editable checklist values

**Files:**
- Modify: `mobile/src/services/editor-mobile-data-source.ts`
- Test: `mobile/src/__tests__/editor-proposal-flow.test.tsx`

- [ ] **Step 1: Add a failing repeat-save test**

Mock a fetched checklist containing `completedById`, save an incomplete draft, then save a changed draft. Assert every `UPDATE_EDITORIAL_CHECKLIST` body equals `{ editorialChecklist: { hook, characterMotivation, audienceFit, storyboardFlow, manuscriptQuality, serializePotential } }` and does not contain `completedById`.

- [ ] **Step 2: Run the RED test**

Run: `npm test --prefix mobile -- --runInBand src/__tests__/editor-proposal-flow.test.tsx`

Expected: FAIL because metadata is echoed.

- [ ] **Step 3: Add a request DTO mapper**

Implement `toEditorialChecklistPayload(checklist)` in `editor-mobile-data-source.ts`, returning only the six named booleans, and pass its result to `proposalAction`.

- [ ] **Step 4: Run GREEN verification**

Run: `npm test --prefix mobile -- --runInBand src/__tests__/editor-proposal-flow.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

`git add mobile/src/services/editor-mobile-data-source.ts mobile/src/__tests__/editor-proposal-flow.test.tsx && git commit -m "fix(mobile): serialize editable checklist fields"`
