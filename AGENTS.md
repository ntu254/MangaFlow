## Goal

**Migration: Clerk → Custom Google OAuth + JWT — COMPLETE ✓**

### Key Decisions

| Decision | Detail |
|---|---|
| Auth provider | Custom Google OAuth (server-side token exchange) + JWT access/refresh tokens |
| Client auth hook | `@/shared/hooks/useAuth.ts` — returns `{ user, logout, isLoading, error }` |
| Client API client | `@/shared/api/client.ts` — `clerkId: string` field reused for Google OAuth `sub` ID |
| Server auth guard | `@/server/shared/guards/auth.guard.ts` — validates JWT from `Authorization: Bearer` header |
| Server role guard | `@/server/shared/guards/role.guard.ts` — checks user role from decoded JWT |
| Server user lookup | `@/server/shared/decorators/current-user.decorator.ts` — extracts user from request |
| Env vars | `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL` |
| Deleted | `server/src/infrastructure/clerk/` (entire directory), all `CLERK_*` env vars |
| Cleanup | Removed all Clerk npm imports, `@clerk/react` mock factories in tests, Clerk CSS overrides in `index.css`, Clerk button components from landing pages |

### Files Touched (Complete List)

- **Landing pages:** `LandingPage`, `LandingHero`, `LandingHeader`, `LandingCTA`, `LandingFeatures` — Clerk components→plain `<a href>` links, removed `clerkConfigured`
- **Admin UI:** `AdminRoleReviewPage` — `UserButton`→`<UserAvatar />`
- **Hook:** `useApi.ts` — Clerk `useAuth`→shared `useAuth`
- **Auth hook:** `@/shared/hooks/useAuth.ts` — clean Google OAuth + JWT flow
- **33 feature files** — global Clerk `useAuth`→shared `useAuth`
- **5 test files** — Clerk `vi.mock`→`vi.mock("@/shared/hooks/useAuth")`
- **All 6 .env files** — `CLERK_*`→`JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`
- **`role-assignment.service.ts`** — removed Clerk metadata sync function
- **`client/src/shared/api/client.ts`** — `clerkId` field retained (stores Google `sub`)
- **`index.css`** — removed Clerk CSS overrides
- **`server/src/infrastructure/clerk/`** — deleted
