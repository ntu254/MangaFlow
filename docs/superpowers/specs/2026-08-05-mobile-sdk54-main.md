# Mobile SDK 54 migration on main

## Goal

Make the mobile application on `main` run in the currently supported Expo Go
runtime (Expo SDK 54) on current iOS and Android devices, without changing
business behaviour, backend APIs, or mobile environment settings.

## Scope

- Update `mobile` from Expo SDK 56 to the SDK 54 dependency matrix.
- Use Expo's dependency resolver to select matching React, React Native, Expo
  modules, router, test tooling, WebView, and animation dependencies.
- Remove unused SDK 56-only dependencies: `@expo/ui` and `expo-glass-effect`.
- Replace the direct `react-native-worklets` callback used by the splash overlay
  with an SDK 54-compatible completion mechanism, preserving the visual intent.
- Disable the experimental React Compiler flag to avoid a runtime/toolchain
  compatibility risk in SDK 54 Expo Go.
- Retain `expo-symbols` only if Expo's SDK 54 resolver supports it; otherwise
  replace its web-only use with the already-installed icon library.
- Regenerate `package-lock.json` from the resolved SDK 54 dependency graph.

## Explicit non-goals

- Do not merge code from `fix/mobile-flow-remediation`.
- Do not change API endpoints, backend source, `.env` files, ngrok settings, or
  authentication and upload/preview business rules.
- Do not redesign screens or intentionally change user-facing flows.
- Do not create an APK/development build as part of this migration; the target
  runtime is Expo Go.

## Compatibility decisions

| Concern | Decision |
| --- | --- |
| Runtime | Expo SDK 54 with its matching React Native 0.81 and React 19.1 lines. |
| Native packages | Install versions through `npx expo install --fix`; do not hand-pin SDK 56 native packages. |
| Splash callback | Remove the standalone Worklets dependency and schedule the state update through an SDK 54-safe mechanism after the entering animation completes. |
| React Compiler | Set `experiments.reactCompiler` to `false` / remove it. |
| Symbol icons | Preserve if compatible; otherwise use `@expo/vector-icons` only in web-only components. |

## Acceptance criteria

1. `mobile/package.json` and its lockfile resolve only SDK 54-compatible Expo
   native dependencies.
2. Expo diagnostics report no dependency version mismatch.
3. TypeScript check, existing Jest suite, and web export complete successfully.
4. `npx expo start --clear` starts an SDK 54 project that can be opened in Expo
   Go on both Android and iOS.
5. No source or environment changes are made outside the mobile app and the
   migration documentation.

## Risks and mitigations

- SDK 56 component APIs may not exist in SDK 54. Search all direct usages,
  replace only those found, and run static checks after each change.
- Package-manager resolution can retain an SDK 56 transitive version. Recreate
  the lockfile through the Expo installer, then run Expo Doctor.
- A physical-device check depends on the user's iOS/Android Expo Go devices and
  network. The repository verification will be completed locally; device QR
  verification will be handed off with exact commands if no devices are attached.
