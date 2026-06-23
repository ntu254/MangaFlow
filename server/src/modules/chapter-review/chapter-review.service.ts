import { AppError } from "../../shared/errors/AppError.js"
import type { JwtPayload } from "../auth/auth.types.js"
import { Chapter, Page } from "../chapter/chapter.model.js"
import { Task } from "../task/task.model.js"
import { SeriesMember } from "../series/series.model.js"
import { isActiveMember } from "../../shared/policies/seriesMember.policy.js"
import {
  ChapterReviewAnnotation,
  ChapterVersion,
  type ChapterReviewAnnotationStatus,
} from "./chapter-review.model.js"

const BLOCKING_PAGE_STATUSES = ["PENDING", "UPLOADING", "PROCESSING", "PROCESSING_FAILED", "UPLOAD_FAILED"]

async function assertSeriesMember(seriesId: string, actor: JwtPayload, allowedRoles: string[]) {
  if (actor.role === "ADMIN") return
  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !isActiveMember(member) || !allowedRoles.includes(member.role)) {
    if (actor.role === "EDITOR" && allowedRoles.includes("EDITOR")) {
      const activeEditor = await SeriesMember.findOne({ seriesId, role: "EDITOR" })
      if (!activeEditor || !isActiveMember(activeEditor)) return
    }
    throw new AppError("Chapter review access denied", 403)
  }
  if (actor.role !== member.role) {
    throw new AppError("Chapter review access denied", 403)
  }
}

async function getChapterOrThrow(chapterId: string) {
  const chapter = await Chapter.findById(chapterId)
  if (!chapter) throw new AppError("Chapter not found", 404)
  return chapter
}

async function getVersionOrThrow(versionId: string) {
  const version = await ChapterVersion.findById(versionId)
  if (!version) throw new AppError("Chapter version not found", 404)
  return version
}

function requireOverallReview(reviewerNote?: string) {
  const trimmed = reviewerNote?.trim()
  if (!trimmed) {
    throw new AppError("Overall review is required", 400)
  }
  return trimmed
}

export async function submitChapterVersionService(chapterId: string, actor: JwtPayload) {
  const chapter = await getChapterOrThrow(chapterId)
  await assertSeriesMember(String(chapter.seriesId), actor, ["MANGAKA"])

  if (chapter.status !== "IN_PRODUCTION") {
    throw new AppError("Only chapters in production can be submitted for Editor chapter review.", 409)
  }

  const [pages, tasks, activeVersion, latestVersion] = await Promise.all([
    Page.find({ chapterId, deletedAt: { $exists: false } }).sort({ pageNumber: 1 }),
    Task.find({ chapterId }).lean(),
    ChapterVersion.findOne({ chapterId, status: "SUBMITTED" }).lean(),
    ChapterVersion.findOne({ chapterId }).sort({ version: -1 }).lean(),
  ])

  if (activeVersion) {
    throw new AppError("This chapter already has a submitted version waiting for Editor review.", 409)
  }

  if (pages.length === 0) {
    throw new AppError("Upload at least one final page before submitting this chapter version.", 400)
  }

  const blockedPage = pages.find((page) => BLOCKING_PAGE_STATUSES.includes(page.status))
  if (blockedPage) {
    throw new AppError("Resolve page upload or processing blockers before submitting this chapter version.", 400)
  }

  const unfinishedTask = tasks.find((task) => task.status !== "EDITOR_APPROVED" && task.status !== "CANCELLED")
  if (unfinishedTask) {
    throw new AppError("All existing Assistant tasks must be Editor-approved before submitting the chapter package.", 400)
  }

  const pageSnapshots = pages.map((page) => {
    const fileAssetId = page.workingFileAssetId ?? page.originalFileAssetId ?? page.thumbnailFileAssetId
    if (!fileAssetId) {
      throw new AppError(`Page ${page.pageNumber} has no reviewable image asset.`, 400)
    }
    return {
      pageId: page._id,
      pageNumber: page.pageNumber,
      fileAssetId,
      originalFileAssetId: page.originalFileAssetId,
      workingFileAssetId: page.workingFileAssetId,
      thumbnailFileAssetId: page.thumbnailFileAssetId,
      status: page.status,
    }
  })

  return ChapterVersion.create({
    seriesId: chapter.seriesId,
    chapterId: chapter._id,
    version: (latestVersion?.version ?? 0) + 1,
    status: "SUBMITTED",
    submittedBy: actor.userId,
    submittedAt: new Date(),
    pageSnapshots,
  })
}

