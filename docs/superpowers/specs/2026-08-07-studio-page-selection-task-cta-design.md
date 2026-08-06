# Studio page-selection task CTA design

## Objective

Show the **Create Assistant Task** action whenever an owning Mangaka selects a
page with an accepted Page Assignment in an editable chapter. The action must
not depend on selecting a Region first.

## Root cause

The current Inspector has separate render branches for Page and Region
selection. The Page branch renders page metadata and Page Assignment, then
returns. The Create Assistant Task control exists only in the Region branch.
As a result, a page that is `ACCEPTED` and in `IN_PRODUCTION` has all valid
backend prerequisites but no visible create-task action when the user selects
the page itself.

## Business rules

- Page Assignment is the source of ownership for page-backed tasks.
- An owning Mangaka can create a task only when the selected page assignment is
  `PENDING` or `ACCEPTED` and the chapter is in an editable production state.
- `TANTOU_REVIEW` remains locked: the action stays visible but disabled with an
  explanation; it sends no request.
- Selecting a Region on the same eligible page must expose the same create-task
  capability. Page selection and Region selection must never disagree about
  whether creation is allowed.
- Assistant acceptance changes the page assignment to `ACCEPTED`; it does not
  require a second per-task acceptance before the Mangaka can create tasks.

## User experience

### Page selection

In the Page Inspector, place **Create Assistant Task** directly below the Page
Assignment block and before the comment composer. For an eligible page, the
button is enabled and opens the existing Create Task dialog.

For a locked Tantou Review, retain the same button in disabled state and show:

`Create Task unavailable during Tantou Review. Return the chapter to IN_PRODUCTION first.`

For a page without an eligible assignment, retain the disabled button and show:

`Assign an Assistant to this page and wait for assignment acceptance before creating a task.`

### Region selection

Keep the same action in the Region Inspector. It uses the selected region's
page assignment and the same disabled-state rules and messages as Page
selection.

## Architecture

`StudioTab` remains the sole place that derives `canCreateTaskNow` from role,
chapter status, and selected page assignment. `StudioInspector` consumes that
boolean and renders one reusable `CreateTaskAction` presentation component in
both Page and Region branches. The component receives the enabled state, lock
reason, and existing dialog-open callback; it contains no business logic.

The backend create-task route remains unchanged and continues to validate page
assignment and chapter state independently.

## Verification

Add browser coverage for an owning Mangaka selecting a page in `IN_PRODUCTION`
with an `ACCEPTED` Page Assignment:

1. The Page Inspector displays an enabled Create Assistant Task button.
2. Selecting a Region on the same page also displays an enabled button.
3. Both buttons open the existing Create Task dialog and submit the same valid
   create-task payload.
4. In `TANTOU_REVIEW`, both buttons remain visible, disabled, and display the
   identical lock message.
5. Without a Page Assignment, both buttons remain visible, disabled, and
   display the assignment prerequisite message.

## Out of scope

- Changing Page Assignment Accept/Reject behavior.
- Creating tasks without a Page Assignment.
- Altering task lifecycle transitions, submissions, or earnings.
