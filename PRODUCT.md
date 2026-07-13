# MangaFlow

MangaFlow is a multi-role manga production workflow tool. The product serves authenticated users who need to move work from proposal review to published chapters without bypassing ownership or editorial governance.

## Register

Product UI / dashboard / workflow tool. Design should prioritize clarity, trust, role-specific navigation, reliable tables, explicit workflow actions, and calm state feedback over decorative novelty.

## Source of truth

- `docs/architecture/flow-contract.md`
- `docs/architecture/fdm-mvp.md`
- `docs/architecture/api-contract.md`
- `docs/architecture/table-list-contract.md`

## MVP roles

- Admin: create/manage users and roles.
- Mangaka: create proposals, own series production, manage assistants, review assistant submissions first.
- Assistant: work on assigned tasks, submit files, view approved work and monthly earnings.
- Tantou Editor: review proposals/submissions/chapters, annotate, schedule/publish chapters, create at-risk reports.
- Board: governance data, proposal voting/finalization, ranking import, at-risk decisions.

## MVP workflow

Proposal → Editor review → Board vote/finalization → Series → Chapter/Page/Region/Task → Assistant submission → Mangaka review → Tantou review → Earning → Chapter publication → Ranking → At-risk report → Board decision.

## Non-MVP exclusions

Do not rebuild standalone voting sessions, admin override/force status, audit dashboard, admin payroll operations, material library, manual Tantou assignment, mobile aliases, or biweekly cadence in MVP work.

## UI principles

- Use role-specific layouts and navigation; do not show actions the current role cannot take.
- Every table/list keeps pagination, search, filters, sort, and reset state in the URL.
- Every server-state screen uses TanStack Query loading, empty, and error states.
- Every mutation is named as a workflow command, not a direct status patch.
- Every form uses React Hook Form with Zod validation that mirrors server schemas.
