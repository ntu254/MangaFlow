import { countBlockingUnresolvedComments, createCommentRecord, listCommentsByTask } from "../comment.repository.js"
import { getTaskService } from "../../task/task.service.js"
import { assertCommentSeriesMember, type CommentActor } from "../policies/comment-access.policy.js"
import { normalizeCommentScope } from "./comment-scope.service.js"
import type { CreateCommentServiceInput } from "../comment.service.js"

export async function createCommentService(input: CreateCommentServiceInput) {
  await assertCommentSeriesMember(input.seriesId, input.actor, ["EDITOR"])
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

export async function hasBlockingUnresolvedCommentsService(filter: { seriesId?: string; chapterId?: string; taskId?: string }) {
  const count = await countBlockingUnresolvedComments(filter)
  return count > 0
}

export async function listCommentsByTaskService(taskId: string, actor: CommentActor) {
  await getTaskService(taskId, actor)
  return listCommentsByTask(taskId)
}
