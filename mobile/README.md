# MangaFlow Mobile

Expo + React Native + TypeScript mobile foundation for MangaFlow.

This mobile app is a Queue-first workflow console for Board and Tantou Editor accounts.

- **Live mode is the default.** Editor and Board identities (and Board Chair designation) come from the live auth API via `/auth/me`; there is no manual role switch.
- **No silent fallback.** A live read failure surfaces an error with retry — it never quietly returns reference/mock data.
- **Demo mode is explicit and labelled.** Set `EXPO_PUBLIC_ENABLE_MOBILE_MOCK_FALLBACK=true` to use local reference data; the shell then shows a persistent `Demo data` label.
- **All four tabs are live** for both roles: Editor (Today/Reviews/Publish/History) and Board (Today/Sessions/Ranking/History) read and act through the backend mobile API; there is no remaining mock UI to complete.

For future agent context, read `MOBILE_AGENT_CONTEXT.md` before changing mobile.

## Scripts

```bash
npm install
npm run lint
npm test
npm run build
npm run web
npm run android
```

## Environment

Expo reads mobile configuration from `mobile/.env`. Create it from the committed template:

```bash
cp .env.example .env
```

Configure `EXPO_PUBLIC_API_BASE_URL` and the Board/Editor accounts used by the quick-login buttons.
Set `EXPO_PUBLIC_ENABLE_MOBILE_MOCK_FALLBACK=true` only for the explicitly labelled local demo mode;
it selects local data directly rather than falling back after a live failure. Restart Expo after changing
`.env` so the build-time public variables are refreshed. These variables are bundled into the app, so
they must not contain private production secrets.

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

- Board shell (`src/screens/board-workspace.tsx`): Today, Sessions, Ranking, History — all backed by live reads through `src/services/board-mobile-data-source.ts`.
- Editor shell (`src/screens/editor-workspace.tsx`): Today, Reviews, Publish, History — all backed by live reads through `src/services/editor-mobile-data-source.ts`.
- Shared inbox projection under `src/services/mobile-inbox-data-source.ts` and `src/domain/mobile-work-item.ts` (zod-validated backend contract), consumed via `src/hooks/use-mobile-inbox.ts`.
- Shared MangaFlow UI primitives under `src/components/mf.tsx`.
- Session/auth boundary under `src/services/mobile-auth.ts`, `mobile-api-client.ts`, and `mobile-auth-storage.ts`; capabilities always come from the backend `actions[]` descriptor, never recomputed client-side.
- Explicit, labelled demo mode only (`EXPO_PUBLIC_ENABLE_MOBILE_MOCK_FALLBACK=true`): a small empty-items inbox, not a full mock UI layer. There is no live-to-mock fallback on request failure.
- Confirmation sheets, empty/loading/error states, readiness evidence, vote progress, and comment threads shared across Editor and Board detail screens.
