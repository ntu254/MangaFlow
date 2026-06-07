# UI Contract: Series and Chapter Screens

## Applies To

```txt
My Series
Create Series
Series Detail
Production Team
Manuscript Versions
Chapter List
Chapter Detail
Page List
```

## Required Components

```txt
PageShell
MFCard
MFBadge
MFButton
MFUploadBox
MFPagePreviewCard
ChapterProgressCard
StatusBadge
```

## Rules

```txt
Series cards must show status, title, genre, publication type.
Chapter creation action must reflect approval gate.
If Series is not approved, show disabled action with reason.
Production Team screen must clarify that Assistant is eligible for task assignment, not full-series access.
```

## Done Criteria

```txt
[ ] Series approval state is visible.
[ ] Chapter creation disabled state is clear.
[ ] Upload constraints are shown near upload zone.
[ ] Cards use shared components.
```
[//]: # (Validation section appended by MF-HIOS-004.)

## Validation

- Uses `PageShell`, `MFCard`, `MFButton`, `MFBadge`, `MFProgress`, and `MFPagePreviewCard`.
- Chapter creation action reflects the Board approval gate.
- Uses design tokens for color, radius, shadow, and spacing.
- Mobile layout supports management/review without heavy canvas assumptions.
- UI review checklist passes.
