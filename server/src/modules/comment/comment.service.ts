import { AppError } from "../../shared/errors/AppError.js"
import type { CommentActor } from "./policies/comment-access.policy.js"

export type { CommentActor }

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
  visibility?: "PUBLIC_TO_ASSISTANT" | "MANGAKA_EDITOR_ONLY" | "EDITOR_INTERNAL"
}

export async function createCommentService(input: CreateCommentServiceInput) {
  if (!input.body?.trim()) {
    throw new AppError("Comment body is required", 400)
  }
  const { createCommentService } = await import("./services/comment-query.service.js")
  return createCommentService(input)
}

export { markCommentFixedService, verifyCommentFixedService, resolveCommentService, reopenCommentService } from "./services/comment-command.service.js"
export { hasBlockingUnresolvedCommentsService, listCommentsByTaskService } from "./services/comment-query.service.js"
