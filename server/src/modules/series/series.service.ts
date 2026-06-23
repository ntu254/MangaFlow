import { Series } from "./series.model.js"
import { Manuscript, SeriesMember } from "./series.model.js"
import { User } from "../auth/auth.model.js"
import { Chapter, FileAsset } from "../chapter/chapter.model.js"
import { Task } from "../task/task.model.js"
import { Submission } from "../submission/submission.model.js"
import { Comment } from "../comment/comment.model.js"
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
  createSeriesFileAssetDraft,
  getSeriesSummaryData,
  getLatestManuscriptBySeries,
} from "./series.repository.js"
import { createPresignedUploadUrl, deleteFileAsset, checkObjectExists, createPresignedDownloadUrl } from "../chapter/file.service.js"
import { Types } from "mongoose"
import type { PublicationType } from "../../shared/workflow/status.js"
import { notifyRole, notifyUsers, recordAuditLog } from "../../shared/workflow/events.js"

function assertIsSeriesOwner(series: any, userId: string, role: string) {
  if (role === "ADMIN") return;
  if (String(series.ownerId) !== userId) {
    throw new AppError("Only the owner Mangaka or Admin can perform this action", 403);
  }
}

function isDuplicateManuscriptVersionError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000 &&
      "keyPattern" in error &&
      typeof error.keyPattern === "object" &&
      error.keyPattern &&
      "seriesId" in error.keyPattern &&
      "version" in error.keyPattern,
  )
}

export interface CreateSeriesServiceInput {
  title: string
  synopsis: string
  logline?: string
  premise?: string
  characters?: string
  conflict?: string
  targetAudience?: string
  requestedPublicationType?: PublicationType
  publicationType?: PublicationType
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

  const series = await createSeriesRepository({
    title: input.title.trim(),
    synopsis: input.synopsis.trim(),
    logline: input.logline?.trim() || undefined,
    premise: input.premise?.trim() || undefined,
    characters: input.characters?.trim() || undefined,
    conflict: input.conflict?.trim() || undefined,
    targetAudience: input.targetAudience?.trim() || undefined,
    requestedPublicationType: input.requestedPublicationType ?? input.publicationType,
    publicationType: undefined,
    tags: input.tags,
    genres: input.genres,
    ownerId: input.ownerId,
  })
  void recordAuditLog({ event: "SERIES_CREATED", actorId: input.ownerId, entityType: "Series", entityId: series.id }).catch(() => undefined)
  return series
}


export interface CreateCoverUploadUrlInput {
  seriesId: string
  userId: string
  originalName: string
  contentType: string
  expiresIn?: number
}

export async function createCoverUploadUrlService(input: CreateCoverUploadUrlInput) {
  const series = await getSeriesById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)
  if (series.ownerId.toString() !== input.userId) {
    throw new AppError("Only the series owner can upload cover", 403)
  }

  const { pathBuilder, createPresignedUploadUrl } = await import("../chapter/file.service.js")
  const ext = input.originalName.split(".").pop()?.toLowerCase() || "bin"
  const filename = `cover-${Date.now()}.${ext}`
  const customR2Key = pathBuilder.seriesCover(input.seriesId, 1, filename)
  const signed = await createPresignedUploadUrl(input.originalName, input.contentType, input.expiresIn, customR2Key)

  return {
    uploadUrl: signed.uploadUrl,
    r2Key: signed.r2Key,
    expiresIn: signed.expiresIn,
  }
}

export interface CreateManuscriptUploadServiceInput {
  seriesId: string
  userId: string
  originalName: string
  contentType: string
  size: number
  expiresIn?: number
  assetType?: "manuscript" | "cover_draft" | "character_concept" | "reference_image" | "other"
  slot?: string
}

