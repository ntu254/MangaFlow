import { AppError } from "../../shared/errors/AppError.js"
import type { UserRole } from "../auth/auth.types.js"
import { getChapterReadinessService } from "../chapter/chapter.service.js"
import { Series } from "../series/series.model.js"
import { findActiveSeriesMember } from "../../shared/policies/seriesMember.policy.js"
import {
  createPublicationRecord,
  cancelPublication,
  getPublicationById,
  getPublicationChapter,
  markPublicationPublished,
  updateChapterDraftSchedule,
  updateChapterPublicationStatus,
  updatePublicationSchedule,
  listPublications,
} from "./publication.repository.js"
import { assertPublicationVersionCandidate } from "../chapter-review/chapter-review.service.js"

interface PublicationActor {
  userId: string
  role: UserRole
}

async function assertEditorForSeries(seriesId: string, actor: PublicationActor) {
  if (actor.role !== "EDITOR") {
    throw new AppError("Publication access denied", 403)
  }
  const member = await findActiveSeriesMember(seriesId, actor.userId)
  if (!member || member.role !== "EDITOR") {
    throw new AppError("Publication access denied", 403)
  }
}

function parseScheduleDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Valid publication date is required", 400)
  }
  return date
}

export async function listPublicationsService(filter: { seriesId?: string }, actor: PublicationActor) {
  if (actor.role === "MANGAKA") {
    if (!filter.seriesId) {
      throw new AppError("Series ID is required for Mangaka publication access", 400)
    }
    const series = await Series.findById(filter.seriesId).select("ownerId")
    if (!series) {
      throw new AppError("Series not found", 404)
    }
    const member = await findActiveSeriesMember(filter.seriesId, actor.userId)
    const isOwner = String(series.ownerId) === actor.userId
    const isMangakaMember = member?.role === "MANGAKA"
    if (!isOwner && !isMangakaMember) {
      throw new AppError("Publication access denied", 403)
    }
    return listPublications({ seriesId: filter.seriesId })
  }

  if (actor.role !== "EDITOR" && actor.role !== "ADMIN") {
    throw new AppError("Publication access denied", 403)
  }
  return listPublications({ seriesId: filter.seriesId })
}

export async function createPublicationService(input: { chapterId: string; scheduledFor?: string | Date; actor: PublicationActor }) {
  const chapter = await getPublicationChapter(input.chapterId)
  if (!chapter) {
    throw new AppError("Chapter not found", 404)
  }
  await assertEditorForSeries(String(chapter.seriesId), input.actor)
  if (chapter.status !== "READY_FOR_PUBLICATION") {
    throw new AppError("Publication can be created only after the chapter is READY_FOR_PUBLICATION", 409)
  }
  const chapterVersion = await assertPublicationVersionCandidate(input.chapterId)

  const scheduledFor = input.scheduledFor ? parseScheduleDate(input.scheduledFor) : undefined
  if (scheduledFor) {
    await updateChapterDraftSchedule(input.chapterId, scheduledFor)
  }

  return createPublicationRecord({
    chapterId: input.chapterId,
    chapterVersionId: String(chapterVersion._id),
    seriesId: String(chapter.seriesId),
    createdBy: input.actor.userId,
    scheduledFor,
  })
}

export async function schedulePublicationService(input: { publicationId: string; scheduledFor: string | Date; actor: PublicationActor }) {
  const publication = await getPublicationById(input.publicationId)
  if (!publication) {
    throw new AppError("Publication not found", 404)
  }
  await assertEditorForSeries(String(publication.seriesId), input.actor)

  const scheduledFor = parseScheduleDate(input.scheduledFor)
  await updateChapterDraftSchedule(String(publication.chapterId), scheduledFor)
  return updatePublicationSchedule(input.publicationId, scheduledFor, input.actor.userId)
}

export async function publishPublicationService(publicationId: string, actor: PublicationActor) {
  const publication = await getPublicationById(publicationId)
  if (!publication) {
    throw new AppError("Publication not found", 404)
  }
  await assertEditorForSeries(String(publication.seriesId), actor)

  if (publication.publishedAt) {
    throw new AppError("Publication is already published", 409)
  }

  const readiness = await getChapterReadinessService(String(publication.chapterId))
  if (!readiness.ready) {
    const failed = readiness.items.filter((item) => !item.passed).map((item) => item.key).join(", ")
    throw new AppError(`Chapter is not ready for publication: ${failed}`, 409)
  }
  if (readiness.chapterStatus !== "READY_FOR_PUBLICATION") {
    throw new AppError("Chapter must be READY_FOR_PUBLICATION before publishing", 409)
  }

  await updateChapterPublicationStatus(String(publication.chapterId), "PUBLISHED")
  return markPublicationPublished(publicationId, actor.userId, new Date())
}

export async function patchPublicationService(input: { publicationId: string; scheduledFor?: string | Date; actor: PublicationActor }) {
  const publication = await getPublicationById(input.publicationId)
  if (!publication) {
    throw new AppError("Publication not found", 404)
  }
  await assertEditorForSeries(String(publication.seriesId), input.actor)
  
  if (input.scheduledFor) {
    const scheduledFor = parseScheduleDate(input.scheduledFor)
    await updateChapterDraftSchedule(String(publication.chapterId), scheduledFor)
    return updatePublicationSchedule(input.publicationId, scheduledFor, input.actor.userId)
  }

  return publication
}

export async function cancelPublicationService(input: { publicationId: string; actor: PublicationActor }) {
  const publication = await getPublicationById(input.publicationId)
  if (!publication) {
    throw new AppError("Publication not found", 404)
  }
  await assertEditorForSeries(String(publication.seriesId), input.actor)
  
  if (publication.status === "PUBLISHED") {
    throw new AppError("Cannot cancel an already published publication", 400)
  }

  return cancelPublication(input.publicationId, input.actor.userId)
}