export async function listChapterVersionsService(chapterId: string, actor: JwtPayload) {
  const chapter = await getChapterOrThrow(chapterId)
  await assertSeriesMember(String(chapter.seriesId), actor, ["MANGAKA", "EDITOR"])
  return ChapterVersion.find({ chapterId }).sort({ version: -1 }).lean()
}

export async function getChapterVersionDetailService(versionId: string, actor: JwtPayload) {
  const version = await getVersionOrThrow(versionId)
  await assertSeriesMember(String(version.seriesId), actor, ["MANGAKA", "EDITOR"])
  const annotations = await ChapterReviewAnnotation.find({ chapterVersionId: version._id })
    .sort({ createdAt: -1 })
    .populate("authorId", "name displayName email role")
    .lean()
  return { version, annotations }
}

export async function listEditorChapterReviewQueueService(actor: JwtPayload) {
  if (actor.role !== "EDITOR" && actor.role !== "ADMIN") {
    throw new AppError("Chapter review queue access denied", 403)
  }

  const assignedSeriesIds =
    actor.role === "ADMIN"
      ? undefined
      : (
          await SeriesMember.find({
            userId: actor.userId,
            role: "EDITOR",
          }).select("seriesId role status isActive")
        )
          .filter((member) => isActiveMember(member))
          .map((member) => member.seriesId)

  const query: Record<string, unknown> = { status: "SUBMITTED" }
  if (assignedSeriesIds) {
    const activeEditorSeriesIds = (
      await SeriesMember.find({ role: "EDITOR" }).select("seriesId role status isActive")
    )
      .filter((member) => isActiveMember(member))
      .map((member) => member.seriesId)
    query.$or = [
      { seriesId: { $in: assignedSeriesIds } },
      { seriesId: { $nin: activeEditorSeriesIds } },
    ]
  }

  return ChapterVersion.find(query)
    .sort({ submittedAt: 1 })
    .populate("chapterId", "chapterNumber title status")
    .populate("seriesId", "title slug status")
    .populate("submittedBy", "name displayName email")
    .lean()
}

export async function requestChapterVersionRevisionService(input: {
  versionId: string
  actor: JwtPayload
  reviewerNote?: string
}) {
  const reviewerNote = requireOverallReview(input.reviewerNote)
  const version = await getVersionOrThrow(input.versionId)
  await assertSeriesMember(String(version.seriesId), input.actor, ["EDITOR"])
  if (version.status !== "SUBMITTED") {
    throw new AppError("Only submitted chapter versions can receive revision requests.", 409)
  }
  if (version.isLocked) {
    throw new AppError("Locked chapter versions cannot receive revision requests.", 409)
  }

  version.status = "REVISION_REQUESTED"
  version.reviewedBy = input.actor.userId as any
  version.reviewedAt = new Date()
  version.reviewerNote = reviewerNote
  await version.save()
  return version
}

export async function approveChapterVersionService(input: {
  versionId: string
  actor: JwtPayload
  reviewerNote?: string
}) {
  const reviewerNote = requireOverallReview(input.reviewerNote)
  const version = await getVersionOrThrow(input.versionId)
  await assertSeriesMember(String(version.seriesId), input.actor, ["EDITOR"])
  if (version.status !== "SUBMITTED") {
    throw new AppError("Only submitted chapter versions can be approved.", 409)
  }
  if (version.isLocked) {
    throw new AppError("Chapter version is already locked.", 409)
  }

  const blockingAnnotations = await ChapterReviewAnnotation.countDocuments({
    chapterVersionId: version._id,
    status: "OPEN",
    isBlocking: true,
  })
  if (blockingAnnotations > 0) {
    throw new AppError("Resolve blocking annotations before approving this chapter version.", 400)
  }

  const now = new Date()
  version.status = "APPROVED"
  version.reviewedBy = input.actor.userId as any
  version.reviewedAt = now
  version.reviewerNote = reviewerNote
  version.isLocked = true
  version.lockedAt = now
  version.lockedBy = input.actor.userId as any
  await version.save()

  await Chapter.findByIdAndUpdate(version.chapterId, {
    publishingCandidateVersionId: version._id,
    status: "READY_FOR_PUBLICATION",
  })

  return version
}

