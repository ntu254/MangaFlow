import { Chapter, Page } from "../chapter.model.js"
import { Task } from "../../task/task.model.js"
import { Submission } from "../../submission/submission.model.js"
﻿import { AppError } from "../../../shared/errors/AppError.js"
import { createChapterRepository, getChapterById, listChaptersBySeries, updateChapterStatus } from "../chapter.repository.js"
import { assertCanReadChapter, assertCanWriteChapter, type AccessActor } from "../../../shared/policies/accessPolicy.service.js"
import type { ChapterStatus } from "../../../shared/workflow/status.js"

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
    if (message.includes("Series not found")) throw new AppError("Series not found", 404)
    if (message.includes("Chapter creation not allowed")) throw new AppError(message, 409)
    if (message.includes("already exists")) throw new AppError(message, 409)
    throw new AppError("Unable to create chapter", 400)
  }
}

export async function listChaptersService(seriesId: string) {
  if (!seriesId?.trim()) throw new AppError("Series id is required", 400)
  return listChaptersBySeries(seriesId.trim())
}

export async function getChapterService(chapterId: string, actor: AccessActor) {
  const trimmed = chapterId.trim()
  if (!trimmed) throw new AppError("Chapter id is required", 400)
  await assertCanReadChapter(actor, trimmed)

  const chapter = await getChapterById(trimmed)
  if (!chapter) throw new AppError("Chapter not found", 404)
  return chapter
}

export async function updateChapterStatusService(chapterId: string, status: string, actor: AccessActor) {
  const trimmed = chapterId.trim()
  if (!trimmed) throw new AppError("Chapter id is required", 400)
  await assertCanWriteChapter(actor, trimmed)

  if (!status?.trim()) throw new AppError("Status is required", 400)

  const chapter = await getChapterById(trimmed)
  if (!chapter) throw new AppError("Chapter not found", 404)

  // Allowed direct transitions:
  // DRAFT -> IN_PRODUCTION (manual start of production)
  // DRAFT/IN_PRODUCTION -> ARCHIVED (archive/cancel)
  if (status === "IN_PRODUCTION") {
    if (chapter.status !== "DRAFT") {
      throw new AppError("Only DRAFT chapters can be transitioned to IN_PRODUCTION", 409)
    }
  } else if (status === "ARCHIVED") {
    if (!['DRAFT', 'IN_PRODUCTION'].includes(chapter.status)) {
      throw new AppError("Only DRAFT or IN_PRODUCTION chapters can be archived", 409)
    }
  } else {
    throw new AppError("Chapter lifecycle transitions are managed by page upload, readiness, and publication workflows", 409)
  }

  const updated = await updateChapterStatus(trimmed, status as ChapterStatus)
  if (!updated) throw new AppError("Chapter not found", 404)
  return updated
}
export async function deleteChapterService(chapterId: string, actor: AccessActor) {
  const trimmed = chapterId.trim()
  if (!trimmed) throw new AppError("Chapter id is required", 400)
  await assertCanWriteChapter(actor, trimmed)

  const chapter = await getChapterById(trimmed)
  if (!chapter) throw new AppError("Chapter not found", 404)

  if (chapter.status === "READY_FOR_PUBLICATION" || chapter.status === "PUBLISHED") {
    throw new AppError(`Cannot delete a chapter that is ${chapter.status}. Archive it instead.`, 400)
  }

  const activeTaskStatuses = ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"]
  const activeTasksCount = await Task.countDocuments({ chapterId: trimmed, status: { $in: activeTaskStatuses } })
  const activeSubmissionsCount = await Submission.countDocuments({
    chapterId: trimmed,
    status: { $in: ["DRAFT", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"] },
  })

  if (activeTasksCount > 0 || activeSubmissionsCount > 0) {
    throw new AppError("Cannot delete chapter with active tasks or submissions. Cancel or resolve tasks first.", 400)
  }

  await Chapter.updateOne({ _id: trimmed }, { 
    $set: { 
      deletedAt: new Date(), 
      deletedBy: actor.userId,
      deleteReason: "User initiated soft delete" 
    } 
  })

  await Page.updateMany({ chapterId: trimmed }, {
    $set: {
      deletedAt: new Date(),
      deletedBy: actor.userId,
      deleteReason: "Cascade delete from chapter"
    }
  })
}

export async function cancelChapterService(chapterId: string, actor: AccessActor) {
  const trimmed = chapterId.trim()
  if (!trimmed) throw new AppError("Chapter id is required", 400)
  await assertCanWriteChapter(actor, trimmed)

  const chapter = await getChapterById(trimmed)
  if (!chapter) throw new AppError("Chapter not found", 404)

  if (!['DRAFT', 'IN_PRODUCTION'].includes(chapter.status)) {
    throw new AppError("Only DRAFT or IN_PRODUCTION chapters can be cancelled", 400)
  }

  // Cancel all active tasks in this chapter
  const activeTaskStatuses = ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"]
  await Task.updateMany(
    { chapterId: trimmed, status: { $in: activeTaskStatuses } },
    { $set: { status: "CANCELLED" } }
  )

  await Chapter.updateOne({ _id: trimmed }, { 
    $set: { 
      status: "ARCHIVED",
      archivedAt: new Date(),
      archiveReason: "Chapter cancelled by user"
    } 
  })
}
