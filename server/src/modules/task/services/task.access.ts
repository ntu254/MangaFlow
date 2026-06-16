import { AppError } from "../../../shared/errors/AppError.js"
import { findActiveSeriesMember } from "../../../shared/policies/seriesMember.policy.js"
import type { UserRole } from "../../auth/auth.types.js"

export interface TaskActor {
  userId: string
  role: UserRole
}

export async function assertSeriesManager(seriesId: string, actor: TaskActor): Promise<void> {
  const member = await findActiveSeriesMember(seriesId, actor.userId)
  if (!member || !["MANGAKA", "EDITOR"].includes(member.role)) {
    throw new AppError("Only active Mangaka or Editor series members can manage tasks", 403)
  }
}

export async function assertSeriesTaskAccess(seriesId: string, actor: TaskActor, assignedTo?: unknown): Promise<void> {
  if (assignedTo && String(assignedTo) === actor.userId) {
    return
  }

  const member = await findActiveSeriesMember(seriesId, actor.userId)
  if (!member) {
    throw new AppError("Task access denied", 403)
  }

  if (["MANGAKA", "EDITOR"].includes(member.role)) {
    return
  }

  if (member.role === "ASSISTANT" && member.accessScope === "TASK_ONLY") {
    throw new AppError("Assistant access is limited to assigned tasks", 403)
  }

  throw new AppError("Task access denied", 403)
}
