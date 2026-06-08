import { AppError } from "../../shared/errors/AppError.js"
import { createChapterRepository, listChaptersBySeries, getChapterById, updateChapterStatus, createPageRepository, getPagesByChapter, confirmPageUploadRepository, getFileAssetById, getPageWithFileAsset, createRegionRepository, getRegionsByPage, getRegionById, updateRegionStatus, deleteRegionRepository, getChapterReadinessData } from "./chapter.repository.js"
import { createPresignedUploadUrl, createPresignedDownloadUrl, validateFileType, validateFileSize } from "./file.service.js"
import { FileAsset } from "./chapter.model.js"

export interface CreateChapterServiceInput {
  seriesId: string
  chapterNumber: number
  title: string
}

export async function createChapterService(input: CreateChapterServiceInput) {
  if (!input.title?.trim()) {
    throw new AppError("Chapter title is required", 400)
  }

  if (typeof input.chapterNumber !== "number" || input.chapterNumber < 1) {
    throw new AppError("Valid chapter number is required", 400)
  }

  try {
    return await createChapterRepository({
      seriesId: input.seriesId.trim(),
      chapterNumber: input.chapterNumber,
      title: input.title.trim(),
    })
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Series not found")) {
      throw new AppError("Series not found", 404)
    }
    if (message.includes("Chapter creation not allowed")) {
      throw new AppError(message, 409)
    }
    if (message.includes("already exists")) {
      throw new AppError(message, 409)
    }
    throw new AppError("Unable to create chapter", 400)
  }
}

export async function listChaptersService(seriesId: string) {
  if (!seriesId?.trim()) {
    throw new AppError("Series id is required", 400)
  }
  return listChaptersBySeries(seriesId.trim())
}

export async function getChapterService(chapterId: string) {
  const trimmed = chapterId.trim()
  if (!trimmed) {
    throw new AppError("Chapter id is required", 400)
  }
  const chapter = await getChapterById(trimmed)
  if (!chapter) {
    throw new AppError("Chapter not found", 404)
  }
  return chapter
}

export async function updateChapterStatusService(chapterId: string, status: string) {
  const trimmed = chapterId.trim()
  if (!trimmed) {
    throw new AppError("Chapter id is required", 400)
  }
  if (!status?.trim()) {
    throw new AppError("Status is required", 400)
  }
  const chapter = await updateChapterStatus(trimmed, status as any)
  if (!chapter) {
    throw new AppError("Chapter not found", 404)
  }
  return chapter
}

export async function createPageService(chapterId: string, pageNumber: number) {
  const trimmed = chapterId.trim()
  if (!trimmed) {
    throw new AppError("Chapter id is required", 400)
  }
  if (typeof pageNumber !== "number" || pageNumber < 1) {
    throw new AppError("Valid page number is required", 400)
  }
  try {
    return await createPageRepository(trimmed, pageNumber)
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Chapter not found")) {
      throw new AppError("Chapter not found", 404)
    }
    if (message.includes("already exists")) {
      throw new AppError(message, 409)
    }
    throw new AppError("Unable to create page", 400)
  }
}

export async function listPagesService(chapterId: string) {
  const trimmed = chapterId.trim()
  if (!trimmed) {
    throw new AppError("Chapter id is required", 400)
  }
  return getPagesByChapter(trimmed)
}

export interface GetPresignedUploadUrlInput {
  originalName: string
  contentType: string
  expiresIn?: number
}

export async function getPresignedUploadUrlService(input: GetPresignedUploadUrlInput) {
  if (!input.originalName?.trim()) {
    throw new AppError("Original file name is required", 400)
  }
  if (!input.contentType?.trim()) {
    throw new AppError("Content type is required", 400)
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  if (!validateFileType(input.contentType, allowedTypes)) {
    throw new AppError("File type not allowed. Use JPEG, PNG, WebP, or PDF", 400)
  }
  return createPresignedUploadUrl(input.originalName, input.contentType, input.expiresIn)
}

export interface ConfirmPageUploadInput {
  pageId: string
  fileAssetId: string
  r2Key: string
  originalName: string
  mimeType: string
  size: number
  userId: string
}

export async function confirmPageUploadService(input: ConfirmPageUploadInput) {
  const trimmedPageId = input.pageId.trim()
  if (!trimmedPageId) {
    throw new AppError("Page id is required", 400)
  }
  if (!input.fileAssetId?.trim() || !input.r2Key?.trim() || !input.originalName?.trim() || !input.mimeType?.trim()) {
    throw new AppError("All file asset fields are required", 400)
  }
  if (!validateFileSize(input.size, 100)) {
    throw new AppError("File size exceeds 100MB limit", 400)
  }
  try {
    const result = await confirmPageUploadRepository({
      pageId: trimmedPageId,
      fileAssetId: input.fileAssetId,
      r2Key: input.r2Key,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
    })
    const fileAsset = await FileAsset.findByIdAndUpdate(input.fileAssetId, { uploadedBy: input.userId }, { new: true })
    return { page: result.page, fileAsset: fileAsset || result.fileAsset }
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Page not found")) {
      throw new AppError("Page not found", 404)
    }
    throw new AppError("Unable to confirm page upload", 400)
  }
}

export async function getPresignedDownloadUrlService(fileAssetId: string, expiresIn?: number) {
  const trimmed = fileAssetId.trim()
  if (!trimmed) {
    throw new AppError("File asset id is required", 400)
  }
  const fileAsset = await getFileAssetById(trimmed)
  if (!fileAsset) {
    throw new AppError("File asset not found", 404)
  }
  return createPresignedDownloadUrl(fileAsset.r2Key, expiresIn)
}

