import { Chapter, FileAsset, Page } from "../chapter.model.js"
import { AppError } from "../../../shared/errors/AppError.js"
import { createPageRepository, getPagesByChapter } from "../chapter.repository.js"
import { assertCanReadChapter, assertCanWriteChapter, type AccessActor } from "../../../shared/policies/accessPolicy.service.js"
import { Task } from "../../task/task.model.js"
import { Submission } from "../../submission/submission.model.js"

const ACTIVE_TASK_STATUSES = ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"]

async function assertPageCanBeChanged(chapterId: string, pageId: string) {
  const page = await Page.findOne({ _id: pageId, chapterId, deletedAt: { $exists: false } })
  if (!page) throw new AppError("Page not found", 404)

  const [chapter, activeTask, submission, approvedTask] = await Promise.all([
    Chapter.findById(chapterId),
    Task.findOne({ pageId, status: { $in: ACTIVE_TASK_STATUSES } }),
    Submission.exists({ pageId }),
    Task.exists({ pageId, status: "EDITOR_APPROVED" }),
  ])
  if (chapter?.status === "PUBLISHED") {
    throw new AppError("Published chapter pages cannot be changed", 409)
  }
  if (activeTask) {
    throw new AppError("This page has active tasks. Cancel or finish tasks first.", 409)
  }
  if (submission || approvedTask) {
    throw new AppError("Pages with submissions or approved work cannot be changed", 409)
  }
  return page
}

export async function createPageService(chapterId: string, pageNumber: number, actor: AccessActor) {
  const trimmed = chapterId.trim()
  if (!trimmed) throw new AppError("Chapter id is required", 400)
  await assertCanWriteChapter(actor, trimmed)

  if (typeof pageNumber !== "number" || pageNumber < 1) throw new AppError("Valid page number is required", 400)
  try {
    return await createPageRepository(trimmed, pageNumber)
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Chapter not found")) throw new AppError("Chapter not found", 404)
    if (message.includes("already exists")) throw new AppError(message, 409)
    throw new AppError("Unable to create page", 400)
  }
}

export async function listPagesService(chapterId: string, actor: AccessActor) {
  const trimmed = chapterId.trim()
  if (!trimmed) throw new AppError("Chapter id is required", 400)
  await assertCanReadChapter(actor, trimmed)
  const pages = await getPagesByChapter(trimmed)
  
  const activeLockStatuses = ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"]
  const tasks = await Task.find({ 
    chapterId: trimmed, 
    status: { $in: activeLockStatuses } 
  }).sort({ createdAt: -1 })
    .populate("assignedTo", "name")
    .populate("taskTypeId", "name")
    .populate("currentSubmissionId", "version reviewerNote status")
    .lean()

  return pages.map(page => {
    const pageTask = tasks.find(t => String(t.pageId) === String(page._id))
    let activeTask = undefined
    if (pageTask) {
      activeTask = {
        id: String(pageTask._id),
        status: pageTask.status,
        assignedTo: pageTask.assignedTo ? {
          id: String((pageTask.assignedTo as any)._id),
          name: (pageTask.assignedTo as any).name
        } : undefined,
        taskType: pageTask.taskTypeId ? {
          id: String((pageTask.taskTypeId as any)._id),
          name: (pageTask.taskTypeId as any).name
        } : undefined,
        currentSubmissionId: pageTask.currentSubmissionId ? String((pageTask.currentSubmissionId as any)._id) : undefined,
        revisionRequestedByRole: pageTask.revisionRequestedByRole,
        revisionFeedback: pageTask.currentSubmissionId ? {
          submissionId: String((pageTask.currentSubmissionId as any)._id),
          version: (pageTask.currentSubmissionId as any).version,
          reviewerNote: (pageTask.currentSubmissionId as any).reviewerNote,
          reviewerRole: pageTask.revisionRequestedByRole
        } : undefined
      }
    }
    return {
      ...page,
      id: String(page._id),
      chapterId: String(page.chapterId),
      originalFileAssetId: page.originalFileAssetId ? String(page.originalFileAssetId) : undefined,
      workingFileAssetId: page.workingFileAssetId ? String(page.workingFileAssetId) : undefined,
      thumbnailFileAssetId: page.thumbnailFileAssetId ? String(page.thumbnailFileAssetId) : undefined,
      activeTask,
    }
  })
}
export async function deletePageService(chapterId: string, pageId: string, actor: AccessActor) {
  const trimmedChapterId = chapterId.trim()
  const trimmedPageId = pageId.trim()
  if (!trimmedChapterId || !trimmedPageId) throw new AppError("Chapter id and Page id are required", 400)
  
  await assertCanWriteChapter(actor, trimmedChapterId)

  await assertPageCanBeChanged(trimmedChapterId, trimmedPageId)

  await Page.updateOne({ _id: trimmedPageId, chapterId: trimmedChapterId }, {
    $set: {
      deletedAt: new Date(),
      deletedBy: actor.userId,
      deleteReason: "User initiated soft delete"
    }
  })
}

export async function replacePageAssetService(chapterId: string, pageId: string, newOriginalFileAssetId: string, actor: AccessActor) {
  const trimmedChapterId = chapterId.trim()
  const trimmedPageId = pageId.trim()
  if (!trimmedChapterId || !trimmedPageId || !newOriginalFileAssetId) throw new AppError("Chapter id, Page id, and new asset id are required", 400)
  
  await assertCanWriteChapter(actor, trimmedChapterId)

  const page = await assertPageCanBeChanged(trimmedChapterId, trimmedPageId)

  const oldAssetId = page.originalFileAssetId

  await Page.updateOne({ _id: trimmedPageId }, {
    $set: {
      originalFileAssetId: newOriginalFileAssetId
    }
  })

  if (oldAssetId) {
    await FileAsset.updateOne({ _id: oldAssetId }, {
      $set: {
        status: "DELETED"
      }
    })
  }
}
