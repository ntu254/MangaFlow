# Exec Plan

## Goal

Implement the first safe system-role assignment path so pending synced users can
be reviewed and activated by an admin.

## Scope

In scope:

- Admin-only role review API.
- User list filters for `systemRole: null`, `requestedSystemRole`, and status.
- Assign `systemRole` to a user.
- Suspend and reactivate a user.
- Minimal frontend admin review surface or placeholder controls.
- Unit and integration tests for admin-only authorization and role/status
  transitions.

Out of scope:

- Series memberships.
- Detailed dashboard design.
- Invitation emails.
- Storage permissions.
- Payroll, board, or workflow-domain authorization.

## Risk Classification

Risk flags:

- Authorization.
- Data model.
- Audit/security.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Authorization.
- Audit/security.

Lane:

- high-risk

## Work Phases

1. Record first-admin bootstrap decision.
2. Update product docs with accepted role assignment behavior if needed.
3. Add tests for admin-only role/status changes.
4. Implement backend role assignment service and routes.
5. Add minimal client admin review flow.
6. Run unit, integration, platform, and browser smoke validation.
7. Update durable proof, story evidence, and trace.

## Stop Conditions

Pause for human confirmation if:

- A self-service first-admin bootstrap path becomes necessary.
- The story would let any non-admin assign roles.
- Existing users would need a destructive migration.
- Validation cannot prove forbidden access for non-admin users.
- The work expands into full series-level permissions.
