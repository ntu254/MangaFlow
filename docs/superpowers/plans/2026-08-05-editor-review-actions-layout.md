# Editor Review Actions Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure Editor review actions do not obscure submitted review content.

**Architecture:** Keep action semantics unchanged but render the action bar as ordinary content after review material inside the detail scroll surface.

**Tech Stack:** React Native, Jest, React Native Testing Library.

## Global Constraints

- Do not change action availability, disabled reasons, confirmation, or backend calls.
- Submitted files and checklist remain readable before action controls.

### Task 1: Remove sticky Editor proposal action placement

**Files:**
- Modify: `mobile/src/screens/editor-proposal-detail-screen.tsx`, `mobile/src/components/workflow-detail-layout.tsx`
- Test: `mobile/src/__tests__/editor-proposal-flow.test.tsx`

- [ ] **Step 1: Add failing content-order test**

Render a claimed proposal with files and actions; assert the submitted-files/checklist content is rendered before `Forward to Board` in the detail scroll content.

- [ ] **Step 2: Run RED test**

Run: `npm test --prefix mobile -- --runInBand src/__tests__/editor-proposal-flow.test.tsx`

Expected: FAIL because the layout receives actions in a persistent action region.

- [ ] **Step 3: Render actions after content**

Change `WorkflowDetailLayout` usage/interface so `WorkflowActionBar` is appended after the proposal content in its ScrollView. Keep every descriptor and handler unchanged.

- [ ] **Step 4: Run GREEN test**

Run: `npm test --prefix mobile -- --runInBand src/__tests__/editor-proposal-flow.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

`git add mobile/src/screens/editor-proposal-detail-screen.tsx mobile/src/components/workflow-detail-layout.tsx mobile/src/__tests__/editor-proposal-flow.test.tsx && git commit -m "fix(mobile): keep editor actions below review content"`
