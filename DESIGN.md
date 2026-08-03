# Design - MangaFlow

A compact app design lock for role dashboards and workflow screens. Keep this file small:
it defines the product UI stance, not a full brand manual.

## Genre
Modern-minimal operational workbench.

## App Macrostructure
- Dashboards: role-first command surface with a concise header, KPI row, focus queue, and secondary context.
- Registers and queues: searchable, sortable, paginated tables on desktop with compact cards on mobile.
- Detail pages: primary work area first, secondary metadata in a supporting rail or section.

## Theme
- Use the existing MangaFlow tokens: `--admin-page`, `--admin-surface`, `--admin-ink`,
  `--admin-muted`, `--admin-border`, `--admin-navy`, and role accent tokens.
- App screens should stay calm and information-dense. Accent color is for status, focus,
  and primary actions only.

## Register World (light surfaces)
- The series register (`/app/series`), proposals register, and role dashboards share one
  light visual world: standard tokens (white `--card` surfaces, paper `--background`,
  neutral `--border`, ink `--primary`), a serif page title, a metric strip of tinted
  icon-chip tiles, and a high-density table with a muted uppercase tracked header.
- Action buttons on these surfaces are ink primaries or tinted pills
  (`bg-primary/10` + `border-primary/20`); empty states are dashed-light blocks.
- Register surfaces deliberately keep the cream `admin-*` tokens out of their own
  markup; shared containers (`Surface`, `DataTable`, `DataPagination`) may still
  render the cream surface underneath, matching the proposals page exactly.
- The submission review workspace (shared by the mangaka and editor review routes)
  is part of this world: serif page title with a status pill, white cards with
  serif card titles, tinted decision buttons (ink approve / amber revision /
  destructive reject) gated behind a reviewable state, amber/rose notice boxes,
  and a dashed-light missing state. Before/after comparison, submission note,
  review feedback, task comments, and version history live in the same white-card
  grammar.

## Typography
- Display: existing serif, normal style.
- Body: existing sans, normal style.
- Dashboard headings should be direct and compact. Avoid decorative italics in app headers.

## Interaction Rules
- Tables with operational decisions need search, useful filters, sortable columns, and paging.
- Show only data that helps the actor decide the next action.
- Placeholder or demo routes must be labeled clearly or removed from the authenticated workflow.
- Primary action buttons should point to the actor-owned route, not another actor's workflow.

## Actor Dashboards
- Admin: operations control, user/system health, governance backlog, recovery warnings.
- Mangaka: assistant submissions, active production, deadlines, proposal entry point.
- Assistant: assigned tasks, revisions, submission history, earnings summary.
- Editor: review focus, deadline risk, publish-ready chapters, recent editorial activity.
- Board: governance queue, vote finalization, tie-breaks, at-risk reviews.
