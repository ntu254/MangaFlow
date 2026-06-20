# Auth UI Logout Progress

## Current Branch

`codex/auth-ui-logout-sync`

## Goal

Add a clear logout button and align the auth screen with the existing MangaFlow UI system.

## Implemented

- Added `isLoggingOut` to `useAuth`.
- Wired sidebar logout through the auth logout mutation so it calls `POST /api/auth/logout` before clearing local auth.
- Added a visible navbar logout button with loading feedback.
- Refreshed the login page to use semantic design tokens (`bg-card`, `border-border`, `text-muted-foreground`, `bg-sidebar`) instead of raw gray/black surfaces.
- Removed dead `#` footer and forgot-password links from the auth page.
- Kept demo login behavior unchanged.

## Verification

```bash
npm --prefix client run lint
npm --prefix client run build
```

Result:

- Client lint passed with 8 pre-existing warnings in unrelated files.
- Client production build passed.
