# Overview

## Current Behavior

MangaFlow has browser, backend API, and AI service scaffolding. The repository
does not yet include a React Native mobile surface.

## Target Behavior

Add an Expo React Native mobile MVP companion app for Tantou Editor and
Editorial Board users. The app exposes role-scoped dashboards, review queues,
publication readiness, voting, ranking, at-risk decisions, and notifications
using the Fresh Pastel Creative design direction.

## Affected Users

- Tantou Editor.
- Editorial Board member.
- Editorial Board Chair.

## Affected Product Docs

- `docs/09_mobile_app_spec.md`
- `docs/product/architecture.md`
- `docs/product/auth-user-sync.md`
- `docs/product/roles-permissions.md`
- `docs/product/api-storage-data.md`
- `docs/product/ui-direction.md`

## Non-Goals

- Full phone canvas annotation.
- Batch uploads, PSD/layer management, or AI batch processing.
- Replacing the desktop production workspace.
- Trusting role or permissions from the mobile client.

