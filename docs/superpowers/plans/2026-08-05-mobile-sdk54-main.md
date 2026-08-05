# Mobile SDK 54 Migration on Main Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the `main` mobile app in Expo Go SDK 54 on current iOS and Android devices without changing business behaviour or network configuration.

**Architecture:** Move the Expo project as a unit onto Expo SDK 54's resolved dependency matrix rather than manually retaining SDK 56 native module versions. Remove unused SDK 56 dependencies and replace the splash animation's direct Worklets scheduling with Reanimated's compatible bridge API, retaining Worklets only as Reanimated's resolved native peer; configuration remains a thin Expo Router application configuration.

**Tech Stack:** Expo SDK 54, React 19.1, React Native 0.81, Expo Router, React Native Reanimated, Jest Expo, TypeScript, npm.

## Global Constraints

- Modify only `main`'s `mobile/` project and this migration documentation; do not merge `fix/mobile-flow-remediation`.
- Do not change backend source, API endpoints, `.env` files, ngrok settings, authentication, upload, or preview business rules.
- Resolve native dependency versions using Expo SDK 54 tooling, not arbitrary version pinning.
- Target Expo Go on current iOS and Android devices; an APK or development build is out of scope.
- Preserve the existing UI and flows; splash animation may use a compatibility-safe completion callback.

---

## File structure

- `mobile/package.json` — SDK 54 package manifest and scripts.
- `mobile/package-lock.json` — npm's fully resolved SDK 54 graph.
- `mobile/app.json` — Expo configuration with the unsupported React Compiler experiment removed.
- `mobile/src/components/animated-icon.tsx` — splash completion callback without direct Worklets dependency.
- `mobile/src/__tests__/testing-stack.test.tsx` — smoke coverage proving Jest Expo can render the SDK 54 splash component.

### Task 1: Resolve the SDK 54 dependency graph

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/package-lock.json`

**Interfaces:**
- Consumes: Expo's SDK 54 package compatibility matrix.
- Produces: a reproducible npm install graph with Expo, React, React Native, Router, Reanimated, WebView, and Jest Expo compatible with SDK 54.

- [ ] **Step 1: Record the baseline dependency diagnostics**

Run from `mobile`:

```powershell
npx expo-doctor
```

Expected: the command identifies that the installed project belongs to SDK 56 before migration (or prints the current dependency baseline).

- [ ] **Step 2: Change Expo's SDK anchor to version 54**

Run from `mobile`:

```powershell
npx expo install expo@^54.0.0
```

Expected: `package.json` changes its `expo` dependency to an SDK 54 range and npm updates the lockfile.

- [ ] **Step 3: Resolve all Expo-managed packages against SDK 54**

Run from `mobile`:

```powershell
npx expo install --fix
```

Expected: Expo rewrites managed package versions, including React 19.1, React Native 0.81, Expo Router, Reanimated, WebView, and `jest-expo`, to versions compatible with SDK 54.

- [ ] **Step 4: Remove unused SDK 56-only dependencies and restore Reanimated's peer**

Run from `mobile`:

```powershell
npm uninstall @expo/ui expo-glass-effect
npx expo install react-native-worklets
```

Expected: `@expo/ui` and `expo-glass-effect` disappear from `dependencies` and `package-lock.json`. `react-native-worklets` remains only at the SDK 54 version selected by Expo because it is a native peer of Reanimated; app source must not import it directly.

- [ ] **Step 5: Verify the resolved manifest is internally consistent**

Run from `mobile`:

```powershell
npm ci
npx expo-doctor
```

Expected: clean install succeeds and Expo Doctor reports no incompatible dependency versions. If `expo-symbols` is reported incompatible, run `npx expo install expo-symbols`, then repeat this step.

- [ ] **Step 6: Commit the resolved dependency migration**

```powershell
git add mobile/package.json mobile/package-lock.json
git commit -m "chore(mobile): downgrade Expo to sdk 54"
```

### Task 2: Remove SDK 56-only runtime assumptions

**Files:**
- Modify: `mobile/app.json:39-42`
- Modify: `mobile/src/components/animated-icon.tsx:1-43`
- Modify: `mobile/src/__tests__/testing-stack.test.tsx`

**Interfaces:**
- Consumes: `AnimatedSplashOverlay(): JSX.Element` from `animated-icon.tsx`.
- Produces: a splash overlay that invokes `setVisible(false)` through Reanimated's `runOnJS` callback after a completed entering animation, without importing `react-native-worklets` directly.

- [ ] **Step 1: Write failing SDK 54 compatibility tests**

Append these imports and tests to `mobile/src/__tests__/testing-stack.test.tsx`:

```tsx
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appConfig = require("../../app.json") as {
  expo: { experiments?: { reactCompiler?: boolean; typedRoutes?: boolean } };
};

