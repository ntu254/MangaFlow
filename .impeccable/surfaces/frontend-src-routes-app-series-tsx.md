---
version: 1
slug: "frontend-src-routes-app-series-tsx"
primary_target: "frontend/src/routes/app.series.tsx"
related_targets: ["frontend/src/features/series/list/components/series-list-page.tsx"]
---

# Surface — /app/series register

## Scope and mode
The series list (index) surface only; detail pages keep their own design. Operate mode: a
repeatable scanning-and-acting register.

## Audience / job
Mangaka and editors triage their approved series: which needs review, which is overdue,
which is waiting on an editor. The visitor decides one next action per row.

## Direction
Light register world shared with /app/proposals and the role dashboards: standard tokens
(white --card on paper), serif page title, metric strip of four tinted icon-chip tiles,
priority tiles for attention rows, search + status/workflow selects, a 9-column sortable
high-density table with muted uppercase tracked header, tinted action pills, dashed-light
empty states. Deliberately refuses the cream admin-* palette in its own markup; shared
containers may still paint cream underneath (same as the proposals page).

## Constraints
- Preserve: priority tiles, workflow filter, status filter, workload badges, proposal
  handoff lines, both top-level empty states, mobile card list + mobile pagination.
- Behavior ported 1:1 from the previous implementation (row derivation, KPI math,
  getActionTab, sorting, paging); no backend or route changes.

## Unresolved
- Detail pages (/app/series/$slug/$tab) still use the cream admin world; revisit if the
  register world should extend to them.
