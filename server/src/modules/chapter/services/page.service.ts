import { Page } from "../chapter.model.js"
import { FileAsset } from "../chapter.model.js"
import { AppError } from "../../../shared/errors/AppError.js"
import { createPageRepository, getPagesByChapter } from "../chapter.repository.js"
import { assertCanReadChapter, assertCanWriteChapter, type AccessActor } from "../../../shared/policies/accessPolicy.service.js"
import { Task } from "../../task/task.model.js"

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
    return { ...page, activeTask }
  })
}
export async function deletePageService(chapterId: string, pageId: string, actor: AccessActor) {
  const trimmedChapterId = chapterId.trim()
  const trimmedPageId = pageId.trim()
  if (!trimmedChapterId || !trimmedPageId) throw new AppError("Chapter id and Page id are required", 400)
  
  await assertCanWriteChapter(actor, trimmedChapterId)

  const tasksCount = await Task.countDocuments({ pageId: trimmedPageId })
  if (tasksCount > 0) {
    throw new AppError("Cannot delete page with tasks. Reassign or cancel tasks first.", 400)
  }

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

  const tasksCount = await Task.countDocuments({ pageId: trimmedPageId })
  if (tasksCount > 0) {
    throw new AppError("Cannot replace page asset with active tasks. Reassign or cancel tasks first.", 400)
  }

  const page = await Page.findOne({ _id: trimmedPageId, chapterId: trimmedChapterId })
  if (!page) throw new AppError("Page not found", 404)

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
