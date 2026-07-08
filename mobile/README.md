# MangaFlow Mobile

Expo + React Native + TypeScript mobile foundation for MangaFlow.

This mobile slice supports Board Chair/Board and Tantou Editor flows with live API auth, live read endpoints, and live workflow mutations for proposal review, final approval, comments, Board votes, finalize, tie-break, and at-risk decisions. Read calls still keep a local reference-data fallback so the mobile shell remains stable when the API is unavailable.

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