export async function createChapterReviewAnnotationService(input: {
  versionId: string
  actor: JwtPayload
  pageId?: string
  body: string
  geometry?: { x?: number; y?: number; width?: number; height?: number }
  isBlocking?: boolean
}) {
  const version = await getVersionOrThrow(input.versionId)
  await assertSeriesMember(String(version.seriesId), input.actor, ["EDITOR"])
  if (version.isLocked) {
    throw new AppError("Cannot annotate a locked approved chapter version.", 409)
  }

  if (input.pageId && !version.pageSnapshots.some((snapshot) => String(snapshot.pageId) === input.pageId)) {
    throw new AppError("Annotation page does not belong to this chapter version.", 400)
  }

  return ChapterReviewAnnotation.create({
    seriesId: version.seriesId,
    chapterId: version.chapterId,
    chapterVersionId: version._id,
    pageId: input.pageId,
    body: input.body.trim(),
    geometry: input.geometry,
    isBlocking: input.isBlocking ?? true,
    status: "OPEN",
    authorId: input.actor.userId,
  })
}

export async function listChapterReviewAnnotationsService(versionId: string, actor: JwtPayload) {
  const version = await getVersionOrThrow(versionId)
  await assertSeriesMember(String(version.seriesId), actor, ["MANGAKA", "EDITOR"])
  return ChapterReviewAnnotation.find({ chapterVersionId: version._id })
    .sort({ createdAt: -1 })
    .populate("authorId", "name displayName email role")
    .lean()
}

export async function patchChapterReviewAnnotationService(input: {
  annotationId: string
  actor: JwtPayload
  body?: string
  geometry?: { x?: number; y?: number; width?: number; height?: number }
  isBlocking?: boolean
  status?: ChapterReviewAnnotationStatus
}) {
  const annotation = await ChapterReviewAnnotation.findById(input.annotationId)
  if (!annotation) throw new AppError("Annotation not found", 404)
  await assertSeriesMember(String(annotation.seriesId), input.actor, ["EDITOR"])

  const version = await getVersionOrThrow(String(annotation.chapterVersionId))
  if (version.isLocked && input.status !== "RESOLVED") {
    throw new AppError("Locked chapter version annotations can only be resolved.", 409)
  }

  if (input.body !== undefined) annotation.body = input.body.trim()
  if (input.geometry !== undefined) annotation.geometry = input.geometry
  if (input.isBlocking !== undefined) annotation.isBlocking = input.isBlocking
  if (input.status !== undefined) {
    annotation.status = input.status
    if (input.status === "RESOLVED") {
      annotation.resolvedBy = input.actor.userId as any
      annotation.resolvedAt = new Date()
    } else {
      annotation.resolvedBy = undefined
      annotation.resolvedAt = undefined
    }
  }

  await annotation.save()
  return annotation
}

export async function assertPublicationVersionCandidate(chapterId: string) {
  const chapter = await getChapterOrThrow(chapterId)
  if (!chapter.publishingCandidateVersionId) {
    throw new AppError("Chapter needs an approved locked version before publication can be created.", 409)
  }
  const version = await ChapterVersion.findOne({
    _id: chapter.publishingCandidateVersionId,
    chapterId,
    status: "APPROVED",
    isLocked: true,
  })
  if (!version) {
    throw new AppError("Approved chapter version candidate is missing or unlocked.", 409)
  }
  return version
}
