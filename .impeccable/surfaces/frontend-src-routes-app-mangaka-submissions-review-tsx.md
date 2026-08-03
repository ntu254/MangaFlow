# Surface — /app/mangaka/submissions/review queue

## Scope and mode
The mangaka review queue (index list). Operate mode: a scanning-and-deciding register.

## Audience / job
Mangaka triage assistant submissions for their series: which needs a decision now
(approve / request revision / reject) and what was decided before. History must
never vanish — decisions stay findable by status.

## Direction
Light register world shared with /app/proposals, /app/series, and the dashboards:
standard tokens (white --card on paper), serif page title, metric strip of four
tinted icon-chip tiles (Needs Review / Approved / Revision / Rejected), segmented
status tabs with live counts, a sortable high-density table with muted uppercase
tracked header, tinted "Open Review" pills, amber row tint for submissions missing
a file, dashed-light empty states, compact cards on mobile. Deliberately refuses
the cream admin-* palette in its own markup.

## Constraints
- Preserve: 5 status tabs (All / Needs review = PENDING+SUBMITTED / Approved =
  MANGAKA_APPROVED+EDITOR_APPROVED+APPROVED / Revision = three REVISION_REQUESTED
  variants / Rejected), search across task/series/assistant/version, sortable
  task/assistant/version/status/submitted, PAGE_SIZE 8 pagination, refresh via
  query invalidation.
- Behavior ported 1:1 from the previous implementation; no backend or route changes.

## Unresolved
- The review workspace destination (submission-review workspace, shared with the
  editor route) is ported in a separate surface brief; open "Open Review" lands
  in the same light world.
- Desktop pagination/empty state still render through shared components that paint
  admin tokens internally; shared-component cleanup would make the register world
  fully cream-free.
