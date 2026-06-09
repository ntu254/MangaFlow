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
  createdAt: Date
  updatedAt: Date
}

export async function createChapterRepository(input: CreateChapterInput): Promise<CreateChapterResult> {
  const series = await Series.findById(input.seriesId)
  if (!series) {
    throw new Error("Series not found")
  }

  const allowedStatuses = ["APPROVED", "ONGOING", "AT_RISK"]
  if (!allowedStatuses.includes(series.status as string)) {
    throw new Error(`Chapter creation not allowed. Series status is ${series.status}. Must be APPROVED, ONGOING, or AT_RISK.`)
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
  })

  return {
    id: chapter.id,
    seriesId: String(chapter.seriesId),
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    status: chapter.status as ChapterStatus,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
  }
}

export async function getChapterById(chapterId: string): Promise<any | null> {
  return Chapter.findById(chapterId)
}

export async function listChaptersBySeries(seriesId: string): Promise<any[]> {
  return Chapter.find({ seriesId }).sort({ chapterNumber: 1 }).lean()
}

export async function updateChapterStatus(chapterId: string, status: ChapterStatus): Promise<any | null> {
  return Chapter.findByIdAndUpdate(chapterId, { status }, { new: true })
}
