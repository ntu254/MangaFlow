# UI Contract: Review, Comment, and Approval UI

## Applies To

```txt
Manuscript Review
Submission Review
Editor Final Review
Comment Resolve
Publication Readiness
```

## Required Components

```txt
ReviewDecisionBar
CommentThread
SubmissionVersionList
PublicationReadinessChecklist
MFButton
MFCard
MFBadge
```

## Rules

```txt
Review decisions must be visually clear.
Danger actions require confirmation.
Comment lifecycle must show current state.
Publication readiness must show pass/fail checklist.
Editor final approval must be visually distinct from Mangaka internal approval.
Review Queue page must not become a single monolithic route component.
Queue reads, decision panels, and backend-to-UI mapper logic should be split before adding more review surfaces.
```

## Required Review Page Shape

MF-HIOS-060 defines the next safe extraction slice:

```txt
features/review/hooks/useReviewQueue.ts
features/review/components/ReviewQueuePanel.tsx
features/review/components/ReviewDecisionPanel.tsx
features/review/utils/review-queue.mappers.ts
```

Implementation boundaries:

```txt
useReviewQueue owns queue fetch, loading, error, and refresh.
ReviewQueuePanel renders table/loading/empty/error/retry only.
ReviewDecisionPanel renders submission id, reviewer note, final approval toggle, decision preview, and ReviewDecisionBar.
review-queue.mappers.ts converts backend submissions to queue rows, action items, and submission version cards.
The route page composes panels and should not own queue API state or submission-to-UI mapping.
No API behavior, endpoint path, payload shape, permission check, or workflow rule changes are allowed in this componentization slice.
```

Future optional review extractions should be story-scoped before implementation, such as:

```txt
ReviewHero
ReviewWorkflowBoundaryCard
ReviewActionListPanel
ReviewTargetPreview
ReviewReadinessPreview
ReviewStatePreview
review-table.columns.tsx
useReviewDecisionActions
```

## Done Criteria

```txt
[ ] Approve/Request Revision/Reject actions are clear.
[ ] Comment status is visible.
[ ] Unresolved comments are easy to find.
[ ] Readiness checklist identifies blockers.
[ ] Confirmation dialog exists for destructive actions.
[ ] Review queue API logic is separated from Review Page layout.
[ ] Submission-to-UI mapper logic is separated from Review Page layout.
[ ] Review decision panel is separated without changing action behavior.
```
[//]: # (Validation section appended by MF-HIOS-004.)

## Validation

- Uses `PageShell`, `MFCard`, `MFButton`, `MFBadge`, and `ReviewDecisionBar`.
- Approve, reject, and request-revision actions are visually distinct and accessible.
- Uses design tokens for color, radius, shadow, and spacing.
- Comments, empty, loading, error, and resolved states are represented.
- UI review checklist passes.
- Client lint/build pass for componentization stories.
