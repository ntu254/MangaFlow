# MangaFlow Mobile

Expo + React Native + TypeScript mobile foundation for MangaFlow.

This first slice is UI-only and uses local mock data for Board Chair and Tantou Editor flows. It does not wire API, auth, signed URLs, Board decisions, or publication readiness mutations.

## Scripts

```bash
npm install
npm run lint
npm test
npm run build
npm run web
npm run android
```

## Android Emulator

Start an Android emulator from Android Studio first, then run:

```bash
cd mobile
npm install
npm run android
```

From the repository root, use:

```bash
npm install --prefix mobile
npm run android --prefix mobile
```

If Expo asks for a target device, select the running emulator. The Android SDK platform tools must be available through Android Studio or your local `ANDROID_HOME` setup.

## Scope

- Board shell: Home, Reviews, Votes, Ranking, Profile.
- Editor shell: Home, Review, Comments, Readiness, Profile.
- Shared MangaFlow UI primitives under `src/components/mf.tsx`.
- Mock data and status mappings under `src/data/mobile-data.ts`.
