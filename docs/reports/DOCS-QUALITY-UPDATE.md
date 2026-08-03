# Documentation Quality Update

This revision reconciles the canonical MangaFlow documentation after the Admin-scope
change. It does not modify application code.

## Final canonical clarifications

- Admin is limited to user-account lifecycle and Board Chair designation assignment.
- The owning Mangaka retains Chapter ownership and canonically initiates
  `START_DRAFT`; Assistants work only through Region → Task → Submission.
- Board vote tallies are provisional; only Board Chair close finalizes a Proposal.
- VotingSession tie/completion wording uses the session eligible-voter snapshot; the
  course-project Board roster is capped at five with a fixed threshold of three.
- Manual Series creation is a current pre-production path and cannot bypass Proposal approval.
- Material readiness separates confirmed status/file/scope checks from the complete
  version-integrity rule that still needs verification.
- Historical workflow records do not imply an Admin audit module.

## Current application-code status (2026-07-28)

The current branch resolves FLOW-GAP-01 through FLOW-GAP-08. CT-11 removes the
Admin workflow boundary gap; CT-13 through CT-16 enforce designation uniqueness,
live Board electorate snapshots, removal of `MARK_READY`, and separation of
Page mutation from Tantou approval. `docs/business-flows/INDEX.md` is the sole
canonical entry point; root flow documents are historical references.

## Open verification points

- Confirm enforcement of the five-user active Board cap; do not introduce dynamic
  quorum configuration for this course scope.
