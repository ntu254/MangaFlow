import { Chapter } from "../chapter/chapter.model.js"
import { Publication } from "./publication.model.js"

export async function getPublicationChapter(chapterId: string) {
  return Chapter.findById(chapterId)
}

export async function getPublicationById(publicationId: string) {
  return Publication.findById(publicationId)
}

export async function getPublicationByChapter(chapterId: string) {
  return Publication.findOne({ chapterId })
}

export async function listPublications(filter: { seriesId?: string; userId?: string }) {
  const query: Record<string, unknown> = {}
  if (filter.seriesId) query.seriesId = filter.seriesId
  if (filter.userId) query.createdBy = filter.userId
  return Publication.find(query)
    .sort({ createdAt: -1 })
    .populate("chapterId", "chapterNumber title status")
    .populate("chapterVersionId", "version status isLocked lockedAt")
    .lean()
}

export async function createPublicationRecord(input: { chapterId: string; chapterVersionId?: string; seriesId: string; createdBy: string; scheduledFor?: Date }) {
  return Publication.findOneAndUpdate(
    { chapterId: input.chapterId },
    {
      chapterId: input.chapterId,
      chapterVersionId: input.chapterVersionId,
      seriesId: input.seriesId,
      createdBy: input.createdBy,
      status: input.scheduledFor ? "SCHEDULED" : "DRAFT",
      ...(input.scheduledFor ? { scheduledFor: input.scheduledFor, scheduleManagedBy: input.createdBy } : {}),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
}

export async function updatePublicationSchedule(publicationId: string, scheduledFor: Date, actorId: string) {
  return Publication.findByIdAndUpdate(publicationId, { status: "SCHEDULED", scheduledFor, scheduleManagedBy: actorId }, { new: true })
}

export async function markPublicationPublished(publicationId: string, actorId: string, publishedAt: Date) {
  return Publication.findByIdAndUpdate(publicationId, { publishedAt, publishedBy: actorId, status: "PUBLISHED" }, { new: true })
}

export async function cancelPublication(publicationId: string, actorId: string) {
  return Publication.findByIdAndUpdate(publicationId, { status: "CANCELLED", scheduleManagedBy: actorId }, { new: true })
}

export async function updateChapterDraftSchedule(chapterId: string, scheduledFor: Date) {
  return Chapter.findByIdAndUpdate(chapterId, { draftSchedule: scheduledFor }, { new: true })
}

export async function updateChapterPublicationStatus(chapterId: string, status: "READY_FOR_PUBLICATION" | "PUBLISHED") {
  return Chapter.findByIdAndUpdate(chapterId, { status }, { new: true })
}
