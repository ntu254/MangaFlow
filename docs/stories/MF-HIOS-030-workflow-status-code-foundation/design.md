# Design

## Domain Model

Add `server/src/shared/workflow/status.ts` with canonical status arrays and
literal-union types. Series code will import `SERIES_STATUSES` and
`SeriesStatus` from this module.

## Application Flow

No workflow flow is implemented. Existing Series create/submit behavior remains:

- Create Series -> `DRAFT`
- Submit Series -> `EDITOR_REVIEW`

## Interface Contract

No API routes change. Existing API responses can now legally return any
canonical Series status once future services set them.

## Data Model

The Series Mongoose schema enum uses `SERIES_STATUSES`. This broadens the enum
to match the contract and avoids duplicate status arrays.

No migration is added.

## UI / Platform Impact

Client Series API type and status UI map are aligned to canonical Series
status names. No UI routes or visual layout change.

## Observability

No runtime audit/log behavior is added. Future transition services should audit
critical status changes.

## Alternatives Considered

1. Leave status values duplicated until backend services are built. Rejected
   because it preserves drift immediately after contract reconciliation.
2. Implement all transition guards now. Rejected as too broad for this story.
