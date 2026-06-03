# Design

## Domain Model

The mobile MVP consumes existing MangaFlow concepts: user role, series,
manuscript, page, comment, chapter readiness, board vote, board decision,
ranking, and notification.

The mobile client treats role state as display and navigation input only. The
backend remains the permission source of truth.

## Application Flow

The mobile app starts at a role landing screen. In production it will derive the
role from Google OAuth-backed `/api/auth/me`; the initial MVP shell includes
deterministic seeded data so the screen and navigation contract can be validated
before provider credentials exist.

Editor flow:

```text
Home -> Series -> Reviews -> Publication -> Notifications
```

Board flow:

```text
Home -> Approvals -> Ranking -> Decisions -> Notifications
```

## Interface Contract

Primary API contracts are inherited from `docs/09_mobile_app_spec.md`:

- `GET /api/dashboard/editor`
- `GET /api/series?scope=assigned-editor`
- `GET /api/comments?role=editor`
- `GET /api/chapters/:id/readiness`
- `GET /api/dashboard/board`
- `GET /api/series?status=BOARD_REVIEW`
- `POST /api/series/:id/votes`
- `GET /api/rankings/periods/:period`
- `POST /api/series/:id/decisions/tie-break`

## Data Model

No new backend data model is introduced by this story. Mobile reads and mutates
existing backend resources through authenticated API requests.

## UI / Platform Impact

Adds a new `mobile/` workspace using Expo, React Native, TypeScript, and
React Navigation. The design system maps the Fresh Pastel Creative palette to
native tokens, touch-friendly controls, cards, badges, and confirmation
dialogs.

## Observability

No production mobile telemetry is added in this story. Future stories should
add structured client error reporting and push notification delivery evidence.

## Alternatives Considered

1. Build only responsive web mobile views. Rejected because the accepted mobile
   spec explicitly recommends React Native + Expo.
2. Add every role to mobile immediately. Rejected because the spec scopes MVP
   to Tantou Editor and Editorial Board.

