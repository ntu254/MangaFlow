# UI Contract: Admin UI

## Applies To

```txt
Admin Dashboard
User Management
Board Member Management
Task Type Config
Task Rate Config
Storage Monitor
Audit Logs
System Health
```

## Required Components

```txt
PageShell
MFCard
MFTable
MFBadge
MFButton
MFDialog
StatusBadge
```

## Rules

```txt
Admin UI can be data-dense but must not break visual style.
Tables must be wrapped in MFCard.
Danger actions require confirmation.
System health uses clear status badges.
```

## Done Criteria

```txt
[ ] Tables use consistent spacing and badges.
[ ] Create/Edit dialogs use shared form components.
[ ] Danger actions confirm before applying.
[ ] Empty/loading/error states exist.
```
[//]: # (Validation section appended by MF-HIOS-004.)

## Validation

- Uses `PageShell`, `MFCard`, `MFButton`, `MFBadge`, and shared admin dashboard components.
- Admin UI does not imply Admin can override Board decisions.
- Uses design tokens for color, radius, shadow, and spacing.
- Empty, loading, error, and confirmation states are represented.
- UI review checklist passes.