export async function createManuscriptUploadService(input: CreateManuscriptUploadServiceInput) {
  const series = await getSeriesById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)
  if (series.ownerId.toString() !== input.userId) {
    throw new AppError("Only the series owner can upload manuscripts", 403)
  }

  if (!["DRAFT", "REVISION_REQUESTED"].includes(series.status)) {
    throw new AppError("Manuscripts can only be uploaded while the series is in DRAFT or REVISION_REQUESTED", 409)
  }

  const latest = await getLatestManuscriptBySeries(input.seriesId)
  const isDraft = latest && latest.status === "DRAFT"
  const version = isDraft ? latest.version : (latest ? latest.version + 1 : 1)
  const versionId = isDraft ? String(latest._id) : new Types.ObjectId().toString()
  const fileAssetId = new Types.ObjectId().toString()
  const assetType = input.assetType ?? "manuscript"
  const typeKey = assetType.replaceAll("_", "-")
  const ext = input.originalName.split(".").pop()?.toLowerCase() || "bin"
  const fileAssetShortId = String(fileAssetId).slice(-6)
  
  const filename = `${fileAssetShortId}.${ext}`
  
  const customR2Key = (await import("../chapter/file.service.js")).pathBuilder.seriesManuscript(input.seriesId, version, filename)

  const signed = await createPresignedUploadUrl(input.originalName, input.contentType, input.expiresIn, customR2Key)
  let persisted
  try {
    persisted = assetType === "manuscript"
      ? await createManuscriptUploadDraft({
          fileAssetId,
          versionId,
          seriesId: input.seriesId,
          uploadedBy: input.userId,
          r2Key: signed.r2Key,
          originalName: input.originalName,
          mimeType: input.contentType,
          size: input.size,
          slot: input.slot,
        })
      : await createSeriesFileAssetDraft({
          fileAssetId,
          seriesId: input.seriesId,
          uploadedBy: input.userId,
          r2Key: signed.r2Key,
          originalName: input.originalName,
          mimeType: input.contentType,
          size: input.size,
          assetType,
          slot: input.slot,
        })
  } catch (error) {
    if (isDuplicateManuscriptVersionError(error)) {
      throw new AppError("Unable to allocate manuscript version. Please retry the upload.", 409)
    }
    throw error
  }

  if (assetType === "manuscript" && persisted.manuscript?.id) {
    void recordAuditLog({
      event: "MANUSCRIPT_VERSION_UPLOADED",
      actorId: input.userId,
      entityType: "Manuscript",
      entityId: persisted.manuscript.id,
      metadata: { seriesId: input.seriesId, slot: input.slot },
    }).catch(() => undefined)
  }

  return {
    uploadUrl: signed.uploadUrl,
    fileAssetId: persisted.fileAsset.id,
    manuscriptId: persisted.manuscript?.id,
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
    const series = await submitSeriesRepository(trimmed, userId)
    const assignedEditors = await SeriesMember.find({
      seriesId: trimmed,
      role: "EDITOR",
      status: "ACTIVE",
      isActive: true,
    }).select("userId")
    void Promise.all([
      assignedEditors.length > 0 ? notifyUsers(assignedEditors.map((member) => String(member.userId)), {
        event: "SERIES_SUBMITTED_TO_EDITOR",
        title: "Assigned series proposal submitted",
        message: `${series.title} is ready for editor review.`,
        link: `/app/editor/series/${series.id}/review`,
      }) : notifyRole("EDITOR", {
        event: "SERIES_SUBMITTED_TO_EDITOR",
        title: "Unassigned series proposal submitted",
        message: `${series.title} is ready for editor review.`,
        link: `/app/editor/series/${series.id}/review`,
      }),
      recordAuditLog({ event: "SERIES_SUBMITTED_TO_EDITOR", actorId: userId, entityType: "Series", entityId: trimmed }),
    ]).catch(() => undefined)
    return series
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Only the owner Mangaka")) throw new AppError("Only the owner Mangaka can submit this series", 403)
    if (message.includes("Only draft or revision-requested series")) throw new AppError("Only draft or revision-requested series can be submitted", 409)
    if (message.includes("Initial manuscript")) throw new AppError("Initial manuscript is required before submit", 400)
    if (message.includes("new draft manuscript")) throw new AppError("Upload a new draft manuscript version before submit", 400)
    if (message.includes("Tantou Editor")) throw new AppError("Admin must assign a Tantou Editor before submit", 409)
    if (message.includes("Required series fields")) throw new AppError("Required series fields must be completed before submit", 400)
    if (message.includes("Series not found")) throw new AppError("Series not found", 404)
    throw new AppError("Unable to submit series", 400)
  }
}

