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