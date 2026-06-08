# Exec Plan

## Goal

Add initial manuscript upload-init support with private signed URL and owner-only authorization.

## Scope

In scope:

- `POST /api/series/:seriesId/manuscripts/uploads`.
- Owner Mangaka authorization.
- Create `FileAsset` + `Manuscript` records without overwriting prior versions.
- Frontend upload panel requests signed URL and displays result boundary.
- Unit tests for owner allowed and non-owner blocked.

Out of scope:

- Direct upload transfer to R2 from UI.
- File download URLs.
- Manuscript review workflow.

## Risk Classification

Risk flags:

- Authorization.
- File access/security.
- Public API contract.
- Data model write.
- External storage boundary.

Hard gates:

- Signed URL/file access.

## Work Phases

1. Discovery.
2. Design.
3. Implementation.
4. Verification.
5. Harness update.
6. Commit/push/merge to `new`.

## Stop Conditions

Pause if file download, original download policy, or external storage credential handling changes.