it("does not directly import the Worklets runtime in the splash overlay", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/animated-icon.tsx"), "utf8");
  expect(source).not.toContain("react-native-worklets");
});

it("keeps typed routes without enabling the React Compiler experiment", () => {
  expect(appConfig.expo.experiments?.typedRoutes).toBe(true);
  expect(appConfig.expo.experiments?.reactCompiler).toBeUndefined();
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run from `mobile`:

```powershell
npm test -- testing-stack.test.tsx
```

Expected: FAIL specifically because `animated-icon.tsx` contains `react-native-worklets` and `app.json` enables `reactCompiler`.

- [ ] **Step 3: Implement the SDK 54-safe splash callback**

In `mobile/src/components/animated-icon.tsx`, replace the Worklets import and callback exactly as follows:

```tsx
import Animated, { Easing, Keyframe, runOnJS } from "react-native-reanimated";

// Inside withCallback:
if (finished) {
  runOnJS(setVisible)(false);
}
```

Remove this import entirely:

```tsx
import { scheduleOnRN } from "react-native-worklets";
```

In `mobile/app.json`, remove the `"reactCompiler": true` entry. Keep `typedRoutes` unchanged.

- [ ] **Step 4: Run the focused test and TypeScript check**

Run from `mobile`:

```powershell
npm test -- testing-stack.test.tsx
npm run lint
```

Expected: both commands pass; the component has no direct Worklets import and the Expo config no longer enables React Compiler.

- [ ] **Step 5: Commit runtime compatibility changes**

```powershell
git add mobile/app.json mobile/src/components/animated-icon.tsx mobile/src/__tests__/testing-stack.test.tsx
git commit -m "fix(mobile): align splash runtime with sdk 54"
```

### Task 3: Validate supported Expo Go deliverables

**Files:**
- Verify only: `mobile/package.json`, `mobile/package-lock.json`, `mobile/app.json`, `mobile/src/components/animated-icon.tsx`

**Interfaces:**
- Consumes: SDK 54 dependency graph and splash callback from Tasks 1–2.
- Produces: evidence that the mobile app is statically valid and starts as an Expo Go SDK 54 project.

- [ ] **Step 1: Run all repository mobile checks**

Run from `mobile`:

```powershell
npm run check:utf8
npm run lint
npm test
npm run build
npx expo-doctor
```

Expected: every command exits with code 0 and Expo Doctor reports no package compatibility problem.

- [ ] **Step 2: Start a clean Expo Go development server**

Run from `mobile`:

```powershell
npx expo start --clear
```

Expected: Metro prints a QR code and identifies the project as Expo SDK 54. Stop the server with `Ctrl+C` only after it has initialized successfully.

- [ ] **Step 3: Perform physical-device acceptance checks**

Using the fresh QR code, open the project in the latest Expo Go on one Android device and one iOS device. On each platform: sign in, navigate through the primary tabs, open a file-review screen, and close/reopen the app.

Expected: both devices load the app with no SDK-version rejection and the normal mobile navigation remains usable.

- [ ] **Step 4: Commit validation documentation only if needed**

If a command needs a documented compatibility workaround, add it to `docs/superpowers/specs/2026-08-05-mobile-sdk54-main.md`, then run:

```powershell
git add docs/superpowers/specs/2026-08-05-mobile-sdk54-main.md
git commit -m "docs(mobile): record sdk 54 validation"
```

Otherwise, do not create an empty validation commit.

### Task 4: Restore the SDK 54 Jest asset runtime

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/package-lock.json`

**Interfaces:**
- Consumes: the existing Jest suite, which currently fails to resolve
  `expo-asset` from `expo-font` when icon components load.
- Produces: an SDK 54 Expo-managed `expo-asset` dependency that permits the
  full Jest suite to initialize.

- [ ] **Step 1: Confirm the failing test-runtime dependency**

Run from `mobile`:

```powershell
npm test
npm ls expo-asset --depth=0
```

Expected: the test run reports `Cannot find module 'expo-asset'` from
`expo-font`, and npm reports no root-level `expo-asset` installation.

- [ ] **Step 2: Add the Expo-resolved asset module**

Run from `mobile`:

```powershell
npx expo install expo-asset
```

Expected: Expo selects the SDK 54-compatible `expo-asset` version and updates
both the manifest and lockfile without altering application source.

- [ ] **Step 3: Verify the Jest initialization regression is fixed**

Run from `mobile`:

```powershell
npm ci
npm test
npx expo-doctor
```

Expected: `npm ci` succeeds; Jest no longer reports module resolution for
`expo-asset`; Expo Doctor remains clean. Report any unrelated test failures
with their exact source and exit status.

- [ ] **Step 4: Commit the dependency repair**

```powershell
git add mobile/package.json mobile/package-lock.json
git commit -m "fix(mobile): restore sdk 54 asset runtime"
```

### Task 5: Adapt SDK 56 source APIs to SDK 54 declarations

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/package-lock.json`
- Modify: `mobile/src/__tests__/editor-proposal-flow.test.tsx`
- Modify: `mobile/src/app/_layout.tsx`
- Modify: `mobile/src/components/animated-icon.tsx`
- Modify: `mobile/src/components/app-tabs.tsx`
- Modify: `mobile/src/components/app-tabs.web.tsx`
- Modify: `mobile/src/components/mf.tsx`
- Modify: `mobile/src/components/ui/collapsible.tsx`
- Modify: `mobile/src/hooks/use-theme.ts`
- Modify: `mobile/src/MangaFlowMobileApp.tsx`

**Interfaces:**
- Consumes: Expo Router 6, React Native 0.81, Expo Symbols 1, and React Test
  Renderer 19.1 declarations selected by SDK 54.
- Produces: the existing mobile routes, labels, icons, light-theme fallback,
  overlays, and test helpers with no TypeScript diagnostics under SDK 54.

- [ ] **Step 1: Record the failing type baseline**

Run from `mobile`:

```powershell
npm run lint
```

Expected: 25 diagnostics grouped as Router themes/native tabs, color schemes,
Expo Symbols, `absoluteFill` object spreads, and React Test Renderer callback
inference.

- [ ] **Step 2: Restore the direct development type dependency**

Run from `mobile`:

```powershell
npm install --save-dev @types/react-test-renderer@^19.0.0
```

Expected: `mobile/package.json` declares the React Test Renderer type package
and the two callbacks in `editor-proposal-flow.test.tsx` regain contextual
types without adding `any` annotations.

- [ ] **Step 3: Replace only incompatible source patterns**

Make these exact compatibility substitutions:

```tsx
// src/app/_layout.tsx
import { Slot } from "expo-router";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";

// All SDK 54 color-scheme consumers
const themeKey = scheme === "dark" ? "dark" : "light";

// All four StyleSheet object-spread sites
...StyleSheet.absoluteFillObject
```

In `app-tabs.tsx`, import `Icon` and `Label` from
`expo-router/unstable-native-tabs`, use them as direct children of
`NativeTabs.Trigger`, and remove the unsupported `renderingMode` prop. Keep
the existing tab route names, labels, and image sources.

In `app-tabs.web.tsx` and `ui/collapsible.tsx`, replace platform-name maps
passed to `SymbolView.name` with either one SF Symbol name plus a real
Android/web fallback, or the existing cross-platform vector icon equivalent.
The collapsible fallback must preserve its expanded/collapsed direction.

- [ ] **Step 4: Run static and focused behavior checks**

Run from `mobile`:

```powershell
npm run lint
npm test -- editor-proposal-flow.test.tsx testing-stack.test.tsx mobile-shell.test.tsx
```

Expected: TypeScript exits 0; all selected suites pass; no direct Worklets
source import, no React Compiler experiment, and no route or tab-label change.

- [ ] **Step 5: Commit the SDK 54 source adapter**

```powershell
git add mobile/package.json mobile/package-lock.json mobile/src/__tests__/editor-proposal-flow.test.tsx mobile/src/app/_layout.tsx mobile/src/components/animated-icon.tsx mobile/src/components/app-tabs.tsx mobile/src/components/app-tabs.web.tsx mobile/src/components/mf.tsx mobile/src/components/ui/collapsible.tsx mobile/src/hooks/use-theme.ts mobile/src/MangaFlowMobileApp.tsx
git commit -m "fix(mobile): adapt source to sdk 54"
```

## Self-review

### Spec coverage

- SDK 54 dependency migration: Task 1.
- Remove unused SDK 56 packages: Task 1, Step 4.
- Remove direct Worklets API and preserve splash behaviour: Task 2.
- Disable React Compiler and preserve typed routes: Task 2.
- `expo-symbols` compatibility contingency: Task 1, Step 5.
- No backend, environment, ngrok, API, or feature-flow changes: Global Constraints and Task file boundaries.
- Static, web-export, Expo Doctor, and iOS/Android Expo Go verification: Task 3.

### Placeholder scan

The plan contains no TBD/TODO markers, vague test instructions, or undefined interfaces. The `expo-symbols` contingency includes its exact resolver command and rerun instruction.

### Type consistency

`AnimatedSplashOverlay` is consistently named across the test and implementation task. The migration removes `scheduleOnRN` and uses `runOnJS(setVisible)(false)` only inside Reanimated's animation completion callback.
