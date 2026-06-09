# Exec Plan

## Goal

Create a high-risk hardening story packet that sets the required security/runtime boundaries before additional vertical-slice feature wiring continues.

## Scope

In scope:

- Remove hardcoded admin-seed credential behavior from source-level expectations.
- Require strict production env validation for auth/runtime/storage secrets.
- Require server fail-fast behavior when MongoDB connection fails.
- Define AccessPolicy-based authorization for Assistant task/page/file access.
- Define signed URL access checks for private file retrieval.
- Restrict AI service access boundary so frontend does not call AI service directly.
- Clarify temporary base64 handling rule: never persist base64 in DB; backend must convert to file/object boundary.
- Record UTF-8/mojibake normalization as part of hardening acceptance.

Out of scope:

- Implementing all hardening code in this docs pass.
- Reworking publication or board feature UI.
- Storage-provider migration.
- New product capabilities.

## Risk Classification

Risk flags:

- Auth
- Authorization
- Audit/security
- External systems
- Public contracts
- Existing behavior
- Weak proof
- Multi-domain

Hard gates:

- Auth
- Authorization
- Audit/security
- External provider behavior

## Work Phases

1. Discovery.
2. Contract hardening.
3. Architecture and ops hardening.
4. Validation planning.
5. Future implementation.
6. Verification and harness sync.

## Stop Conditions

Pause for human confirmation if:

- Production secret rules conflict with deployment reality.
- Signed URL/file ownership rules need product-scope expansion.
- AI service must expose direct browser access in production.
- Validation requirements need to be weakened.
