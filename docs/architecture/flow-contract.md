# MVP Flow Contract

This file translates `flow.md` into implementation boundaries.

## Proposal to Series

1. Admin creates users and roles.
2. Mangaka creates and submits Proposal + preliminary Manuscript.
3. Editor reviews, requests changes, rejects, or forwards to Board.
4. Board votes.
5. Board finalization must select:
   - `tantouEditorId`
   - `publicationType`: `WEEKLY | MONTHLY`
6. Series is created only by Board finalization.

## Production

1. Only the Mangaka owner creates Chapter, Page, Region, Task, and deadlines.
2. Mangaka owner manages Assistant membership.
3. Assistant may access only assigned Task/Page resources.
4. Assistant submits work.
5. Mangaka reviews first.
6. Tantou Editor reviews after Mangaka approval.
7. Task completion creates Assistant earning.

## Chapter publication

1. Tantou reviews Chapter after all Tasks complete.
2. Tantou schedules/postpones/publishes via workflow actions.
3. Generic Chapter patch must not edit scheduled/published/publication fields.

## Ranking and At-risk

1. Board imports reader ranking data.
2. System updates Series ranking and at-risk state.
3. Tantou creates and submits AtRiskReport.
4. Board may decide `CONTINUE`, `RESCHEDULE`, `HIATUS`, or `CANCELLED` only
   after a submitted report exists.

## Role boundaries

- Admin: user management only in MVP.
- Board: governance data only; no production assets.
- Mangaka: owned Series production.
- Tantou Editor: assigned Series review, annotation, publication, at-risk report.
- Assistant: assigned work and own earnings.
