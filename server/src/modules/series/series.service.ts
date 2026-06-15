import { AppError } from "../../shared/errors/AppError.js"
import type { UserRole } from "../auth/auth.types.js"
import {
  createSeriesRepository,
  getSeriesById,
  getSeriesForActor,
  listSeriesForActor,
  submitSeriesRepository,
  updateSeriesRepository,
  createManuscriptUploadDraft,
  getSeriesSummaryData,
} from "./series.repository.js"
import { createPresignedUploadUrl } from "../chapter/file.service.js"

export interface CreateSeriesServiceInput {
  title: string
  synopsis: string
  logline?: string
  premise?: string
  characters?: string
  conflict?: string
  targetAudience?: string
  publicationType?: string
  tags?: string[]
  genres?: string[]
  ownerId: string
}

export async function listSeriesService(userId: string, role: UserRole) {
  try {
    return await listSeriesForActor(userId, role)
  } catch {
    throw new AppError("Assistants cannot list Series; access is task-scoped only", 403)
  }
}

export async function getSeriesDetailService(seriesId: string, userId: string, role: UserRole) {
  try {
    const series = await getSeriesForActor(seriesId, userId, role)
    if (!series) throw new AppError("Series not found", 404)
    return series
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError("Series access denied", 403)
  }
}

export async function createSeriesService(input: CreateSeriesServiceInput) {
  if (!input.title?.trim() || !input.synopsis?.trim()) {
    throw new AppError("Title and synopsis are required", 400)
  }

  return createSeriesRepository({
    title: input.title.trim(),
    synopsis: input.synopsis.trim(),
    logline: input.logline?.trim() || undefined,
    premise: input.premise?.trim() || undefined,
    characters: input.characters?.trim() || undefined,
    conflict: input.conflict?.trim() || undefined,
    targetAudience: input.targetAudience?.trim() || undefined,
    publicationType: input.publicationType?.trim() || undefined,
    tags: input.tags,
    genres: input.genres,
    ownerId: input.ownerId,
  })
}


export interface CreateManuscriptUploadServiceInput {
  seriesId: string
  userId: string
  originalName: string
  contentType: string
  size: number
  expiresIn?: number
}

export async function createManuscriptUploadService(input: CreateManuscriptUploadServiceInput) {
  const series = await getSeriesById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)
  if (series.ownerId.toString() !== input.userId) {
    throw new AppError("Only the series owner can upload manuscripts", 403)
  }

  const signed = await createPresignedUploadUrl(input.originalName, input.contentType, input.expiresIn)
  const persisted = await createManuscriptUploadDraft({
    seriesId: input.seriesId,
    uploadedBy: input.userId,
    r2Key: signed.r2Key,
    originalName: input.originalName,
    mimeType: input.contentType,
    size: input.size,
  })

  return {
    uploadUrl: signed.uploadUrl,
    fileAssetId: persisted.fileAsset.id,
    manuscriptId: persisted.manuscript.id,
    expiresIn: signed.expiresIn,
  }
}

export async function submitSeriesService(seriesId: string, userId: string) {
  const trimmed = seriesId.trim()
  if (!trimmed) throw new AppError("Series id is required", 400)

  let series
  try {
    series = await getSeriesById(trimmed)
  } catch {
    throw new AppError("Series not found", 404)
  }
  if (!series) throw new AppError("Series not found", 404)

  try {
    return await submitSeriesRepository(trimmed, userId)
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Only the owner Mangaka")) throw new AppError("Only the owner Mangaka can submit this series", 403)
    if (message.includes("Only draft series")) throw new AppError("Only draft series can be submitted", 409)
    if (message.includes("Initial manuscript")) throw new AppError("Initial manuscript is required before submit", 400)
    if (message.includes("Required series fields")) throw new AppError("Required series fields must be completed before submit", 400)
    if (message.includes("Series not found")) throw new AppError("Series not found", 404)
    throw new AppError("Unable to submit series", 400)
  }
}

