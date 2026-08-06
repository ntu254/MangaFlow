# Studio page-assignment reliability design

## Objective

Make the Assistant page-assignment flow explicit and reliable, while fixing the two
Studio regressions found during review:

1. Creating a task sends an unsupported `status` field.
2. A hard reload can leave the Konva canvas at its 800 x 600 fallback size.

The resulting workflow is: accept team, receive a page-assignment invitation,
accept or reject that page, then work on every task for that page.

## Scope

This change covers the web frontend and the existing page-assignment API. It does
not alter the task submission, Mangaka review, Editor approval, or earning flows.

## Business rules

### Team membership and page ownership

- An Assistant must first accept a Series invitation. That creates an active series
  membership and grants Studio access for the series.
- Only an active Assistant member may be selected in Page Assignment.
- A Mangaka assigns one Assistant to a Page. The initial assignment state is
  `PENDING`.
- `PENDING` is not task-ready. It is an invitation for the selected Assistant to
  accept or reject the page.
- The selected Assistant can accept or reject only their own pending assignment.
  Rejection requires a reason.
- An accepted assignment is the authorization boundary for every open task on that
  page. There is no separate per-task acceptance for page-backed tasks.

### Task behavior

- Task creation never accepts a client-supplied lifecycle `status`; the server owns
  the initial `TODO` state.
- Mangaka may create a task only while the page assignment is `PENDING` or
  `ACCEPTED`.
- When the Assistant accepts a Page Assignment, all non-terminal tasks on that page
  receive `assignmentStatus: ACCEPTED` and can be started.
- Tasks created after Page Assignment is accepted are created with
  `assignmentStatus: ACCEPTED`.
- When the Assistant rejects the Page Assignment, all non-terminal tasks on that
  page receive `assignmentStatus: REJECTED` and the rejection reason.

## User experience

### Assistant dashboard

Add a **Page assignments** panel alongside Team Invitations.

Each pending assignment card shows the series, chapter/page reference, Mangaka,
assignment time, and a count of current page tasks. It offers:

- **Accept page**: confirms ownership of the page and unlocks all of its open tasks.
- **Reject**: requires a reason and returns the page to the Mangaka for reassignment.

The panel contains only assignments for the authenticated Assistant in `PENDING`.
An empty panel is hidden or shows a concise empty state. It does not show tasks from
pages owned by other Assistants.

### Studio canvas

The existing Inspector remains a secondary place to accept or reject an assignment.
Dashboard and Studio call the same page-assignment endpoint and invalidate the same
queries, so the result is identical regardless of entry point.

The canvas must observe its actual host element whenever that element mounts. A
direct page reload must render the image fitted to the available canvas pane, not the
initial 800 x 600 fallback.

## Technical design

### Create-task contract

Remove `status` from the `useCreateStudioTaskMutation` input and from the caller in
`StudioTab`. Keep backend strict validation unchanged, so lifecycle mutations remain
server-controlled.

### Canvas sizing

Replace the one-time `useLayoutEffect(..., [])` measurement with a lifecycle that
starts when the canvas DOM node exists. Prefer a callback ref that:

1. disconnects an existing `ResizeObserver`;
2. observes the newly mounted element;
3. updates width and height immediately and on every resize; and
4. disconnects on unmount.

This handles the direct `/studio` reload path where `StudioTab` first renders an
empty/loading state and the canvas mounts only after chapter data arrives.

### Page-assignment inbox

Expose a scoped read model for the current Assistant's pending Page Assignments.
The response contains only page references the actor owns, with the display metadata
needed by the dashboard (series title, chapter number/title, page index, Mangaka
name, assigned time, and open-task count).

Use the existing canonical commands:

- `POST /studio/pages/:pageId/assignment/actions/ACCEPT`
- `POST /studio/pages/:pageId/assignment/actions/REJECT`

The server remains the source of truth for authorization, transition guards, and
task-status mirroring. The dashboard never updates task state locally.

## Error handling

- A missing or stale assignment returns the existing conflict/not-found response;
  the dashboard refetches its assignment list and displays the mapped API message.
- Reject without a reason remains a validation error.
- Team membership missing or inactive prevents both assignment selection and access
  to the Assistant's assignment inbox.
- Repeated accept/reject of an already processed assignment returns a conflict rather
  than silently changing state.

## Verification

Add automated coverage for:

1. Create task request omits `status` and is accepted by the strict backend schema.
2. Direct-load/reload of the Series Studio route measures the mounted canvas rather
   than using 800 x 600.
3. Assistant accepts team, is shown as assignable, then receives a pending page
   assignment in the dashboard.
4. Assistant accepts the page from the dashboard; all existing open tasks become
   accepted and can start.
5. Assistant rejects with a reason; all existing open tasks mirror the rejection.
6. Another Assistant cannot view or action that assignment.

## Out of scope

- Automatic acceptance of page assignments when joining a team.
- Per-task invitations for page-backed tasks.
- Redesigning the task reassignment aggregate or the wider notification system.
