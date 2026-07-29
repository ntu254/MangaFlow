# Security and operational audit — 2026-07-27

## Implemented in this phase

- `helmet()` remains enabled for baseline security headers.
- CORS remains restricted to configured `CLIENT_URL` with credentials enabled.
- Production startup rejects the development JWT secrets and missing Mongo URI.
- Login and refresh now use a configurable per-IP in-memory rate limiter:
  `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX`; the response is
  `429 RATE_LIMITED` with `Retry-After`.
- Rate-limiter behavior has a focused regression test.

## Verification

- Backend lint/build: PASS.
- Rate-limit test: PASS.
- Root lint/typecheck/build: PASS.
- Backend production dependency audit: 0 vulnerabilities.

## Residual risks and remediation path

- Web production dependency audit is now clean after the non-breaking lockfile
  update (`js-yaml`, `postcss`, `nanoid`, and `brace-expansion` paths).
  The full development dependency audit still reports five high findings through
  the ESLint/minimatch chain; the available fix requires the breaking ESLint 10
  upgrade and is intentionally deferred to a dedicated toolchain update.
- Mobile non-breaking `npm audit fix` was applied and removed the high findings.
  The audit now reports 11 moderate findings through the Expo/Xcode `uuid` path;
  `npm audit fix --force` still requires a breaking Expo downgrade. Do not force
  this in the workflow remediation; schedule a mobile dependency upgrade with
  its own device/build verification.
- Web access and refresh tokens remain in `localStorage`, an accepted risk
  documented in `DESIGN.md`. Moving refresh tokens to HttpOnly cookies requires
  a coordinated backend/frontend auth contract change and is not safe as an
  isolated refactor.
- The rate limiter is process-local. Multi-instance production deployments
  should move the bucket store to Redis or an equivalent shared limiter.
