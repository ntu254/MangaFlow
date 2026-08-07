# Studio stale region discard on approval design

## Objective

Stop Studio from redrawing speech-bubble regions and from rendering a stale
page image once a Mangaka approves an Assistant's submission. The submitted
file becomes the page's new image; any region detected or marked against the
prior image is now stale and must not be shown as an active overlay, and the
canvas must actually display the new artwork instead of a cached render of
the old one.

## Context

`applyApprovedSubmissionToPage` already promotes an approved submission's file
onto the `ChapterPage` (`imageUrl`/`fileUrl`/`fileKey`) as soon as a Mangaka
approves it. Nothing in that path touched `StudioRegion` documents. AI-detected
regions (`metadata.source: "ai"`) and manually confirmed regions from the prior
image kept their `DETECTED`/`CONFIRMED` status and kept rendering on the Konva
canvas and in the "AI Detect" layer list, even though the new (already
cleaned/lettered) image has no matching bubbles at those coordinates.

Per `docs/business-flows/14-regions.md`, regions in the current design carry no
task assignment, submission, or earning of their own — they are reference
markers only. There is exactly one assistant workflow per page (the Page
Assignment), and each approved submission's file represents the complete
current state of the page. That makes it safe to invalidate every region on a
page the moment its image changes, rather than trying to reconcile which
individual region the approved work addressed.

## Business rules

- Approving a submission that carries a file (`fileKey`/`fileUrl`/`imageUrl`)
  and replaces a page's image soft-discards every non-`DISCARDED` `StudioRegion`
  on that page in the same transaction as the image swap.
- Discarding is a status change (`status: "DISCARDED"`), not a delete. Region
  history remains queryable for audit; only the rendered overlay disappears.
- This applies uniformly to AI-detected and Mangaka-confirmed regions — the
  source of the region does not matter once the underlying image is gone.
- Re-running AI bubble detection on the new image is unaffected: it already
  deletes and recreates its own `metadata.source: "ai"` regions for the page.
- If the page previously had an AI-whitened render cached
  (`page.metadata.aiWhitened`, set by the "whiten bubbles" AI action), that
  cache is cleared when a submission's file is promoted onto the page. The
  Studio canvas prefers `metadata.aiWhitened` over `fileKey`/`fileUrl`
  whenever it exists, so an uncleared cache would keep showing the old
  artwork indefinitely even though every other Studio view (regions, task
  status) had already moved on.

## Architecture

`backend/src/services/task-submission.service.ts`, inside
`applyApprovedSubmissionToPage`, after the `ChapterModel.updateOne` that swaps
the page's image fields, adds one `StudioRegionModel.updateMany` scoped to the
page and to the same Mongo session/transaction:

```ts
await StudioRegionModel.updateMany(
  { pageId: String(pageId), status: { $ne: "DISCARDED" } },
  { $set: { status: "DISCARDED", updatedAt: now } },
  { session },
);
```

The same function's page-mapping step also strips `metadata.aiWhitened` from
the page being updated, before writing the new `fileKey`/`fileUrl`/`imageUrl`:

```ts
const { aiWhitened: _staleAiWhitened, ...restMetadata } = page.metadata ?? {};
return { ...page, fileKey, fileUrl, imageUrl, metadata: restMetadata, ... };
```

This runs in the same `ChapterModel.updateOne` as the rest of the page-image
swap, so there is no window where the page has a new `fileKey` but a stale
`aiWhitened` cache still wins in the canvas.

No new API surface is introduced. The existing submission-review mutation
already invalidates `studioKeys.all` on the frontend, which prefix-matches the
`studioKeys.regions(...)` query, so the Studio canvas re-fetches regions after
approval without any frontend query-key change.

On the frontend, the Konva canvas already filters out `status === "DISCARDED"`
regions before rendering (`konva-page-canvas.tsx`), so discarded regions stop
appearing on the canvas automatically. The "AI Detect" tab in
`page-layers-panel.tsx` did not previously filter by status; it now excludes
`DISCARDED` regions from both its list and its count, so the layer list and the
canvas agree.

## Error handling

- If a submission's approval has no file to promote (`applyApprovedSubmissionToPage`
  returns early), no regions are discarded — nothing about the page changed.
- If the page has no regions, `updateMany` is a no-op.
- The discard runs inside the same transaction as the image swap, so a failure
  in one rolls back the other; a page's image is never left updated while its
  stale regions remain active, or vice versa.

## Verification

Add coverage for:

1. Approving a submission with a file replaces the page image and marks all of
   that page's pre-existing regions (AI-detected and manually confirmed) as
   `DISCARDED`.
2. A region already `DISCARDED` is left untouched (no redundant write) by a
   later approval on the same page.
3. Regions on a different page are unaffected by an approval on this page.
4. The Studio canvas does not render `DISCARDED` regions; the "AI Detect" layer
   list and its count exclude them too.
5. A page with a cached AI-whitened render has that cache cleared once a
   submission's file is promoted onto the page; `fileKey`/`fileUrl` reflect
   the newly approved file.

## Out of scope

- Deleting `StudioRegion` documents outright (soft-discard only, for audit).
- Reconciling which specific region an approved submission addressed —
  region-to-task linkage is already retired per `docs/business-flows/14-regions.md`.
- Changing AI bubble-detection's own delete-and-recreate behavior.
