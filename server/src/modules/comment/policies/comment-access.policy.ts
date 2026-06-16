import { AppError } from "../../../shared/errors/AppError.js"
import type { UserRole } from "../../auth/auth.types.js"
import { findActiveSeriesMember } from "../../../shared/policies/seriesMember.policy.js"

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

  const member = await findActiveSeriesMember(seriesId, actor.userId)
  if (!member || !allowedRoles.includes(member.role as "MANGAKA" | "EDITOR" | "ASSISTANT")) {
    throw new AppError("Comment access denied", 403)
  }
  return member
}