export async function getPageWithFileAssetService(pageId: string) {
  const trimmed = pageId.trim()
  if (!trimmed) {
    throw new AppError("Page id is required", 400)
  }
  const page = await getPageWithFileAsset(trimmed)
  if (!page) {
    throw new AppError("Page not found", 404)
  }
  return page
}

export interface CreateRegionInput {
  pageId: string
  regionIndex: number
  bbox: { x: number; y: number; width: number; height: number }
}

export async function createRegionService(input: CreateRegionInput) {
  if (!input.pageId?.trim()) {
    throw new AppError("Page id is required", 400)
  }
  if (typeof input.regionIndex !== "number" || input.regionIndex < 0) {
    throw new AppError("Valid region index is required", 400)
  }
  if (!input.bbox || typeof input.bbox.x !== "number" || typeof input.bbox.y !== "number" ||
      typeof input.bbox.width !== "number" || typeof input.bbox.height !== "number" ||
      input.bbox.width <= 0 || input.bbox.height <= 0) {
    throw new AppError("Valid bbox with positive width/height is required", 400)
  }
  try {
    return await createRegionRepository(input.pageId.trim(), input.regionIndex, input.bbox)
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Page not found")) {
      throw new AppError("Page not found", 404)
    }
    if (message.includes("already exists")) {
      throw new AppError(message, 409)
    }
    throw new AppError("Unable to create region", 400)
  }
}

export async function listRegionsService(pageId: string) {
  const trimmed = pageId.trim()
  if (!trimmed) {
    throw new AppError("Page id is required", 400)
  }
  return getRegionsByPage(trimmed)
}

export async function getRegionService(regionId: string) {
  const trimmed = regionId.trim()
  if (!trimmed) {
    throw new AppError("Region id is required", 400)
  }
  const region = await getRegionById(trimmed)
  if (!region) {
    throw new AppError("Region not found", 404)
  }
  return region
}

export async function updateRegionStatusService(regionId: string, status: "ACTIVE" | "ARCHIVED") {
  const trimmed = regionId.trim()
  if (!trimmed) {
    throw new AppError("Region id is required", 400)
  }
  if (!["ACTIVE", "ARCHIVED"].includes(status)) {
    throw new AppError("Invalid region status", 400)
  }
  const region = await updateRegionStatus(trimmed, status)
  if (!region) {
    throw new AppError("Region not found", 404)
  }
  return region
}

export async function deleteRegionService(regionId: string) {
  const trimmed = regionId.trim()
  if (!trimmed) {
    throw new AppError("Region id is required", 400)
  }
  const region = await deleteRegionRepository(trimmed)
  if (!region) {
    throw new AppError("Region not found", 404)
  }
  return region
}

export interface PublicationReadinessItemResult {
  key: "allPagesUploaded" | "allTasksApproved" | "allSubmissionsApproved" | "allCommentsResolved" | "editorFinalApprovalExists" | "publicationDateExists"
  passed: boolean
  reason: string
}

export async function getChapterReadinessService(chapterId: string) {
  const trimmed = chapterId.trim()
  if (!trimmed) {
    throw new AppError("Chapter id is required", 400)
  }

  const readiness = await getChapterReadinessData(trimmed)
  if (!readiness) {
    throw new AppError("Chapter not found", 404)
  }

  const { chapter, pages, tasks, submissions, blockingComments } = readiness
  const hasPages = pages.length > 0
  const hasTasks = tasks.length > 0
  const hasSubmissions = submissions.length > 0

  const items: PublicationReadinessItemResult[] = [
    {
      key: "allPagesUploaded",
      passed: hasPages && pages.every((page) => page.status === "UPLOADED" || page.status === "APPROVED"),
      reason: hasPages
        ? pages.every((page) => page.status === "UPLOADED" || page.status === "APPROVED")
          ? "All chapter pages exist and are uploaded."
          : "One or more pages are missing upload-ready status."
        : "No pages exist for this chapter.",
    },
    {
      key: "allTasksApproved",
      passed: hasTasks && tasks.every((task) => task.status === "EDITOR_APPROVED"),
      reason: hasTasks
        ? tasks.every((task) => task.status === "EDITOR_APPROVED")
          ? "All tasks reached Editor approval."
          : "One or more tasks are not Editor-approved."
        : "No tasks exist for this chapter.",
    },
    {
      key: "allSubmissionsApproved",
      passed: hasSubmissions && submissions.every((submission) => submission.status === "EDITOR_APPROVED"),
      reason: hasSubmissions
        ? submissions.every((submission) => submission.status === "EDITOR_APPROVED")
          ? "All submissions reached Editor approval."
          : "One or more submissions are not Editor-approved."
        : "No submissions exist for this chapter.",
    },
    {
      key: "allCommentsResolved",
      passed: blockingComments.length === 0,
      reason: blockingComments.length === 0
        ? "All blocking comments are resolved by Editor."
        : `${blockingComments.length} blocking comment(s) still need Editor resolution.`,
    },
    {
      key: "editorFinalApprovalExists",
      passed: tasks.some((task) => task.status === "EDITOR_APPROVED") || submissions.some((submission) => submission.status === "EDITOR_APPROVED"),
      reason: tasks.some((task) => task.status === "EDITOR_APPROVED") || submissions.some((submission) => submission.status === "EDITOR_APPROVED")
        ? "Editor final approval evidence exists in approved tasks/submissions."
        : "No Editor final approval evidence exists for this chapter.",
    },
    {
      key: "publicationDateExists",
      passed: Boolean(chapter.draftSchedule),
      reason: chapter.draftSchedule
        ? "Publication schedule exists."
        : "No publication schedule/date exists for this chapter.",
    },
  ]

  return {
    chapterId: String(chapter._id ?? chapter.id),
    chapterStatus: chapter.status,
    ready: items.every((item) => item.passed),
    items,
  }
}
