# Expo Go File Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preview signed images and PDFs inside Android Expo Go emulator.

**Architecture:** Native image preview remains unchanged; Android PDFs use bundled PDF.js HTML in WebView, with signed URLs held in memory only.

**Tech Stack:** Expo Go, react-native-webview, PDF.js, Jest.

## Global Constraints

- Preserve 30-second lease renewal and one reload after preview failure.
- Map emulator backend URLs from `localhost` to `10.0.2.2`.
- Do not persist or log signed URLs; unsupported types remain external.

### Task 1: Add in-app Android PDF preview

**Files:**
- Modify: `mobile/src/domain/review-files.ts`, `mobile/src/components/review-file-viewer.tsx`
- Create: `mobile/src/components/pdf-preview-html.ts`
- Test: `mobile/src/__tests__/mobile-file-review.test.tsx`

- [ ] **Step 1: Add failing Android-PDF and retry tests**

Assert `derivePreviewKind("application/pdf", "android")` is `pdf`, and a preview error exposes `Retry file preview` without logging or persisting the URL.

- [ ] **Step 2: Run RED tests**

Run: `npm test --prefix mobile -- --runInBand src/__tests__/mobile-file-review.test.tsx`

Expected: FAIL because Android returns `external`.

- [ ] **Step 3: Implement bundled viewer**

Create `pdfPreviewHtml(url: string): string` that embeds PDF.js viewer markup and fetches the supplied URL. Render it through `WebView` for `previewKind === "pdf"`; retain `onError`, `onHttpError`, lease refresh, and current iOS behavior.

- [ ] **Step 4: Run GREEN tests**

Run: `npm test --prefix mobile -- --runInBand src/__tests__/mobile-file-review.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

`git add mobile/src/domain/review-files.ts mobile/src/components/review-file-viewer.tsx mobile/src/components/pdf-preview-html.ts mobile/src/__tests__/mobile-file-review.test.tsx && git commit -m "fix(mobile): preview PDFs in Expo Go"`
