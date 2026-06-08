# Overview

## Current Behavior

Series screens can show real Series records but manuscript upload remains local-only. Backend submit already blocks Series submission when no Manuscript exists.

## Target Behavior

Mangaka can request a private signed upload URL for an initial manuscript on an owned Series. Backend creates new `FileAsset` and `Manuscript` records for every request and never stores base64 or file bytes in MongoDB.

## Affected Users

- Mangaka: owner can start manuscript upload.
- Assistant: no manuscript upload access.
- Editor/Board/Admin: no initial manuscript upload endpoint in this story.

## Affected Product Docs

- `docs/contracts/series-proposal.md`
- `docs/contracts/manuscript-review.md`
- `docs/architecture/security.md`

## Non-Goals

- Direct browser PUT to R2.
- Editor manuscript review decisions.
- Signed download URLs.
- File variant generation.
