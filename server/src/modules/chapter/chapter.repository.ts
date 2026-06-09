import { Chapter, Page, FileAsset, Region } from "./chapter.model.js"
import { Comment } from "../comment/comment.model.js"
import { Submission } from "../submission/submission.model.js"
import { Task } from "../task/task.model.js"
import { Series } from "../series/series.model.js"
import type { ChapterStatus } from "../../shared/workflow/status.js"

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
  const chapter = await Chapter.findByIdAndUpdate(chapterId, { status }, { new: true })
  return chapter
}

export async function createPageRepository(chapterId: string, pageNumber: number): Promise<any> {
  const chapter = await Chapter.findById(chapterId)
  if (!chapter) {
    throw new Error("Chapter not found")
  }

  const existing = await Page.findOne({ chapterId, pageNumber })
  if (existing) {
    throw new Error(`Page ${pageNumber} already exists in this chapter`)
  }

  const page = await Page.create({
    chapterId,
    pageNumber,
    status: "UPLOADED",
    regionIds: [],
  })

  return page
}

export async function getPagesByChapter(chapterId: string): Promise<any[]> {
  return Page.find({ chapterId }).sort({ pageNumber: 1 }).lean()
}

export async function getPageById(pageId: string): Promise<any | null> {
  return Page.findById(pageId)
}

export async function updatePageStatus(pageId: string, status: string): Promise<any | null> {
  return Page.findByIdAndUpdate(pageId, { status }, { new: true })
}

export interface ConfirmPageUploadInput {
  pageId: string
  fileAssetId: string
  r2Key: string
  originalName: string
  mimeType: string
  size: number
}

export async function confirmPageUploadRepository(input: ConfirmPageUploadInput): Promise<any> {
  const page = await Page.findByIdAndUpdate(
    input.pageId,
    {
      status: "UPLOADED",
      originalFileAssetId: input.fileAssetId,
    },
    { new: true },
  )

  if (!page) {
    throw new Error("Page not found")
  }

  const fileAsset = await FileAsset.create({
    _id: input.fileAssetId,
    originalName: input.originalName,
    mimeType: input.mimeType,
    size: input.size,
    r2Key: input.r2Key,
    r2Bucket: process.env.R2_BUCKET || "mangaflow",
    uploadedBy: page.chapterId, // will be replaced with actual user in service
  })

  return { page, fileAsset }
}

export async function getFileAssetById(fileAssetId: string): Promise<any | null> {
  return FileAsset.findById(fileAssetId)
}

export async function getPageWithFileAsset(pageId: string): Promise<any | null> {
  return Page.findById(pageId).populate("originalFileAssetId")
}

export async function createRegionRepository(
  pageId: string,
  regionIndex: number,
  bbox: { x: number; y: number; width: number; height: number },
): Promise<any> {
  const page = await Page.findById(pageId)
  if (!page) {
    throw new Error("Page not found")
  }

  const existing = await Region.findOne({ pageId, regionIndex })
  if (existing) {
    throw new Error(`Region ${regionIndex} already exists on this page`)
  }

  const region = await Region.create({
    pageId,
    regionIndex,
    bbox,
    status: "ACTIVE",
  })

  await Page.findByIdAndUpdate(pageId, { $push: { regionIds: region._id } })

  return region
}

export async function getRegionsByPage(pageId: string): Promise<any[]> {
  return Region.find({ pageId }).sort({ regionIndex: 1 }).lean()
}

export async function getRegionById(regionId: string): Promise<any | null> {
  return Region.findById(regionId)
}

export async function updateRegionStatus(regionId: string, status: "ACTIVE" | "ARCHIVED"): Promise<any | null> {
  return Region.findByIdAndUpdate(regionId, { status }, { new: true })
}

export async function deleteRegionRepository(regionId: string): Promise<any | null> {
  const region = await Region.findByIdAndDelete(regionId)
  if (region) {
    await Page.findByIdAndUpdate(region.pageId, { $pull: { regionIds: region._id } })
  }
  return region
}

export async function getChapterReadinessData(chapterId: string) {
  const chapter = await Chapter.findById(chapterId).lean()
  if (!chapter) return null

  const [pages, tasks, submissions, blockingComments] = await Promise.all([
    Page.find({ chapterId }).sort({ pageNumber: 1 }).lean(),
    Task.find({ chapterId }).lean(),
    Submission.find({ chapterId }).sort({ createdAt: -1 }).lean(),
    Comment.find({ chapterId, isBlocking: true, status: { $ne: "RESOLVED_BY_EDITOR" } }).lean(),
  ])

  return { chapter, pages, tasks, submissions, blockingComments }
}
