import { AppError } from "../../../shared/errors/AppError.js"
import { getCommentById } from "../comment.repository.js"

export async function getCommentOrThrow(commentId: string) {
  const comment = await getCommentById(commentId)
  if (!comment) {
    throw new AppError("Comment not found", 404)
  }
  return comment
}
