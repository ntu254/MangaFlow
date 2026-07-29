# Publication, persistence, and API boundary hardening — 2026-07-27

## Completed

- Publication schedule/postpone/publish commands now live in
  `backend/src/services/publication.service.ts`.
- Earning calculation, idempotent earning persistence, and the transactional
  `earning.earned` outbox event now live in
  `backend/src/services/earning.service.ts`.
- Publication and earning schemas/models are extracted from the central registry
  into `backend/src/db/models/publication.model.ts` and
  `backend/src/db/models/earning.model.ts`; `db/models.ts` remains a compatibility
  barrel and mutable-model registry.
- Web API clients are split into `src/shared/api/workflow.ts`,
  `production.ts`, `governance.ts`, `account.ts`, and `media.ts`. The historical
  `services.ts` path remains a type/barrel compatibility layer.

## Contract verification

- Backend lint/build: PASS.
- Root lint/typecheck/build: PASS.
- Frontend business-flow contracts: PASS, 6/6.
- Architecture audit: PASS; no boundary violations reported.
- Existing P0/workflow production regression: PASS after each seam.

## Compatibility decision

No route, payload, status transition, permission, or error-code contract was
changed. The remaining central model registry is intentionally retained for
cross-domain bootstrap/seed and `allMutableModels` compatibility; future model
extractions must follow the same barrel pattern and keep registry identity
stable.
