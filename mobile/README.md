# MangaFlow Mobile

Expo + React Native + TypeScript mobile foundation for MangaFlow.

This mobile app is a Queue-first workflow console for Board and Tantou Editor accounts.

- **Live mode is the default.** Editor and Board identities (and Board Chair designation) come from the live auth API via `/auth/me`; there is no manual role switch.
- **No silent fallback.** A live read failure surfaces an error with retry — it never quietly returns reference/mock data.
- **Demo mode is explicit and labelled.** Set `EXPO_PUBLIC_ENABLE_MOBILE_MOCK_FALLBACK=true` to use local reference data; the shell then shows a persistent `Demo data` label.
- **Foundation slice** exposes live Editor proposal and Board vote Today queues. Later slices complete the remaining Editor (Reviews/Publish/History) and Board (Sessions/Ranking/History) tabs.

For future agent context, read `MOBILE_AGENT_CONTEXT.md` before changing mobile. Recent story packets:

- `../docs/stories/MF-HIOS-095-mobile-editor-board-flow-foundation.md`
- `../docs/stories/MF-HIOS-096-mobile-decision-confirmation-details.md`
- `../docs/stories/MF-HIOS-097-mobile-queue-selection-details.md`
- `../docs/stories/MF-HIOS-098-mobile-empty-error-state-polish.md`
- `../docs/stories/MF-HIOS-099-mobile-rich-detail-previews.md`
- `../docs/stories/MF-HIOS-100-mobile-role-handoff-profile-polish.md`
- `../docs/stories/MF-HIOS-101-mobile-panel-componentization.md`
- `../docs/stories/MF-HIOS-102-mobile-action-panel-componentization.md`
- `../docs/stories/MF-HIOS-103-mobile-action-visual-polish.md`
- `../docs/stories/MF-HIOS-104-mobile-edge-case-visual-qa.md`

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

Configure `EXPO_PUBLIC_API_BASE_URL` and, when using the quick-login buttons or automatic API reads,
the Board/Editor demo account variables. Restart Expo after changing `.env` so the build-time public
variables are refreshed. These variables are bundled into the app, so they must not contain private
production secrets.

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
- Contract-aligned mobile types under `src/domain/workflow.ts`.
- Role-specific reference fallback data under `src/data/editor.ts` and `src/data/board.ts`.
- Live API + fallback boundary under `src/services/mobile-workflow-data-source.ts`.
- Role flow hooks under `src/hooks/use-editor-mobile-flow.ts` and `src/hooks/use-board-mobile-flow.ts`.
- Confirmation detail panels for live Editor and Board workflow mutations.
- Selectable queue rows for Editor and Board detail panels, backed by live reads with local reference fallback.
- Shared empty/loading/error UI states for mobile API flows.
- Rich detail previews for Editor proposal/comment/readiness evidence and Board proposal/ranking/history context.
- Role handoff and profile scope panels that explain live API/fallback boundaries without adding Mangaka or Assistant mobile roles.
- Componentized Editor and Board detail panels under `src/screens/*-panels.tsx`.
- Componentized Editor and Board action/confirmation panels under `src/screens/*-action-panels.tsx`.
- Polished mobile action controls, status chips, readiness blockers, ranking rows, segmented controls, and confirmation panels for narrow mobile widths.
- Visual edge-case hardening for empty queues, long labels, wrapped action rows, and narrow mobile viewport QA.
