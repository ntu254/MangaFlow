# CT-11 / FLOW-GAP-04 — Admin Scope Completion

Status: superseded by the canonical role baseline.

Admin remains an account and system-configuration role. Workflow ownership is now:

| Capability | Canonical actor |
|---|---|
| Tantou assign/remove | Owning Mangaka |
| Tantou target | Active normal Editor |
| Claim release | Editor holding the claim |
| Proposal archive | Owning Mangaka |
| Board session control | Board Chair |
| Tie handling | Automatic fresh Board re-vote |

No special Editor designation, weighted tie vote, or reassignment command is part of the
current API. Historical records are read-only and legacy data is handled by the migration
script `backend/src/scripts/migrate-remove-legacy-editor-designation.ts`.
