# Login UI and Quorum Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make email/password sign-in the primary login experience and publish a focused senior review of authentication and board quorum flows.

**Architecture:** Keep the existing authentication API and Zustand store unchanged. Replace role-card-first login with a semantic form that calls `loginWithCredentials`; retain live seeded-account helpers in a collapsed demo section. Audit the backend and UI vote path without changing vote rules.

**Tech Stack:** React 19, TanStack Router, Zustand, Tailwind CSS, Radix Collapsible, Playwright, Express, MongoDB, Vitest.

## Global Constraints

- Submit through existing `loginWithCredentials(email, password)` and redirect successful users to `/app/dashboard`.
- Use `type="email"`, `type="password"`, explicit labels, autocomplete values, and an accessible error region.
- Keep seeded role and five Board-member sign-ins in collapsed **Demo quick access**.
- Do not add registration, reset, SSO, MFA, dependencies, API changes, permission changes, token-storage changes, or voting-rule changes.
- Keep recommendations proportionate for a moderate-complexity internal training project.

---

## File structure

- `src/routes/login.tsx` — credential form, pending/error state, collapsed demo access.
- `tests/e2e-role-flows.spec.ts` — visible-login-form browser assertion.
- `docs/reviews/2026-07-25-login-quorum-review.md` — evidence-backed workflow audit.

### Task 1: Implement primary credential sign-in

**Files:**
- Modify: `src/routes/login.tsx`
- Modify: `tests/e2e-role-flows.spec.ts`

**Interfaces:**
- Consumes: `loginWithCredentials(email: string, password: string): Promise<User>` from `@/shared/auth`.
- Produces: a labelled credential form and a closed `Demo quick access` trigger.

- [ ] **Step 1: Write the failing browser test**

Add this test before the role-flow tests:

```ts
test("login exposes credential sign-in before optional demo access", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to the studio" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Demo quick access" })).toHaveAttribute("aria-expanded", "false");
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npx playwright test tests/e2e-role-flows.spec.ts --grep "credential sign-in"`

Expected: FAIL because the current route has neither the form nor the demo trigger.

- [ ] **Step 3: Add the minimal form and demo container**

Import existing UI primitives:

```tsx
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

Add `email` and `password` state. Submit with the current API flow:

```tsx
async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setPending("credentials");
  setError(null);
  try {
    await loginWithCredentials(email, password);
    navigate({ to: "/app/dashboard" });
  } catch (err) {
    setError(err instanceof Error ? err.message : "Login failed. Please try again.");
  } finally {
    setPending(null);
  }
}
```

Render an `h1` named `Sign in to the studio`, labelled email/password inputs (`autoComplete="email"`, `autoComplete="current-password"`), an `aria-live="polite"` error message, and a disabled-while-pending submit button. Wrap the existing role and Board-member buttons in:

```tsx
<Collapsible className="mt-8 rounded-lg border border-border bg-card/40 p-5">
  <CollapsibleTrigger className="w-full text-left text-sm font-semibold">Demo quick access</CollapsibleTrigger>
  <CollapsibleContent>{/* existing live role and Board-member buttons */}</CollapsibleContent>
</Collapsible>
```

Do not display seeded passwords.

- [ ] **Step 4: Verify the deliverable**

Run: `npx playwright test tests/e2e-role-flows.spec.ts --grep "credential sign-in"`

Expected: PASS when the frontend test server is available; otherwise report the exact API/server blocker.

Run: `npm run lint && npm run build`

Expected: both exit 0.

- [ ] **Step 5: Commit**

Run: `git add src/routes/login.tsx tests/e2e-role-flows.spec.ts && git commit -m "feat: add credential login form"`

### Task 2: Publish the login and quorum review

**Files:**
- Create: `docs/reviews/2026-07-25-login-quorum-review.md`

**Interfaces:**
- Consumes: `src/shared/auth/auth-store.ts`, `src/shared/api/auth.ts`, `backend/src/services/auth.service.ts`, `backend/src/services/workflow.service.ts`, and `src/entities/proposal/model/proposal-types.ts`.
- Produces: a prioritized evidence-backed review; no workflow code changes.

- [ ] **Step 1: Collect flow evidence**

Run:

```powershell
rg -n "loginWithCredentials|logoutLive|setApiTokens|refresh|expiresAtFor" src/shared backend/src/services/auth.service.ts
rg -n "configuredBoardQuorum|BOARD_QUORUM|eligibleVoter|ProposalVoteModel|version" backend/src/services/workflow.service.ts src/entities/proposal/model/proposal-types.ts
```

Expected: direct references for login, refresh/logout, quorum, voter eligibility, vote persistence, and frontend display.

- [ ] **Step 2: Write the audit**

Create a review containing exactly these sections:

```markdown
# Login and quorum workflow review
## Scope and method
## Flow summary
## Findings
## Recommended next steps
## Out of scope
```

Every finding must include severity, exact file/line, observed behavior, user impact, smallest recommendation, and one disposition: **Fix now**, **Follow-up**, or **Accept for training scope**. Do not propose SSO, MFA, distributed transactions, or enterprise governance additions.

- [ ] **Step 3: Verify audit evidence**

Run: `npm --prefix backend run lint`

Expected: exit 0.

Run: `npm --prefix backend test -- --runInBand`

Expected: PASS. If MongoDB-memory-server cannot start or execution exceeds two minutes, record the exact environment limitation and do not claim suite success.

- [ ] **Step 4: Commit**

Run: `git add docs/reviews/2026-07-25-login-quorum-review.md && git commit -m "docs: review login and quorum flows"`

## Plan self-review

- Task 1 covers credential sign-in, accessibility, duplicate-submit prevention, dashboard redirect, and collapsed live demo access.
- Task 2 covers the requested senior workflow review without silently changing quorum behavior.
- Existing interfaces are reused; no placeholders or new dependencies are required.
