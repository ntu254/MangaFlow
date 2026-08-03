# MangaFlow Mobile

Expo + React Native + TypeScript mobile foundation for MangaFlow.

This mobile app is a Queue-first workflow console for Board and Tantou Editor accounts.

- **Live mode is the default.** Editor and Board identities (and Board Chair designation) come from the live auth API via `/auth/me`; there is no manual role switch.
- **No silent fallback.** A live read failure surfaces an error with retry — it never quietly returns reference/mock data.
- **Demo mode is explicit and labelled.** Set `EXPO_PUBLIC_ENABLE_MOBILE_MOCK_FALLBACK=true` to use local reference data; the shell then shows a persistent `Demo data` label.
- **Foundation slice** exposes live Editor proposal and Board vote Today queues. Later slices complete the remaining Editor (Reviews/Publish/History) and Board (Sessions/Ranking/History) tabs.

For future agent context, read `MOBILE_AGENT_CONTEXT.md` and the maintained
`../docs/business-flows/` documents before changing mobile.

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

- Board shell: Today, Sessions, Ranking, History; Today currently exposes live vote queues.
- Editor shell: Today, Reviews, Publish, History; Today currently exposes live proposal queues.
- Shared MangaFlow UI primitives under `src/components/mf.tsx`.
- Contract-aligned mobile types under `src/domain/workflow.ts`.
- Role-specific reference data under `src/data/editor.ts` and `src/data/board.ts`, available only in explicit demo mode.
- Live API boundary under `src/services/mobile-workflow-data-source.ts`, with normalized errors and no live-to-mock fallback.
- Role flow hooks under `src/hooks/use-editor-mobile-flow.ts` and `src/hooks/use-board-mobile-flow.ts`.
- Confirmation detail panels for live Editor and Board workflow mutations.
- Selectable queue rows for Editor and Board detail panels, backed by live reads or explicit local demo data.
- Shared empty/loading/error UI states for mobile API flows.
- Rich detail previews for Editor proposal/comment/readiness evidence and Board proposal/ranking/history context.
- Role handoff and profile scope panels that explain live API/fallback boundaries without adding Mangaka or Assistant mobile roles.
- Componentized Editor and Board detail panels under `src/screens/*-panels.tsx`.
- Componentized Editor and Board action/confirmation panels under `src/screens/*-action-panels.tsx`.
- Polished mobile action controls, status chips, readiness blockers, ranking rows, segmented controls, and confirmation panels for narrow mobile widths.
- Visual edge-case hardening for empty queues, long labels, wrapped action rows, and narrow mobile viewport QA.
- Submitted-file review for Board Proposal reviews and assigned Editor Proposal/Chapter reviews. Metadata is loaded from `/api/review-files`; a display URL is requested only when a file is opened.

## Submitted-file review

- Board can review **Proposal files only**. It never requests Chapter, Page, Task, Submission, or production Material files.
- An Editor can review files for its permitted Proposal and Chapter contexts; the backend remains the authorization source for every request.
- File metadata contains no display URL. The app POSTs `/api/files/display-url` only after the user selects a file, keeps the URL only in memory, and never fabricates a mock URL.
- A URL is treated as expired at the server `expiresAt`, or after an eight-minute fallback lease. The viewer refreshes 30 seconds before a 900-second URL expires, retries one failed preview with a new URL, and then offers manual Retry.
- A `403` clears the viewer and returns to the review surface; a `404` is shown as unavailable. Image/PDF files preview in-app; unsupported types open through the device handler.