export async function getSeriesSummaryService(seriesId: string, userId: string, role: UserRole) {
  const series = await getSeriesDetailService(seriesId, userId, role)
  const data = await getSeriesSummaryData(seriesId, String(series.ownerId))
  const fileById = new Map(data.files.map((file: any) => [String(file._id), file]))
  const pagesByChapter = new Map<string, any[]>()

  for (const page of data.pages as any[]) {
    const chapterId = String(page.chapterId)
    pagesByChapter.set(chapterId, [...(pagesByChapter.get(chapterId) ?? []), page])
  }

  const chapters = (data.chapters as any[]).map((chapter) => {
    const pages = pagesByChapter.get(String(chapter._id)) ?? []
    return {
      id: String(chapter._id),
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      status: chapter.status,
      draftSchedule: chapter.draftSchedule,
      pageCount: pages.length,
      approvedPages: pages.filter((page) => page.status === "APPROVED").length,
      updatedAt: chapter.updatedAt,
    }
  })

  const manuscripts = (data.manuscripts as any[]).map((manuscript) => {
    const file = manuscript.fileAssetId ? fileById.get(String(manuscript.fileAssetId)) : null
    const uploader = manuscript.uploadedBy as any
    return {
      id: String(manuscript._id),
      version: manuscript.version,
      status: manuscript.status,
      reviewNote: manuscript.reviewNote,
      uploadedBy: uploader ? {
        id: String(uploader._id),
        name: uploader.displayName || uploader.name,
        email: uploader.email,
      } : null,
      file: file ? {
        id: String(file._id),
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
      } : null,
      createdAt: manuscript.createdAt,
      updatedAt: manuscript.updatedAt,
    }
  })

  const completedTaskStatuses = new Set(["EDITOR_APPROVED", "REJECTED"])
  const openComments = (data.comments as any[]).filter((comment) => comment.status !== "RESOLVED_BY_EDITOR")
  const blockingComments = openComments.filter((comment) => comment.isBlocking)
  const totalPages = (data.pages as any[]).length
  const approvedPages = (data.pages as any[]).filter((page) => page.status === "APPROVED").length
  const readinessPercent = totalPages === 0 ? 0 : Math.round((approvedPages / totalPages) * 100)
  const currentChapter = chapters.find((chapter) => chapter.status !== "PUBLISHED") ?? chapters[0] ?? null
  const unpaidStatuses = new Set(["PENDING", "CONFIRMED"])

  return {
    series,
    owner: data.owner ? {
      id: String((data.owner as any)._id),
      name: (data.owner as any).displayName || (data.owner as any).name,
      email: (data.owner as any).email,
    } : null,
    members: (data.members as any[]).map((member) => ({
      id: String(member._id),
      role: member.role,
      isActive: member.isActive,
      accessScope: member.accessScope,
      user: member.userId ? {
        id: String(member.userId._id),
        name: member.userId.displayName || member.userId.name,
        email: member.userId.email,
        role: member.userId.role,
      } : null,
    })),
    manuscripts,
    currentManuscript: manuscripts[0] ?? null,
    chapters,
    currentChapter,
    chapterSummary: {
      total: chapters.length,
      completed: chapters.filter((chapter) => chapter.status === "PUBLISHED").length,
      inProduction: chapters.filter((chapter) => ["IN_PRODUCTION", "IN_REVIEW", "REVISION_REQUIRED"].includes(chapter.status)).length,
      totalPages,
      approvedPages,
      readinessPercent,
    },
    taskSummary: {
      total: data.tasks.length,
      pending: (data.tasks as any[]).filter((task) => !completedTaskStatuses.has(task.status)).length,
      completed: (data.tasks as any[]).filter((task) => completedTaskStatuses.has(task.status)).length,
      pendingReviews: (data.submissions as any[]).filter((submission) => ["SUBMITTED", "MANGAKA_APPROVED"].includes(submission.status)).length,
    },
    recentTasks: (data.tasks as any[]).slice(0, 5).map((task) => ({
      id: String(task._id),
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignedTo ? task.assignedTo.displayName || task.assignedTo.name : null,
    })),
    recentSubmissions: (data.submissions as any[]).slice(0, 5).map((submission) => ({
      id: String(submission._id),
      version: submission.version,
      status: submission.status,
      submittedBy: submission.submittedBy ? submission.submittedBy.displayName || submission.submittedBy.name : null,
      createdAt: submission.createdAt,
    })),
    commentSummary: {
      open: openComments.length,
      resolved: data.comments.length - openComments.length,
      blocking: blockingComments.length,
    },
    recentComments: (data.comments as any[]).slice(0, 5).map((comment) => ({
      id: String(comment._id),
      body: comment.body,
      status: comment.status,
      isBlocking: comment.isBlocking,
      author: comment.authorId ? comment.authorId.displayName || comment.authorId.name : null,
      authorRole: comment.authorId?.role,
      updatedAt: comment.updatedAt,
    })),
    boardReview: data.boardDecision ? {
      status: (data.boardDecision as any).status,
      result: (data.boardDecision as any).result,
      voteCount: data.boardVotes.length,
      updatedAt: (data.boardDecision as any).updatedAt,
    } : null,
    publicationSummary: {
      isReady: chapters.length > 0 && readinessPercent === 100 && blockingComments.length === 0,
      scheduled: data.publications.filter((publication: any) => publication.scheduledFor && !publication.publishedAt).length,
      published: data.publications.filter((publication: any) => publication.publishedAt).length,
      blockers: [
        ...(chapters.length === 0 ? ["No chapters created"] : []),
        ...(readinessPercent < 100 ? ["Not all pages are approved"] : []),
        ...(blockingComments.length > 0 ? [`${blockingComments.length} blocking comment(s) remain`] : []),
      ],
    },
    rankingSummary: data.ranking ? {
      period: (data.ranking as any).period,
      voteCount: (data.ranking as any).voteCount,
      readerScore: (data.ranking as any).readerScore,
      finalScore: (data.ranking as any).finalScore,
      status: (data.ranking as any).status,
    } : null,
    payrollSummary: {
      totalEarnings: (data.earnings as any[]).reduce((sum, earning) => sum + earning.finalPayment, 0),
      unpaid: (data.earnings as any[]).filter((earning) => unpaidStatuses.has(earning.status)).reduce((sum, earning) => sum + earning.finalPayment, 0),
    },
    allowedActions: {
      canEditSeries: role === "MANGAKA" && ["DRAFT", "REVISION_REQUESTED"].includes(series.status),
      canUploadManuscript: role === "MANGAKA" && String(series.ownerId) === userId,
      canOpenWorkspace: ["APPROVED", "ONGOING", "AT_RISK", "COMPLETED"].includes(series.status),
    },
  }
}


