# Product - MangaFlow

MangaFlow is an operational workflow app for manga production, from creator
proposal through editorial review, Board approval, studio task execution, and
publication scheduling.

## Register

Product UI. Design serves repeat operational work for Mangaka, Assistants,
Tantou Editors, Board members, and Admin users.

## Core Jobs

- Show each role the work they can act on now.
- Keep production state visible without exposing every backend detail.
- Make review, deadline, and blocking risks easy to scan.
- Preserve role boundaries: UI affordances should match backend ownership and
  membership rules.

## Design Stance

- Quiet, dense, editorial operations UI.
- Prefer tables, queues, filters, sorting, and pagination for repeated work.
- Use cards only for focused summaries, empty states, or small priority lanes.
- Keep actions explicit and scoped to the current user's workflow.
- Use existing tokens from `src/styles.css`: Instrument Sans, EB Garamond,
  editorial paper surface, admin navy, role accents, and 6px radius.

## Screens To Optimize

- Series list and production register.
- Proposal review and Board queues.
- Studio task workspaces.
- Admin monitoring tables.
