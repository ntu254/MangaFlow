import { ChapterModel, PublicationModel, SeriesModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import type { AuthedRequest } from "../types.js";
import type { ClientSession } from "mongoose";
import { audit, notifyMany, systemActor } from "./audit.service.js";
import { normalizePublicationType } from "./proposal-lifecycle.service.js";

function assertPublishableSeries(series: any) {
  if (["CANCELLED", "COMPLETED", "ARCHIVED"].includes(String(series?.status))) {
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
  session?: ClientSession,
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
  const scheduled = await PublicationModel.findOneAndUpdate(
    { chapterId, status: { $in: ["DRAFT", "CANCELLED", "SCHEDULED"] } },
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
    { upsert: true, returnDocument: "after", ...(session ? { session } : {}) },
  );
  if (!scheduled) throw new AppError(409, "Chapter publication state changed.", "CONFLICT");
  await audit(req, "PUBLICATION_SCHEDULED", "publication", chapterId, {
    scheduledAt: scheduledAt.toISOString(),
    publicationType,
  }, session);
  await notifyMany([
    {
      userId: series.authorId,
      kind: "PUBLICATION_SCHEDULED",
      title: "Publication scheduled",
      message: `${chapter.title} is scheduled for publication.`,
    },
  ], session);
  return { scheduledAt, publicationType };
}

export async function postponeChapterPublication(
  req: AuthedRequest,
  chapterId: string,
  fromStatus: string,
  session?: ClientSession,
) {
  const publicationQuery = PublicationModel.findOne({ chapterId, status: "SCHEDULED" });
  if (session) publicationQuery.session(session);
  const publication = await publicationQuery.lean();
  if (!publication) {
    throw new AppError(409, "No scheduled publication exists.", "PUBLICATION_NOT_SCHEDULED");
  }
  const result = await PublicationModel.updateOne(
    { chapterId, status: "SCHEDULED" },
    {
      $set: {
        status: "CANCELLED",
        postponedById: req.actor?.id,
        postponedAt: new Date(),
        updatedAt: nowIso(),
      },
    },
    session ? { session } : undefined,
  );
  if (result.modifiedCount !== 1) {
    throw new AppError(409, "Publication state changed while postponing.", "CONFLICT");
  }
  await audit(req, "CHAPTER_POSTPONED", "chapter", chapterId, {
    fromStatus,
    toStatus: "READY_FOR_PUBLICATION",
  }, session);
}

export async function publishChapter(
  req: AuthedRequest,
  chapter: any,
  series: any,
  chapterId: string,
  fromStatus: string,
  allowEarly = false,
  session?: ClientSession,
) {
  const publicationQuery = PublicationModel.findOne({ chapterId, status: "SCHEDULED" });
  if (session) publicationQuery.session(session);
  const publication = await publicationQuery.lean();
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
  const publicationResult = await PublicationModel.updateOne(
    { chapterId, status: "SCHEDULED" },
    {
      $set: {
        status: "PUBLISHED",
        publishedAt,
        publishedById: req.actor?.id,
        updatedAt: nowIso(),
      },
    },
    session ? { session } : undefined,
  );
  if (publicationResult.modifiedCount !== 1) {
    throw new AppError(409, "Publication state changed while publishing.", "CONFLICT");
  }
  await SeriesModel.updateOne(
    { id: chapter.seriesId },
    {
      $set: {
        visibility: "PUBLIC",
        publishedAt: series.publishedAt ?? publishedAt,
        updatedAt: nowIso(),
      },
    },
    session ? { session } : undefined,
  );
  await audit(req, "CHAPTER_PUBLISHED", "chapter", chapterId, {
    fromStatus,
    toStatus: "PUBLISHED",
    publishedEarly: isEarly,
    scheduledAt: scheduledAt.toISOString(),
  }, session);
  await notifyMany([
    {
      userId: series.authorId,
      kind: "CHAPTER_PUBLISHED",
      title: "Chapter published",
      message: `${chapter.title} has been published${isEarly ? " early" : ""}.`,
    },
  ], session);
  return publishedAt;
}

export async function publishDuePublications(now = new Date()) {
  const due = await PublicationModel.find({
    status: "SCHEDULED",
    scheduledAt: { $lte: now },
  }).lean();
  let published = 0;
  for (const publication of due) {
    const claimed = await PublicationModel.updateOne(
      { id: publication.id, status: "SCHEDULED", scheduledAt: { $lte: now } },
      {
        $set: {
          status: "PUBLISHED",
          publishedAt: now,
          publishedById: systemActor().id,
          updatedAt: now,
        },
      },
    );
    if (claimed.modifiedCount !== 1) continue;
    const [chapter, series] = await Promise.all([
      ChapterModel.findOne({ id: publication.chapterId }).lean(),
      SeriesModel.findOne({ id: publication.seriesId }).lean(),
    ]);
    if (!chapter || !series || ["CANCELLED", "COMPLETED", "ARCHIVED"].includes(String(series.status))) {
      await PublicationModel.updateOne(
        { id: publication.id, status: "PUBLISHED" },
        { $set: { status: "CANCELLED", updatedAt: now } },
      );
      continue;
    }
    await ChapterModel.updateOne(
      { id: chapter.id, status: "READY_FOR_PUBLICATION" },
      { $set: { status: "PUBLISHED", publishedAt: now, publishedById: systemActor().id, updatedAt: now } },
    );
    await SeriesModel.updateOne(
      { id: series.id },
      { $set: { visibility: "PUBLIC", publishedAt: series.publishedAt ?? now, updatedAt: now } },
    );
    const systemRequest = { actor: systemActor(), requestId: `publication-runner:${publication.id}` } as AuthedRequest;
    await audit(systemRequest, "CHAPTER_PUBLISHED", "chapter", chapter.id, {
      fromStatus: chapter.status,
      toStatus: "PUBLISHED",
      publishedEarly: false,
      scheduledAt: new Date(publication.scheduledAt as Date).toISOString(),
    });
    await notifyMany([{
      userId: series.authorId,
      kind: "CHAPTER_PUBLISHED",
      title: "Chapter published",
      message: `${chapter.title} has been published.`,
    }]);
    published += 1;
  }
  return { published, checked: due.length };
}

export { assertPublishableSeries, requirePublicationType };
