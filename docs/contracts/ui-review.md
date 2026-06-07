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
```

## Done Criteria

```txt
[ ] Approve/Request Revision/Reject actions are clear.
[ ] Comment status is visible.
[ ] Unresolved comments are easy to find.
[ ] Readiness checklist identifies blockers.
[ ] Confirmation dialog exists for destructive actions.
```
[//]: # (Validation section appended by MF-HIOS-004.)

## Validation

- Uses `PageShell`, `MFCard`, `MFButton`, `MFBadge`, and `ReviewDecisionBar`.
- Approve, reject, and request-revision actions are visually distinct and accessible.
- Uses design tokens for color, radius, shadow, and spacing.
- Comments, empty, loading, error, and resolved states are represented.
- UI review checklist passes.