// ---------- Save as Draft / partial update ----------

export interface UpdateSeriesServiceInput {
  seriesId: string
  userId: string
  patch: {
    title?: string
    synopsis?: string
    logline?: string
    premise?: string
    characters?: string
    conflict?: string
    targetAudience?: string
    publicationType?: string
    tags?: string[]
    genres?: string[]
  }
}

export async function updateSeriesService(input: UpdateSeriesServiceInput) {
  const trimmed = input.seriesId.trim()
  if (!trimmed) throw new AppError("Series id is required", 400)

  const patch = { ...input.patch }
  if (patch.title !== undefined) patch.title = patch.title.trim()
  if (patch.synopsis !== undefined) patch.synopsis = patch.synopsis.trim()
  if (patch.logline !== undefined) patch.logline = patch.logline.trim()
  if (patch.premise !== undefined) patch.premise = patch.premise.trim()
  if (patch.characters !== undefined) patch.characters = patch.characters.trim()
  if (patch.conflict !== undefined) patch.conflict = patch.conflict.trim()
  if (patch.targetAudience !== undefined) patch.targetAudience = patch.targetAudience.trim()
  if (patch.publicationType !== undefined) patch.publicationType = patch.publicationType.trim()

  try {
    return await updateSeriesRepository(trimmed, input.userId, patch)
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Only the owner Mangaka")) throw new AppError("Only the owner Mangaka can update this series", 403)
    if (message.includes("Series can only be edited")) throw new AppError("Series can only be edited while in DRAFT or REVISION_REQUESTED", 409)
    if (message.includes("Series not found")) throw new AppError("Series not found", 404)
    throw new AppError("Unable to update series", 400)
  }
}
