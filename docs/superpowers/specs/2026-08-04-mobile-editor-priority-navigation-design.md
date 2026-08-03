# Mobile Editor Priority Navigation Design

## Goal

Remove the functional overlap between the first two Editor tabs while retaining
one authenticated inbox source and a fast mobile path to urgent work.

## Approved navigation

| Tab | Purpose | Included work |
| --- | --- | --- |
| **Priority** | Work an Editor should act on first | Inbox items with `priority.level` `URGENT` or `HIGH` |
| **Reviews** | The complete editorial review workspace | `PROPOSAL_REVIEW`, `CHAPTER_REVIEW`, and `COMMENT_REVIEW` |
| **Publish** | Publication operations | `PUBLICATION` |
| **History** | Read-only completed activity | Existing Editor history endpoint |
| **Notifications** | Authenticated notices | Existing notifications endpoint |

## Data and interaction rules

- The shell keeps one `GET /editor/inbox` React Query read. These tabs are
  client-side views of that same, backend-ordered payload; no new endpoint,
  client sorting, or client-owned workflow eligibility is introduced.
- An item may appear in both Priority and its functional workspace. This is
  intentional: Priority answers “what first”; Reviews and Publish answer
  “which work area”. The UI labels Priority as a focused work list, not a
  mutually exclusive queue.
- `NORMAL` items do not appear in Priority. When no `URGENT` or `HIGH` item is
  present, show: “No priority work right now. Review your full workspaces for
  planned tasks.”
- Reviews owns all three editorial review types, including comments. Publish
  owns only publication work. Today is removed as a user-facing Editor label.
- Existing loading, safe diagnostic, retry, pull-to-refresh, and empty-state
  behaviour remain unchanged.

## Acceptance criteria

1. The Editor bottom navigation labels the first tab **Priority**, not Today.
2. Priority only renders urgent/high work without reordering the source list.
3. Reviews includes proposal, chapter, and comment review work; Publish only
   includes publication work.
4. Tests demonstrate the same inbox instance drives all three views and that
   normal-priority work is omitted only from Priority.

## Non-goals

- No new priority ranking algorithm, deadline calculation, or backend API.
- No change to Board tabs in this scope.
