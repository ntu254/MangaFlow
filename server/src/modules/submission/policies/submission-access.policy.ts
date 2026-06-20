import { AppError } from "../../../shared/errors/AppError.js"
import type { UserRole } from "../../auth/auth.types.js"
import { findActiveSeriesMember } from "../../../shared/policies/seriesMember.policy.js"

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

  const member = await findActiveSeriesMember(seriesId, actor.userId)
  if (!member || !allowedRoles.includes(member.role as "MANGAKA" | "EDITOR" | "ASSISTANT")) {
    throw new AppError("Submission review access denied", 403)
  }
  return member
}