export async function assignTantouEditorService(input: {
  seriesId: string
  editorUserId: string
  actorId: string
}) {
  const series = await Series.findById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)

  const editor = await User.findById(input.editorUserId)
  if (!editor) throw new AppError("Editor user not found", 404)
  if (!editor.isActive) throw new AppError("Editor user is not active", 400)
  if (editor.role !== "EDITOR") throw new AppError("Assigned user must have EDITOR role", 400)

  await SeriesMember.updateMany(
    {
      seriesId: input.seriesId,
      role: "EDITOR",
      userId: { $ne: editor._id },
      status: { $ne: "REMOVED" },
    },
    { $set: { status: "REMOVED", isActive: false } },
  )

  const existingMember = await SeriesMember.findOne({
    seriesId: input.seriesId,
    userId: editor._id,
  })

  const member = existingMember ?? await SeriesMember.create({
    seriesId: input.seriesId,
    userId: editor._id,
    role: "EDITOR",
    status: "ACTIVE",
    isActive: true,
    accessScope: "FULL",
  })
  if (existingMember) {
    member.role = "EDITOR"
    member.status = "ACTIVE"
    member.isActive = true
    member.accessScope = "FULL"
    await member.save()
  }

  void Promise.all([
    notifyUsers([String(editor._id)], {
      event: "TANTOU_EDITOR_ASSIGNED",
      title: "You were assigned as Tantou Editor",
      message: `${series.title} is now assigned to you from proposal review through production.`,
      link: `/app/editor/series/${series.id}/review`,
    }),
    recordAuditLog({
      event: "TANTOU_EDITOR_ASSIGNED",
      actorId: input.actorId,
      entityType: "SeriesMember",
      entityId: String(member._id),
      metadata: { seriesId: input.seriesId, editorUserId: String(editor._id) },
    }),
  ]).catch(() => undefined)

  return member.populate("userId", "name displayName email role")
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

  const completedTaskStatuses = new Set(["EDITOR_APPROVED", "REJECTED", "CANCELLED"])
  const openComments = (data.comments as any[]).filter((comment) => comment.status !== "RESOLVED")
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
    files: data.files.map((file: any) => ({
      id: String(file._id),
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      assetType: file.assetType,
      status: file.status || "ACTIVE",
      createdAt: file.createdAt,
    })),
    chapters,
    currentChapter,
    chapterSummary: {
      total: chapters.length,
      completed: chapters.filter((chapter) => chapter.status === "PUBLISHED").length,
      inProduction: chapters.filter((chapter) => chapter.status === "IN_PRODUCTION").length,
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
      createdAt: task.createdAt,
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
      canUploadManuscript: role === "MANGAKA" && String(series.ownerId) === userId && ["DRAFT", "REVISION_REQUESTED"].includes(series.status),
      canOpenWorkspace: ["ONGOING", "AT_RISK", "COMPLETED"].includes(series.status),
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
    requestedPublicationType?: PublicationType
    publicationType?: PublicationType
    tags?: string[]
    genres?: string[]
    cover?: string
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
  if (patch.cover !== undefined) patch.cover = patch.cover.trim()
  if (patch.publicationType !== undefined && patch.requestedPublicationType === undefined) {
    patch.requestedPublicationType = patch.publicationType
    delete patch.publicationType
  }

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

export async function deleteManuscriptFileService(seriesId: string, fileAssetId: string, userId: string, role: string) {
  const series = await getSeriesById(seriesId)
  if (!series) throw new AppError("Series not found", 404)
  assertIsSeriesOwner(series, userId, role)

  const fileAsset = await FileAsset.findOne({ _id: fileAssetId, seriesId })
  if (!fileAsset) throw new AppError("File not found or doesn't belong to this series", 404)

  if (fileAsset.status === "DELETED") return

  // Mark deleted
  fileAsset.status = "DELETED"
  await fileAsset.save()

  // Attempt to delete from R2, ignore if it fails or already missing
  try {
    await deleteFileAsset(fileAsset.r2Key)
  } catch (error) {
    console.error(`Failed to delete object from R2: ${fileAsset.r2Key}`, error)
  }
}

export async function downloadManuscriptFileService(seriesId: string, fileAssetId: string, _userId: string, _role: string) {
  // Can add specific membership checks here. Currently checking if series exists.
  const series = await getSeriesById(seriesId)
  if (!series) throw new AppError("Series not found", 404)

  const fileAsset = await FileAsset.findOne({ _id: fileAssetId, seriesId, status: { $ne: "DELETED" } })
  if (!fileAsset) throw new AppError("File not found", 404)

  // Check existence
  const exists = await checkObjectExists(fileAsset.r2Key)
  if (!exists) {
    fileAsset.status = "MISSING"
    await fileAsset.save()
    throw new AppError("File missing from storage", 404)
  }

  return createPresignedDownloadUrl(fileAsset.r2Key)
}

export async function verifyManuscriptFilesService(seriesId: string, _userId: string, _role: string) {
  const series = await getSeriesById(seriesId)
  if (!series) throw new AppError("Series not found", 404)

  const files = await FileAsset.find({ seriesId, status: { $ne: "DELETED" } })

  await Promise.all(
    files.map(async (file) => {
      try {
        const exists = await checkObjectExists(file.r2Key)
        const nextStatus = exists ? "ACTIVE" : "MISSING"
        if (file.status !== nextStatus) {
          file.status = nextStatus
          await file.save()
        }
      } catch (error) {
        console.error(`Failed to verify file asset ${String(file._id)} (${file.r2Key})`, error)
      }
    }),
  )

  return files.map((file) => ({
    id: String(file._id),
    status: file.status,
  }))
}

export async function deleteDraftSeriesService(seriesId: string, userId: string, role: string) {
  const series = await getSeriesById(seriesId)
  if (!series) throw new AppError("Series not found", 404)
  assertIsSeriesOwner(series, userId, role)

  if (series.status !== "DRAFT") {
    throw new AppError("Only draft series can be soft deleted", 400)
  }

  await Series.updateOne(
    { _id: seriesId },
    { 
      $set: { 
        deletedAt: new Date(), 
        deletedBy: userId, 
        deleteReason: "Mangaka deleted draft" 
      } 
    }
  )
}

export async function withdrawSeriesProposalService(seriesId: string, userId: string, role: string) {
  const series = await getSeriesById(seriesId)
  if (!series) throw new AppError("Series not found", 404)
  assertIsSeriesOwner(series, userId, role)

  const allowedStatuses = ["EDITOR_REVIEW", "REVISION_REQUESTED", "BOARD_REVIEW"]
  if (!allowedStatuses.includes(series.status)) {
    throw new AppError("Only proposals under review can be withdrawn", 400)
  }

  await Series.updateOne(
    { _id: seriesId },
    { $set: { status: "WITHDRAWN" } }
  )
}

export async function cancelSeriesService(seriesId: string, userId: string, role: string) {
  const series = await getSeriesById(seriesId)
  if (!series) throw new AppError("Series not found", 404)
  assertIsSeriesOwner(series, userId, role)

  const allowedStatuses = ["ONGOING", "AT_RISK"]
  if (!allowedStatuses.includes(series.status)) {
    throw new AppError("Only ongoing or at-risk series can request cancellation", 400)
  }

  await Series.updateOne(
    { _id: seriesId },
    { $set: { cancellationRequestedAt: new Date(), cancellationRequestedBy: userId } }
  )
}

export async function hardDeleteSeriesService(seriesId: string, _userId: string, role: string) {
  if (role !== "ADMIN") {
    throw new AppError("Only admins can perform a hard delete", 403)
  }
  const series = await getSeriesById(seriesId)
  if (!series) throw new AppError("Series not found", 404)
  if (series.status !== "DRAFT") {
    throw new AppError("Only an unsubmitted draft without production history can be hard deleted", 409)
  }

  const [chapterCount, taskCount, submissionCount] = await Promise.all([
    Chapter.countDocuments({ seriesId }),
    Task.countDocuments({ seriesId }),
    Submission.countDocuments({ seriesId }),
  ])
  if (chapterCount > 0 || taskCount > 0 || submissionCount > 0) {
    throw new AppError("Series has production history and must be archived instead", 409)
  }

  // Draft-only cleanup. Deep production entities are never hard deleted here.
  await Promise.all([
    Series.deleteOne({ _id: seriesId }),
    Manuscript.deleteMany({ seriesId }),
    Chapter.deleteMany({ seriesId }),
    FileAsset.deleteMany({ seriesId }),
    Task.deleteMany({ seriesId }),
    Submission.deleteMany({ seriesId }),
    Comment.deleteMany({ seriesId }),
  ])
}
