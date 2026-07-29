# Chapter revision loop

## Goal

Make a chapter returned for revision usable end to end in the MVP:

1. Mangaka can resubmit it to the assigned Editor.
2. Each accepted resubmission records the next revision round.
3. Blocking-feedback state has one source of truth: `StudioComment`.

## Scope

### Resubmit action

In `REVISION_REQUIRED`, the chapter workspace will present **Resubmit to Editor** instead of the normal first-submission action. It will reuse the existing `RESUBMIT` chapter action, which already validates ownership, materials, pages, tasks, and unresolved blocking comments before creating a fresh review snapshot and returning the chapter to `TANTOU_REVIEW`.

`SUBMIT_REVIEW` remains the action for a chapter's initial submission only.

### Revision round

The server increments `chapter.revisionRound` only after a valid `RESUBMIT` is accepted. A rejected attempt changes nothing. This preserves round 0 for a chapter that has never been returned and makes the value shown in the workspace and review timeline reliable.

### Feedback source of truth

`StudioComment` is the authoritative source for blocking revision feedback and its state (`OPEN`, `ADDRESSED`, `RESOLVED`). The workspace will derive its unresolved-feedback indicator from those comments, matching the server-side resubmission guard.

No synchronization layer will be added for `chapter.reviewNotes`; duplicating comment state has already produced divergent UI and backend behavior. Existing `reviewNotes` remain stored for compatibility, but are not used to determine readiness or completion.

## Error handling

The existing backend validation messages remain the user-facing explanation for failed resubmission: unresolved comments, missing pages/materials, or unapproved work. The UI must not expose a resubmit control if the current user is not the chapter owner.

## Checks

Add focused tests for:

1. A Mangaka addresses the blocking comment and then resubmits a revision successfully to `TANTOU_REVIEW`.
2. A successful resubmit increments `revisionRound`; a blocked resubmit does not.
3. The workspace action selection uses `RESUBMIT` in `REVISION_REQUIRED` and keeps `SUBMIT_REVIEW` for initial submission.

## Out of scope

- Migration or backfill of historic `reviewNotes`.
- A new revision/checklist data model.
- Changing proposal revision behavior.
- New dependencies or a separate workflow endpoint.
