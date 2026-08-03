import { PublicationModel, SeriesModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import type { AuthedRequest } from "../types.js";
import { audit, notifyMany } from "./audit.service.js";
import { normalizePublicationType } from "./proposal-lifecycle.service.js";

function assertPublishableSeries(series: any) {
  if (["CANCELLED", "COMPLETED"].includes(String(series?.status))) {
    throw new AppError(409, "Series is not publishable.", "SERIES_NOT_PUBLISHABLE");
  }
}

function requirePublicationType(series: any, message: string) {
  const publicationType = normalizePublicationType(series?.publicationType);
  if (!publicationType) {
    throw new AppError(409, message, "PUBLICATION_TYPE_REQUIRED");
  }
  return publicationType;
}

export async function scheduleChapterPublication(
  req: AuthedRequest,
  chapter: any,
  series: any,
  chapterId: string,
  payload: any,
) {
  if (!payload.scheduledAt) {
    throw new AppError(400, "scheduledAt is required.", "VALIDATION_ERROR");
  }
  const scheduledAt = new Date(payload.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    throw new AppError(400, "scheduledAt must be a valid future date/time.", "VALIDATION_ERROR");
  }
  const publicationType = requirePublicationType(
    series,
    "Series publicationType is required before scheduling.",
  );
  assertPublishableSeries(series);
  await PublicationModel.findOneAndUpdate(
    { chapterId },
    {
      $set: {
        seriesId: chapter.seriesId,
        chapterId,
        status: "SCHEDULED",
        scheduledAt,
        scheduledById: req.actor?.id,
        updatedAt: nowIso(),
      },
      $setOnInsert: { id: id("pub"), createdAt: nowIso() },
    },
    { upsert: true, returnDocument: "after" },
  );
  await audit(req, "PUBLICATION_SCHEDULED", "publication", chapterId, {
    scheduledAt: scheduledAt.toISOString(),
    publicationType,
  });
  await notifyMany([
    {
      userId: series.authorId,
      kind: "PUBLICATION_SCHEDULED",
      title: "Publication scheduled",
      message: `${chapter.title} is scheduled for publication.`,
    },
  ]);
  return { scheduledAt, publicationType };
}

export async function postponeChapterPublication(
  req: AuthedRequest,
  chapterId: string,
  fromStatus: string,
) {
  const publication = await PublicationModel.findOne({ chapterId, status: "SCHEDULED" }).lean();
  if (!publication) {
    throw new AppError(409, "No scheduled publication exists.", "PUBLICATION_NOT_SCHEDULED");
  }
  await PublicationModel.updateOne(
    { chapterId },
    {
      $set: {
        status: "CANCELLED",
        postponedById: req.actor?.id,
        postponedAt: new Date(),
        updatedAt: nowIso(),
      },
    },
  );
  await audit(req, "CHAPTER_POSTPONED", "chapter", chapterId, {
    fromStatus,
    toStatus: "READY_FOR_PUBLICATION",
  });
}

export async function publishChapter(
  req: AuthedRequest,
  chapter: any,
  series: any,
  chapterId: string,
  fromStatus: string,
  allowEarly = false,
) {
  const publication = await PublicationModel.findOne({ chapterId, status: "SCHEDULED" }).lean();
  if (!publication) {
    throw new AppError(
      409,
      "Publication must be scheduled before publishing.",
      "PUBLICATION_NOT_SCHEDULED",
    );
  }
  const scheduledAt = new Date((publication as any).scheduledAt);
  const isEarly = scheduledAt.getTime() > Date.now();
  if (isEarly && !allowEarly) {
    throw new AppError(409, "Publication scheduledAt has not arrived.", "PUBLICATION_NOT_DUE");
  }
  assertPublishableSeries(series);
  const publishedAt = new Date();
  await PublicationModel.updateOne(
    { chapterId },
    {
      $set: {
        status: "PUBLISHED",
        publishedAt,
        publishedById: req.actor?.id,
        updatedAt: nowIso(),
      },
    },
  );
  await SeriesModel.updateOne(
    { id: chapter.seriesId },
    {
      $set: {
        visibility: "PUBLIC",
        publishedAt: series.publishedAt ?? publishedAt,
        updatedAt: nowIso(),
      },
    },
  );
  await audit(req, "CHAPTER_PUBLISHED", "chapter", chapterId, {
    fromStatus,
    toStatus: "PUBLISHED",
    publishedEarly: isEarly,
    scheduledAt: scheduledAt.toISOString(),
  });
  await notifyMany([
    {
      userId: series.authorId,
      kind: "CHAPTER_PUBLISHED",
      title: "Chapter published",
      message: `${chapter.title} has been published${isEarly ? " early" : ""}.`,
    },
  ]);
  return publishedAt;
}

export { assertPublishableSeries, requirePublicationType };
