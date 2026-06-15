import { AppError } from "../../../shared/errors/AppError.js"
import type { UserRole } from "../../auth/auth.types.js"
import { SeriesMember } from "../../series/series.model.js"

export interface CommentActor {
  userId: string
  role: UserRole
}

export async function assertCommentSeriesMember(
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
