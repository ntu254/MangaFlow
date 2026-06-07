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
