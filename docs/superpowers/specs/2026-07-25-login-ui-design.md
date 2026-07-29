# Login UI design

## Goal

Make the existing email/password authentication discoverable while retaining fast access to seeded accounts for internal demos of role-based workflows and board voting.

## Scope

- Replace the role-card-only `/login` page with an email/password form as the primary action.
- Submit through the existing `loginWithCredentials(email, password)` flow and redirect successful users to `/app/dashboard`.
- Show a clear invalid-credentials or request failure message, disable duplicate submits while pending, and allow Enter to submit.
- Keep seeded role and five Board-member sign-ins in a collapsed **Demo quick access** section below the form.

## Interaction flow

1. A user opens `/login` and sees the sign-in form first.
2. They submit email and password.
3. The existing API client stores access and refresh tokens; the auth store receives the mapped user.
4. The user is redirected to the dashboard for their role.
5. For training or quorum demonstrations, an operator expands **Demo quick access** and selects a seeded role or individual Board member.

## UI and accessibility

- Use the project's existing `Input`, `Label`, and button styling.
- Use `type="email"`, `type="password"`, explicit labels, `autoComplete` values, and an accessible error region.
- Keep the demo area visually secondary and collapsed by default so production-like sign-in remains the primary path.

## Non-goals

- Registration, password reset, SSO, remember-me controls, MFA, and authentication API changes.
- Changing account permissions, token storage, voting rules, or the seeded credentials.

## Verification

- A valid seeded email/password reaches the dashboard with the expected role.
- Invalid credentials retain the form and show an error.
- Repeated submit is prevented while the request is pending.
- Demo role and Board-member shortcuts still authenticate through the live API.
- Existing frontend checks and relevant backend authentication tests pass.
