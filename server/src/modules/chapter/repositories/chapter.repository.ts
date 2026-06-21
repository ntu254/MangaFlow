import { Chapter } from "../chapter.model.js"
import { Series } from "../../series/series.model.js"
import type { ChapterStatus } from "../../../shared/workflow/status.js"

export interface CreateChapterInput {
  seriesId: string
  chapterNumber: number
  title: string
}

export interface CreateChapterResult {
  id: string
  seriesId: string
  chapterNumber: number
  title: string
  status: ChapterStatus
  publicationTypeSnapshot?: string
  createdAt: Date
  updatedAt: Date
}

export async function createChapterRepository(input: CreateChapterInput): Promise<CreateChapterResult> {
  const series = await Series.findById(input.seriesId)
  if (!series) {
    throw new Error("Series not found")
  }

  if (series.status !== "ONGOING") {
    throw new Error(`Chapter creation not allowed. Series status is ${series.status}. Must be ONGOING.`)
  }
  if (!series.publicationType) {
    throw new Error("Chapter creation not allowed. Series must have an official publication type.")
  }

  const existing = await Chapter.findOne({ seriesId: input.seriesId, chapterNumber: input.chapterNumber })
  if (existing) {
    throw new Error(`Chapter ${input.chapterNumber} already exists for this series`)
  }

  const chapter = await Chapter.create({
    seriesId: input.seriesId,
    chapterNumber: input.chapterNumber,
    title: input.title,
    status: "DRAFT",
    publicationTypeSnapshot: series.publicationType,
  })

  return {
    id: chapter.id,
    seriesId: String(chapter.seriesId),
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    status: chapter.status as ChapterStatus,
    publicationTypeSnapshot: chapter.publicationTypeSnapshot,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
  }
}

export async function getChapterById(chapterId: string, includeDeleted = false): Promise<any | null> {
  const query: any = { _id: chapterId }
  if (!includeDeleted) query.deletedAt = { $exists: false }
  return Chapter.findOne(query)
}

export async function listChaptersBySeries(seriesId: string, includeDeleted = false): Promise<any[]> {
  const query: any = { seriesId }
  if (!includeDeleted) query.deletedAt = { $exists: false }
  return Chapter.find(query).sort({ chapterNumber: 1 }).lean()
}

export async function updateChapterStatus(chapterId: string, status: ChapterStatus): Promise<any | null> {
  return Chapter.findByIdAndUpdate(chapterId, { status }, { new: true })
}
