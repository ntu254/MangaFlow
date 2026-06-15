import { AppError } from "../../../shared/errors/AppError.js"
import { getTaskForComment, updateCommentStatus } from "../comment.repository.js"
import { assertCommentSeriesMember, type CommentActor } from "../policies/comment-access.policy.js"
import {
  assertEditorReopenTransition,
  assertEditorResolveTransition,
  assertMangakaVerifyTransition,
  assertMarkFixedTransition,
} from "../guards/comment-transition.guard.js"
import { getCommentOrThrow } from "./comment.shared.js"

export async function markCommentFixedService(commentId: string, actor: CommentActor) {
  const comment = await getCommentOrThrow(commentId)
  await assertCommentSeriesMember(String(comment.seriesId), actor, ["ASSISTANT"])

  if (comment.taskId) {
    const task = await getTaskForComment(String(comment.taskId))
    if (!task || String(task.assignedTo) !== actor.userId) {
      throw new AppError("Assistant can mark fixed only for their assigned task", 403)
    }
  }

  assertMarkFixedTransition(comment.status)
  return updateCommentStatus(commentId, "FIXED_BY_ASSISTANT", "fixedBy", actor.userId)
}

export async function verifyCommentFixedService(commentId: string, actor: CommentActor) {
  const comment = await getCommentOrThrow(commentId)
  await assertCommentSeriesMember(String(comment.seriesId), actor, ["MANGAKA"])
  assertMangakaVerifyTransition(comment.status)
  return updateCommentStatus(commentId, "VERIFIED_BY_MANGAKA", "verifiedBy", actor.userId)
}

export async function resolveCommentService(commentId: string, actor: CommentActor) {
  const comment = await getCommentOrThrow(commentId)
  await assertCommentSeriesMember(String(comment.seriesId), actor, ["EDITOR"])
  assertEditorResolveTransition(comment.status)
  return updateCommentStatus(commentId, "RESOLVED_BY_EDITOR", "resolvedBy", actor.userId)
}

export async function reopenCommentService(commentId: string, actor: CommentActor) {
  const comment = await getCommentOrThrow(commentId)
  await assertCommentSeriesMember(String(comment.seriesId), actor, ["EDITOR"])
  assertEditorReopenTransition(comment.status)
  return updateCommentStatus(commentId, "OPEN", "reopenedBy", actor.userId)
}
