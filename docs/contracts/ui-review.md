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
Queue reads, decision actions, mapper logic, table columns, and preview panels should be split into hooks/components/utils.
```

## Required Review Page Shape

```txt
features/review/hooks/useReviewQueue.ts
features/review/hooks/useReviewDecisionActions.ts
features/review/components/ReviewHero.tsx
features/review/components/ReviewWorkflowBoundaryCard.tsx
features/review/components/ReviewQueuePanel.tsx
features/review/components/ReviewActionListPanel.tsx
features/review/components/ReviewDecisionPanel.tsx
features/review/components/ReviewTargetPreview.tsx
features/review/components/ReviewReadinessPreview.tsx
features/review/components/ReviewStatePreview.tsx
features/review/utils/review-queue.mappers.ts
features/review/utils/review-table.columns.tsx
```

Implementation boundaries:

```txt
useReviewQueue owns queue fetch, loading, error, and refresh.
useReviewDecisionActions owns approve/revision/reject action state and success refresh.
ReviewQueuePanel renders table/loading/empty/error only.
ReviewDecisionPanel renders form + ReviewDecisionBar only.
Mappers convert backend submission data to UI rows/actions/version cards.
The route page composes panels and should not own table columns or API mapping.
```

## Done Criteria

```txt
[ ] Approve/Request Revision/Reject actions are clear.
[ ] Comment status is visible.
[ ] Unresolved comments are easy to find.
[ ] Readiness checklist identifies blockers.
[ ] Confirmation dialog exists for destructive actions.
[ ] Review queue API logic is separated from Review Page layout.
[ ] Review action mutation logic is separated from Review Page layout.
```
[//]: # (Validation section appended by MF-HIOS-004.)

## Validation

- Uses `PageShell`, `MFCard`, `MFButton`, `MFBadge`, and `ReviewDecisionBar`.
- Approve, reject, and request-revision actions are visually distinct and accessible.
- Uses design tokens for color, radius, shadow, and spacing.
- Comments, empty, loading, error, and resolved states are represented.
- UI review checklist passes.
