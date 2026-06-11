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
```

## Scope

- Board shell: Home, Reviews, Votes, Ranking, Profile.
- Editor shell: Home, Review, Comments, Readiness, Profile.
- Shared MangaFlow UI primitives under `src/components/mf.tsx`.
- Mock data and status mappings under `src/data/mobile-data.ts`.
