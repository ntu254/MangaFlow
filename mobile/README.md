# MangaFlow Mobile

Expo + React Native + TypeScript mobile foundation for MangaFlow.

This slice is UI-only and uses an async mock data-source boundary for Board Chair and Tantou Editor flows. It does not wire API, auth, signed URLs, Board decisions, or publication readiness mutations.

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
- Role-specific mock data under `src/data/editor.ts` and `src/data/board.ts`.
- Future API replacement boundary under `src/services/mobile-workflow-data-source.ts`.
- Role flow hooks under `src/hooks/use-editor-mobile-flow.ts` and `src/hooks/use-board-mobile-flow.ts`.
- Local confirmation detail panels for mock Editor and Board decisions before future POST action endpoints are wired.
- Selectable queue rows for Editor and Board detail panels, using local mock state only.
- Shared empty/loading/error UI states for API-ready mobile flows.
- Rich local detail previews for Editor comment/readiness evidence and Board ranking/history context.
- Role handoff and profile scope panels that explain mock/API boundaries without adding auth or new mobile roles.
- Componentized Editor and Board detail panels under `src/screens/*-panels.tsx`.
- Componentized Editor and Board action/confirmation panels under `src/screens/*-action-panels.tsx`.
- Polished mobile action controls, status chips, readiness blockers, ranking rows, segmented controls, and confirmation panels for narrow mobile widths.
- Visual edge-case hardening for empty queues, long labels, wrapped action rows, and narrow mobile viewport QA.
