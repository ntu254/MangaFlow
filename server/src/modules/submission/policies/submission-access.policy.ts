import { AppError } from "../../../shared/errors/AppError.js"
import type { UserRole } from "../../auth/auth.types.js"
import { SeriesMember } from "../../series/series.model.js"

export interface SubmissionActor {
  userId: string
  role: UserRole
}

export async function assertSubmissionSeriesMember(
  seriesId: string,
  actor: SubmissionActor,
  allowedRoles: Array<"MANGAKA" | "EDITOR" | "ASSISTANT">,
) {
  if (!allowedRoles.includes(actor.role as "MANGAKA" | "EDITOR" | "ASSISTANT")) {
    throw new AppError("Submission review access denied", 403)
  }

  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !member.isActive || !allowedRoles.includes(member.role)) {
    throw new AppError("Submission review access denied", 403)
  }
  return member
}
