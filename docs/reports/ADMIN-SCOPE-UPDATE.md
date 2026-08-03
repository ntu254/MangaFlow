# Admin Scope Documentation Update

Status: implemented under the current MangaFlow baseline.

Admin owns account administration, Board Chair designation, rate-table management,
read-only dashboards, managed notifications, and non-production demo maintenance.
Admin is not a workflow actor.

Canonical ownership rules:

- Tantou assignment/removal is performed only by the owning Mangaka.
- Tantou is an active normal `EDITOR` membership; exactly one is active per Series.
- Claim release is performed only by the Editor holding the claim.
- Proposal archive is performed only by the owning Mangaka.
- Board ties close the current session and automatically open a fresh Board re-vote.

Legacy editor-designation fields are removed from the live model and are handled only by
the explicit data migration script. Existing records are migrated to normal Editor users.
