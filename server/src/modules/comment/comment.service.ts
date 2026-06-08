import { AppError } from "../../shared/errors/AppError.js"
import type { UserRole } from "../auth/auth.types.js"
import { SeriesMember } from "../series/series.model.js"
import {
  countBlockingUnresolvedComments,
  createCommentRecord,
  getChapterForComment,
  getCommentById,
  getPageForComment,
  getRegionForComment,
  getSubmissionForComment,
  getTaskForComment,
  updateCommentStatus,
} from "./comment.repository.js"

interface CommentActor {
  userId: string
  role: UserRole
}

export interface CreateCommentServiceInput {
  actor: CommentActor
  seriesId: string
  chapterId?: string
  pageId?: string
  regionId?: string
  taskId?: string
  submissionId?: string
  body: string
  isBlocking?: boolean
}

interface NormalizedCommentScope {
  seriesId: string
  chapterId?: string
  pageId?: string
  regionId?: string
  taskId?: string
  submissionId?: string
}

async function assertSeriesMember(
  seriesId: string,
  actor: CommentActor,
  allowedRoles: Array<"MANGAKA" | "EDITOR" | "ASSISTANT">,
) {
  if (!allowedRoles.includes(actor.role as "MANGAKA" | "EDITOR" | "ASSISTANT")) {
    throw new AppError("Comment access denied", 403)
  }

  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !member.isActive || !allowedRoles.includes(member.role)) {
    throw new AppError("Comment access denied", 403)
  }
  return member
}

async function normalizeCommentScope(input: CreateCommentServiceInput): Promise<NormalizedCommentScope> {
  const scope: NormalizedCommentScope = {
    seriesId: input.seriesId,
    chapterId: input.chapterId,
    pageId: input.pageId,
    regionId: input.regionId,
    taskId: input.taskId,
    submissionId: input.submissionId,
  }

  if (input.taskId) {
    const task = await getTaskForComment(input.taskId)
    if (!task) throw new AppError("Task not found", 404)
    if (String(task.seriesId) !== input.seriesId) {
      throw new AppError("Task does not belong to the specified series", 400)
    }
    if (input.chapterId && String(task.chapterId) !== input.chapterId) {
      throw new AppError("Task does not belong to the specified chapter", 400)
    }
    scope.chapterId = String(task.chapterId)
    if (task.pageId) scope.pageId = String(task.pageId)
    if (task.regionId) scope.regionId = String(task.regionId)
  }

  if (input.submissionId) {
    const submission = await getSubmissionForComment(input.submissionId)
    if (!submission) throw new AppError("Submission not found", 404)
    if (String(submission.seriesId) !== input.seriesId) {
      throw new AppError("Submission does not belong to the specified series", 400)
    }
    if (input.taskId && String(submission.taskId) !== input.taskId) {
      throw new AppError("Submission does not belong to the specified task", 400)
    }
    scope.taskId = String(submission.taskId)
    scope.chapterId = String(submission.chapterId)
    if (submission.pageId) scope.pageId = String(submission.pageId)
    if (submission.regionId) scope.regionId = String(submission.regionId)
  }

  if (scope.chapterId) {
    const chapter = await getChapterForComment(scope.chapterId)
    if (!chapter) throw new AppError("Chapter not found", 404)
    if (String(chapter.seriesId) !== input.seriesId) {
      throw new AppError("Chapter does not belong to the specified series", 400)
    }
  }

  if (scope.pageId) {
    const page = await getPageForComment(scope.pageId)
    if (!page) throw new AppError("Page not found", 404)
    if (scope.chapterId && String(page.chapterId) !== scope.chapterId) {
      throw new AppError("Page does not belong to the specified chapter", 400)
    }
    if (!scope.chapterId) {
      const chapter = await getChapterForComment(String(page.chapterId))
      if (!chapter) throw new AppError("Chapter not found", 404)
      if (String(chapter.seriesId) !== input.seriesId) {
        throw new AppError("Page does not belong to the specified series", 400)
      }
      scope.chapterId = String(page.chapterId)
    }
  }

  if (scope.regionId) {
    if (!scope.pageId) {
      throw new AppError("Page ID is required when commenting on a region", 400)
    }
    const region = await getRegionForComment(scope.regionId)
    if (!region) throw new AppError("Region not found", 404)
    if (String(region.pageId) !== scope.pageId) {
      throw new AppError("Region does not belong to the specified page", 400)
    }
  }

  return scope
}

async function getCommentOrThrow(commentId: string) {
  const comment = await getCommentById(commentId)
  if (!comment) {
    throw new AppError("Comment not found", 404)
  }
  return comment
}

export async function createCommentService(input: CreateCommentServiceInput) {
  if (!input.body?.trim()) {
    throw new AppError("Comment body is required", 400)
  }

  await assertSeriesMember(input.seriesId, input.actor, ["EDITOR"])
  const scope = await normalizeCommentScope(input)

  return createCommentRecord({
    seriesId: scope.seriesId,
    chapterId: scope.chapterId,
    pageId: scope.pageId,
    regionId: scope.regionId,
    taskId: scope.taskId,
    submissionId: scope.submissionId,
    authorId: input.actor.userId,
    body: input.body.trim(),
    isBlocking: input.isBlocking,
  })
}

export async function markCommentFixedService(commentId: string, actor: CommentActor) {
  const comment = await getCommentOrThrow(commentId)
  await assertSeriesMember(String(comment.seriesId), actor, ["ASSISTANT"])

  if (comment.taskId) {
    const task = await getTaskForComment(String(comment.taskId))
    if (!task || String(task.assignedTo) !== actor.userId) {
      throw new AppError("Assistant can mark fixed only for their assigned task", 403)
    }
  }

  if (comment.status !== "OPEN") {
    throw new AppError("Only open comments can be marked fixed", 409)
  }

  return updateCommentStatus(commentId, "FIXED_BY_ASSISTANT", "fixedBy", actor.userId)
}

export async function verifyCommentFixedService(commentId: string, actor: CommentActor) {
  const comment = await getCommentOrThrow(commentId)
  await assertSeriesMember(String(comment.seriesId), actor, ["MANGAKA"])

  if (comment.status !== "FIXED_BY_ASSISTANT") {
    throw new AppError("Mangaka verification requires Assistant fixed state", 409)
  }

  return updateCommentStatus(commentId, "VERIFIED_BY_MANGAKA", "verifiedBy", actor.userId)
}

export async function resolveCommentService(commentId: string, actor: CommentActor) {
  const comment = await getCommentOrThrow(commentId)
  await assertSeriesMember(String(comment.seriesId), actor, ["EDITOR"])

  if (comment.status !== "VERIFIED_BY_MANGAKA") {
    throw new AppError("Editor resolution requires Mangaka verification first", 409)
  }

  return updateCommentStatus(commentId, "RESOLVED_BY_EDITOR", "resolvedBy", actor.userId)
}

export async function reopenCommentService(commentId: string, actor: CommentActor) {
  const comment = await getCommentOrThrow(commentId)
  await assertSeriesMember(String(comment.seriesId), actor, ["EDITOR"])

  if (!["FIXED_BY_ASSISTANT", "VERIFIED_BY_MANGAKA"].includes(comment.status)) {
    throw new AppError("Editor can reopen only fixed or verified comments", 409)
  }

  return updateCommentStatus(commentId, "OPEN", "reopenedBy", actor.userId)
}

export async function hasBlockingUnresolvedCommentsService(filter: { seriesId?: string; chapterId?: string; taskId?: string }) {
  const count = await countBlockingUnresolvedComments(filter)
  return count > 0
}
