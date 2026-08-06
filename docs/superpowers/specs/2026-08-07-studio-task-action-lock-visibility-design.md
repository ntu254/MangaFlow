# Studio task-action lock visibility design

## Objective

Make the Mangaka Studio UI explain why task creation is unavailable during
`TANTOU_REVIEW`, instead of making the action appear to be missing. Keep the
existing chapter-content lock intact and prevent assignment release from
contradicting that locked state.

## Context

After an Assistant accepts a Page Assignment, the page correctly becomes
`ACCEPTED`. A Mangaka then sees the Page Assignment controls. However, when the
chapter is in `TANTOU_REVIEW`, the Studio currently removes Create Assistant
Task entirely because task creation is locked. This looks like a missing UI
feature even though the backend correctly rejects content changes during review.

## Business rules

- `TANTOU_REVIEW` locks task creation and Page Assignment release while the
  chapter is in this state.
- A Page Assignment accepted before the review remains visible as `ACCEPTED`;
  it is not released or reassigned by entering review.
- The chapter must return to `IN_PRODUCTION` (or another backend-approved
  editable production state) before Mangaka can create a task or release the
  page.
- Assistant dashboard Accept/Reject behavior is unchanged. An Assistant may
  resolve a Page Assignment invitation only while the backend permits the
  transition; this spec does not add a new transition.

## User experience

### Create Assistant Task

The Inspector always renders the **Create Assistant Task** button for a Mangaka
who owns the series and has a selected page. The button is:

- enabled only when the current page has a `PENDING` or `ACCEPTED` assignment,
  the chapter is editable, and all existing create-task prerequisites hold;
- disabled during `TANTOU_REVIEW`; and
- accompanied by visible helper text and a button tooltip:
  `Create Task unavailable during Tantou Review. Return the chapter to IN_PRODUCTION first.`

The UI must not send a create-task request while disabled.

### Page Assignment

The existing accepted Page Assignment remains visible. The **Release page**
button remains present for an owning Mangaka but is disabled during
`TANTOU_REVIEW`, with this explanation:
`Page Assignment changes are unavailable during Tantou Review.`

Outside `TANTOU_REVIEW`, the existing release rules apply: release is blocked
when open tasks or pending editorial work exist.

## Architecture

Use one computed chapter editability value in `StudioTab` and pass a small,
explicit lock-state prop into `StudioInspector` and `PageAssignmentBlock`. The
Inspector owns presentation (disabled controls, tooltip/title, helper copy);
the existing backend remains the enforcement boundary.

Add a server-side lock guard to `applyPageAssignmentAction` for `RELEASE` so
direct API calls cannot bypass the Studio UI. The guard loads the page's chapter
and uses the same canonical `assertChapterContentUnlocked` rule used by task
creation.

## Error handling

- A direct Release request during `TANTOU_REVIEW` returns the existing chapter
  lock error code and a clear message, rather than releasing the assignment.
- If a stale frontend renders an enabled button, the backend remains
  authoritative and returns the conflict.
- If assignment data changes while the UI is open, the existing mutation error
  handling refetches the Studio state and displays the API message.

## Verification

Add coverage for:

1. Mangaka sees Create Assistant Task disabled, with the lock explanation,
   during `TANTOU_REVIEW`.
2. Mangaka sees Release page disabled, with its lock explanation, during
   `TANTOU_REVIEW`.
3. The same controls become enabled after the chapter returns to
   `IN_PRODUCTION` and all ordinary prerequisites are satisfied.
4. `POST /api/studio/pages/:pageId/assignment/actions/RELEASE` returns a
   chapter-review-lock error during `TANTOU_REVIEW` and leaves the assignment
   unchanged.
5. Existing Page Assignment inbox Accept/Reject and task creation tests continue
   to pass for editable chapters.

## Out of scope

- Allowing task creation or Page Assignment release in `TANTOU_REVIEW`.
- Changing Assistant Page Assignment acceptance behavior.
- Altering task, submission, earning, or editorial approval state machines.
