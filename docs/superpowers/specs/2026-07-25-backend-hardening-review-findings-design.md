# Backend Hardening — Fix Review Findings

**Date:** 2026-07-25
**Branch:** `fix/backend-hardening-review-findings`
**Scope:** Backend (`backend/src`) auth / authorization / workflow. Bugs & security only.

## Context

A bugs-and-security review of the `main` branch backend (auth, authorization,
file access, workflow guards) surfaced seven findings, ranked from a
release-blocking board-quorum regression down to informational dead code. This
spec defines the fix for each. Goal: the smallest correct diff per finding, no
behavior change beyond the fix itself. Behavioral fixes get one test each;
purely mechanical fixes do not.

Decisions taken during brainstorming:
- Rate limiting: `express-rate-limit`, in-memory (backend is single-instance).
- CORS: allow exactly one origin from `env.CLIENT_URL`.
- Duplicate `requireExact*` middleware: collapse to aliases (no call-site rewrite).

## Scope revision (2026-07-25, post-implementation)

This is an internal course project used within one company department. The
goal is correct business workflow, basic role permissions, consistent data,
and a stable, demo-friendly system — not enterprise-grade security. On that
basis, **finding #2 (login/refresh rate limiting) is descoped and removed
from the branch**, along with its follow-on `AUTH_RATE_LIMIT_MAX` NaN guard.
Rate limiting pulled in an env var, a 429 contract, and trust-proxy concerns
unrelated to the core workflow (YAGNI for an internal, low-traffic tool). The
`trust proxy` and 429-envelope notes are likewise not pursued.

**Kept (business logic + code quality):** findings #1, #4, #5, #6, #7, plus the
simple CORS pin (#3). See the fixes below; #2 remains documented for record
only and is not implemented.

## Fixes

### 1. Restore board-quorum safety floor — MEDIUM (release blocker)
**File:** `backend/src/services/workflow.service.ts` (`configuredBoardQuorum`, ~L44-51)

The floor was lowered to `raw < 1` for local single-vote testing, letting
`BOARD_QUORUM=1` or `2` through — which allows a single Board member to decide a
proposal (`evaluateBoardTally`: `approve >= BOARD_QUORUM`).

- Change `raw < 1` → `raw < 2`.
- Remove the stale "revert before shipping" comment.
- Export `configuredBoardQuorum` for unit testing.

**Test:** `BOARD_QUORUM=1` falls back to `3` (quorum-of-1 rejected); `2`, `3`,
and `5` pass through unchanged. The security-relevant assertion is that `1` is
rejected; `2` remains the author's chosen minimum.

### 2. Add login/refresh rate limiting — LOW–MEDIUM
**Files:** new `backend/src/middleware/rate-limit.ts`; `backend/src/routes/auth.routes.ts`

No throttling exists on `/api/auth/login` or `/api/auth/refresh`, leaving them
open to brute-force / credential-stuffing.

- Add `express-rate-limit` dependency.
- `rate-limit.ts` exports `authLimiter`: IP-based, ~10 requests / 15 min window,
  `429` response, standard rate-limit headers, `legacyHeaders: false`.
- Max attempts read from env (`AUTH_RATE_LIMIT_MAX`) with a high default under
  `VITEST` so existing auth suites that log in repeatedly are unaffected.
- Apply `authLimiter` in `auth.routes.ts` to the `login` and `refresh` routes only.

**Test:** a dedicated test instantiates the limiter with a low max and asserts
the Nth+1 call returns `429` (does not rely on the VITEST-relaxed default).

### 3. Pin CORS to a single origin — LOW (hardening)
**File:** `backend/src/app.ts` (~L19-24)

`cors({ origin: true, credentials: true })` reflects any origin.

- Change `origin: true` → `origin: env.CLIENT_URL`. Keep `credentials: true`.

### 4. Scope the dashboard summary endpoint — LOW
**File:** `backend/src/controllers/bootstrap.controller.ts` (`dashboardSummaryHandler`)

`/dashboard/:role/summary` (behind `requireAuth`) passes `req.params.role`
straight through, so any authenticated user can request any role's aggregate.

- Enforce `req.params.role === apiToWebRole[req.actor.role]`.
- ADMIN may request any role.
- Otherwise `403 FORBIDDEN`.

**Test:** a BOARD actor requesting `/dashboard/editor/summary` → `403`.

### 5. Align file-key visibility for editors with proposal read rules — LOW
**File:** `backend/src/services/studio-access.service.ts` (`assertFileKeyVisible`, ~L88)

The EDITOR branch grants any editor the cover of any proposal regardless of
status, including `DRAFT` — inconsistent with `canReadProposal`
(`authorization.service.ts`), which restricts editors to non-`DRAFT` proposals.

- Change the EDITOR condition to
  `(actor.role === "EDITOR" && String(proposal.status) !== "DRAFT")`.

**Test:** an editor requesting a `DRAFT` proposal's cover file key → `403`.

### 6. Collapse duplicate role middleware — INFORMATIONAL
**File:** `backend/src/middleware/auth.ts`

`requireExactRole` is byte-identical to `requireRole`, and
`requireExactBoardChair` to `requireBoardChair`. The naming implies stricter
semantics that do not exist.

- Replace the duplicate bodies with aliases:
  `export const requireExactRole = requireRole;`
  `export const requireExactBoardChair = requireBoardChair;`
- Add a one-line comment noting they are intentionally identical.
- Keep the exported names so the ~60 route call sites are untouched.

No behavior change. Note: this preserves the existing ADMIN-lockout on
`requireExactRole("MANGAKA")`-style routes; changing that semantics is out of scope.

### 7. Remove dead `FORCE_STATUS` handler — INFORMATIONAL
**File:** `backend/src/services/workflow.service.ts` (`applyProposalAction`, ~L1013-1026)

`assertProposalAction` throws `410 WORKFLOW_REMOVED` for `FORCE_STATUS` before
the switch runs, so the `case "FORCE_STATUS"` body that force-sets status is
unreachable.

- Remove the `case "FORCE_STATUS"` block from the `applyProposalAction` switch.
- Keep the `410` guard in `assertProposalAction` as the single source of truth.

## Out of scope
- ADMIN-lockout semantics of `requireExact*` routes (behavior preserved).
- R2 / local-storage capability model (verified fine in review).
- Any frontend / mobile / ai-service changes.

## Verification
- `cd backend && npm test` (vitest) — new tests for findings 1, 2, 4, 5 pass;
  existing auth suites still pass (rate limiter relaxed under VITEST).
- Type-check / build the backend (`tsconfig.build.json`).
- Manual smoke: login succeeds within limit, returns `429` after the window max;
  CORS preflight from a non-`CLIENT_URL` origin is rejected.
