# Authentication Flow

## Description
User authenticates via email/password to receive JWT access + refresh tokens.
The backend issues short-lived access tokens and longer-lived refresh tokens
stored in a RefreshSession collection. All subsequent requests use Bearer token auth.

## Flowchart

```mermaid
graph TD
    A[User opens /login] --> B[Enter email + password]
    B --> C[POST /api/auth/login]
    C --> D{Valid credentials?}
    D -- No --> E[HTTP 401 INVALID_CREDENTIALS]
    D -- Yes --> F[bcrypt.compare verified]
    F --> G[Create RefreshSession in DB]
    G --> H[Sign JWT access token<br/>payload: sub, role, sessionId]
    H --> I[Sign JWT refresh token<br/>payload: sub, role, sessionId]
    I --> J[Return {user, accessToken, refreshToken, sessionId}]
    J --> K[Frontend stores tokens<br/>useAuth Zustand persist]

    K --> L[Authenticated API calls<br/>Authorization: Bearer {accessToken}]
    L --> M{requireAuth middleware}
    M -- No token --> N[HTTP 401 MISSING_AUTH]
    M -- Invalid/expired token --> O[HTTP 401 INVALID_ACCESS_TOKEN]
    M -- Session revoked --> P[HTTP 401 SESSION_EXPIRED]
    M -- User inactive --> Q[HTTP 401 USER_INACTIVE]
    M -- Valid --> R[req.actor set, next()]

    K --> S[Token expiring]
    S --> T[POST /api/auth/refresh]
    T --> U{Refresh token valid?}
    U -- No --> V[HTTP 401 INVALID_REFRESH_TOKEN]
    U -- Expired/revoked --> W[HTTP 401 INVALID_REFRESH_SESSION]
    U -- Yes --> X[Revoke old session]
    X --> Y[Create new RefreshSession]
    Y --> Z[Return new token pair]

    K --> AA[User logs out]
    AA --> AB[POST /api/auth/logout]
    AB --> AC[Revoke RefreshSession by tokenHash or sessionId]
    AC --> AD[Return {ok: true}]
    AD --> AE[Frontend clears Zustand + API tokens]
```

## Role Gating

All protected routes go through `requireAuth` middleware (`middleware/auth.ts:6`).
Role-specific routes additionally use:
- `requireRole(...roles)` — checks `req.actor.role` is in the allowed set
- `requireExactRole(...roles)` — alias of requireRole (identical check)
- `requireBoardChair` — checks `role === "BOARD" && isChair === true`
- `requireExactBoardChair` — alias of requireBoardChair

## Special Designation Management (Canonical)

Admin manages user accounts and may assign the two special designations through the
normal user-update function:

- `role = BOARD` may have `isChair = true`.
- `role = EDITOR` may have `isEditorInChief = true`.
- A non-BOARD user must not retain `isChair`.
- A non-EDITOR user must not retain `isEditorInChief`.
- The active Board roster contains three to five users.
- At most one active Board Chair and one active EIC may exist at a time.
- Reassigning a designation must clear it from the previous holder atomically.
- Deactivating or changing the role of a current Chair/EIC must clear the incompatible flag.

Assigning these flags is account administration only. Admin does not create or close
VotingSessions, vote, cast a tie-break, claim Proposals, review Chapters, or perform
any workflow action on behalf of the designated user.

## Key Files
- `backend/src/middleware/auth.ts` — requireAuth, requireRole, requireBoardChair
- `backend/src/services/auth.service.ts` — login, refresh, logout, userForAccessToken
- `backend/src/controllers/auth.controller.ts` — loginHandler, refreshHandler, meHandler, logoutHandler
- `backend/src/routes/auth.routes.ts` — route registration
- `backend/src/config/env.ts` — JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN
- `src/shared/auth/auth-store.ts` — frontend Zustand auth store
- `src/shared/api/auth.ts` — frontend API auth functions
- `src/shared/api/client.ts` — API client with Bearer token injection

## Error Codes
| Code | HTTP | Meaning |
|------|------|---------|
| MISSING_AUTH | 401 | No Bearer token in header |
| INVALID_ACCESS_TOKEN | 401 | JWT verification failed or expired |
| SESSION_EXPIRED | 401 | RefreshSession revoked or not found |
| USER_INACTIVE | 401 | User `active` flag is false |
| INVALID_CREDENTIALS | 401 | Email not found or password mismatch |
| INVALID_REFRESH_TOKEN | 401 | Refresh JWT invalid |
| INVALID_REFRESH_SESSION | 401 | Refresh session expired/revoked |
| FORBIDDEN | 403 | Authenticated but wrong role |
| BOARD_CHAIR_REQUIRED | 403 | Not a Board Chair |

## Notes
- Access token expiry is configurable via `JWT_EXPIRES_IN` env var
- Refresh tokens have a 7-day TTL stored in `expiresAt`
- Refresh is rotation-based: old session is revoked, new session created
- Demo mode: frontend can `loginAsRole(role)` without backend via Zustand persist
- Live mode: `loginWithCredentials(email, password)` hits `POST /api/auth/login`
