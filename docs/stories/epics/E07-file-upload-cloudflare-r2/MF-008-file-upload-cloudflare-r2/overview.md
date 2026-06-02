# MF-008 File Upload & Cloudflare R2

## Goal

Enable MangaFlow to accept real manuscript and chapter page uploads, store file
metadata as `FileAsset` records, and support private S3-compatible storage with
a local filesystem fallback for development.

## Contract

- Backend supports S3-compatible storage configuration for Cloudflare R2 and
  MinIO.
- If S3 is not configured, uploads fall back to `server/uploads/` and are served
  from `/uploads`.
- Page uploads accept multipart image files, store originals, generate AI,
  preview, and thumbnail variants with `sharp`, create `Page` records, and
  create related `FileAsset` metadata.
- Manuscript uploads accept multipart files, store originals, create
  `Manuscript` records, and create related `FileAsset` metadata.
- File metadata APIs return signed/resolved URLs for client rendering.

## Current Scope

Implemented as the backend/API foundation and existing client picker wiring.
Full browser click-through upload remains deferred until a signed-in Mangaka
series/chapter fixture is available.

