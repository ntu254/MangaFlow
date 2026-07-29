import type { ClientSession } from "mongoose";
import { ChapterModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import type { AuthedRequest } from "../types.js";
import { createAuditEntry, createOutboxEvent } from "./workflow-support.service.js";

export type PagePromotionSkipReason =
  | "NO_FILE_KEY"
  | "NO_PAGE_TARGET"
  | "PAGE_NOT_FOUND"
  | "CHAPTER_MISMATCH"
  | "ALREADY_CURRENT";

export type PagePromotionResult =
  | { promoted: false; reason: PagePromotionSkipReason }
  | {
      promoted: true;
      chapterId: string;
      pageId: string;
      previousFileKey: string | null;
      fileKey: string;
      pageVersionId: string | null;
      pageVersion: number | null;
    };

/** Statuses that only describe "no artwork yet"; promotion heals them. */
const REPLACEABLE_PAGE_STATUSES = new Set(["PENDING_UPLOAD", "REVISION_REQUIRED"]);

function compact(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Seeded/placeholder pages carry a `metadata://` sentinel instead of a real asset. */
function hasRealAsset(page: any, previousFileKey: string | null) {
  if (previousFileKey) return true;
  const url = trimmed(page?.fileUrl) || trimmed(page?.imageUrl);
  return url.length > 0 && !url.startsWith("metadata://");
}

/**
 * Promote an approved assistant submission onto the chapter page it was drawn for.
 *
 * The assistant always re-renders the whole page (region tasks included), so the
 * submission file becomes the page's new artwork and the outgoing image is archived
 * into `page.versions[]` — the MaterialVersion shape from db/models.ts.
 *
 * Never throws for missing/mismatched page data: approval must not fail because a
 * task points at a page that no longer exists. It only throws on a genuine write
 * conflict, which aborts the surrounding workflow transaction.
 */
export async function promoteApprovedSubmissionToPage(
  req: AuthedRequest,
  task: any,
  submission: any,
  session: ClientSession,
): Promise<PagePromotionResult> {
  const actor = req.actor;
  if (!actor) throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");

  const skip = async (reason: PagePromotionSkipReason): Promise<PagePromotionResult> => {
    // A notes-only submission and a chapter-level task are both normal; only the
    // reasons that signal drifted data are worth an audit trail.
    if (reason !== "NO_FILE_KEY" && reason !== "NO_PAGE_TARGET") {
      await createAuditEntry(
        req,
        "PAGE_IMAGE_PROMOTION_SKIPPED",
        "submission",
        String(submission?.id ?? ""),
        {
          reason,
          taskId: task?.id ?? null,
          pageId: task?.pageId ?? submission?.pageId ?? null,
          chapterId: task?.chapterId ?? submission?.chapterId ?? null,
        },
        session,
      );
    }
    return { promoted: false, reason };
  };

  const fileKey = trimmed(submission?.fileKey);
  if (!fileKey) return skip("NO_FILE_KEY");

  const pageId = trimmed(task?.pageId) || trimmed(submission?.pageId);
  if (!pageId) return skip("NO_PAGE_TARGET");

  const chapter = (await ChapterModel.findOne({ "pages.id": pageId })
    .session(session)
    .lean()) as any;
  if (!chapter) return skip("PAGE_NOT_FOUND");
  if (task?.chapterId && String(chapter.id) !== String(task.chapterId)) {
    return skip("CHAPTER_MISMATCH");
  }
  const page = ((chapter.pages ?? []) as any[]).find((item) => item?.id === pageId);
  if (!page) return skip("PAGE_NOT_FOUND");

  const previousFileKey = trimmed(page.fileKey) || null;
  if (previousFileKey === fileKey) return skip("ALREADY_CURRENT");

  const now = nowIso();

  const existingVersions: any[] = Array.isArray(page.versions) ? page.versions : [];
  const nextVersion =
    existingVersions.reduce((max, item) => Math.max(max, Number(item?.version ?? 0)), 0) + 1;

  const outgoingVersion = hasRealAsset(page, previousFileKey)
    ? {
        id: id("pgv"),
        version: nextVersion,
        fileKey: previousFileKey ?? "",
        url: page.fileUrl ?? page.imageUrl ?? "",
        mimeType: page.mimeType,
        size: page.sizeKB,
        note: "Superseded by an approved assistant submission.",
        metadata: compact({
          fileName: page.fileName,
          status: page.status,
          imageWidth: page.imageWidth,
          imageHeight: page.imageHeight,
          aiWhitened: page.metadata?.aiWhitened,
          replacedBySubmissionId: submission.id,
          replacedByTaskId: task?.id ?? null,
        }),
        uploadedById: page.metadata?.uploadedById,
        uploadedByName: page.metadata?.uploadedByName,
        uploadedAt: page.uploadedAt ?? page.createdAt ?? now,
      }
    : null;

  const nextStatus =
    !page.status || REPLACEABLE_PAGE_STATUSES.has(String(page.status)) ? "UPLOADED" : page.status;

  const update: Record<string, unknown> = {
    $set: compact({
      "pages.$[p].fileKey": fileKey,
      "pages.$[p].fileUrl": submission.fileUrl ?? submission.imageUrl,
      "pages.$[p].imageUrl": submission.imageUrl ?? submission.fileUrl,
      "pages.$[p].fileName": submission.fileName,
      "pages.$[p].mimeType": submission.mimeType,
      "pages.$[p].sizeKB": submission.fileSizeKB,
      "pages.$[p].status": nextStatus,
      "pages.$[p].uploadedAt": now,
      "pages.$[p].updatedAt": now,
      "pages.$[p].metadata.promotedFrom": {
        submissionId: submission.id,
        submissionVersion: submission.submissionVersion ?? submission.version ?? null,
        taskId: task?.id ?? null,
        regionId: task?.regionId ?? submission.regionId ?? null,
        assistantId: submission.assistantId ?? null,
        approvedById: actor.id,
        approvedAt: now,
        previousFileKey,
        pageVersionId: outgoingVersion?.id ?? null,
      },
      updatedAt: now,
    }),
    // The submission carries no dimensions, and stale ones distort the public
    // reader's <img width height>. The old values live on in the archived version.
    // aiWhitened must go too: the studio canvas prefers it over page.fileKey and
    // would keep rendering the pre-promotion whitened image.
    $unset: {
      "pages.$[p].imageWidth": "",
      "pages.$[p].imageHeight": "",
      "pages.$[p].metadata.aiWhitened": "",
    },
  };
  if (outgoingVersion) update.$push = { "pages.$[p].versions": outgoingVersion };

  // Compare-and-swap on the fileKey we read, so a concurrent page write loses
  // instead of being silently overwritten.
  const result = await ChapterModel.updateOne({ id: chapter.id, "pages.id": pageId }, update, {
    session,
    arrayFilters: [
      previousFileKey
        ? { "p.id": pageId, "p.fileKey": previousFileKey }
        : { "p.id": pageId, "p.fileKey": { $in: [null, ""] } },
    ],
  });
  if (result.modifiedCount !== 1) {
    throw new AppError(
      409,
      "Page changed while promoting the approved submission. Refresh and try again.",
      "CONFLICT",
    );
  }

  await createAuditEntry(
    req,
    "PAGE_IMAGE_PROMOTED",
    "page",
    pageId,
    {
      chapterId: chapter.id,
      taskId: task?.id ?? null,
      submissionId: submission.id,
      previousFileKey,
      fileKey,
      pageVersionId: outgoingVersion?.id ?? null,
    },
    session,
  );
  await createOutboxEvent(
    "page.image.promoted",
    "page",
    pageId,
    {
      chapterId: chapter.id,
      seriesId: chapter.seriesId,
      taskId: task?.id ?? null,
      submissionId: submission.id,
      fileKey,
    },
    session,
  );

  return {
    promoted: true,
    chapterId: String(chapter.id),
    pageId,
    previousFileKey,
    fileKey,
    pageVersionId: outgoingVersion?.id ?? null,
    pageVersion: outgoingVersion?.version ?? null,
  };
}
