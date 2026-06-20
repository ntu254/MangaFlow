# Mobile Auth UI Progress

## Current Branch

`codex/mobile-auth-ui-api`

## Goal

Create a mobile auth UI for the Expo/React Native app and call the working auth APIs before showing Board or Tantou Editor mobile screens.

## Implemented

- Added `mobile/src/services/mobile-auth.ts`.
- Added live `POST /api/auth/login` and `POST /api/auth/logout` calls for mobile.
- Added demo account buttons for Board and Tantou Editor.
- Added token handoff into `mobileWorkflowDataSource` through `setMobileWorkflowAuthToken`.
- Added platform-aware API base URL resolution for port `3001` (`localhost` on web/iOS simulator, `10.0.2.2` on Android emulator).
- Added a full `MobileAuthScreen` with email/password inputs, password visibility toggle, loading states, inline errors, API demo account shortcuts, and mobile-safe layout.
- Added app logout from the top session strip and profile page.
- Added role-specific logout test cards for Board and Tantou Editor sessions.
- Kept mobile auth login-only; registration is explicitly disabled on the mobile auth screen.
- Preserved Board and Tantou Editor shell screens after authentication.

## API Smoke

Checked against `http://localhost:3001/api`:

| API | Result |
| --- | --- |
| `POST /api/auth/login` as Board | 200 |
| `GET /api/dashboard/board/summary` | 200 |
| `POST /api/auth/login` as Editor | 200 |
| `GET /api/dashboard/editor/summary` | 200 |

## Verification

```bash
npm --prefix mobile run lint
npm --prefix mobile run test
npm --prefix mobile run build
```

All passed.
