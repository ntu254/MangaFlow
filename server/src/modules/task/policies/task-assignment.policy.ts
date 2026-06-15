import { AppError } from "../../../shared/errors/AppError.js"
import { User } from "../../auth/auth.model.js"
import { SeriesMember } from "../../series/series.model.js"

export async function assertTaskAssignmentAllowed(input: { seriesId: string; assignedTo: string; assignedBy: string }): Promise<void> {
  const assignee = await User.findById(input.assignedTo)
  if (!assignee) throw new AppError("Assigned user not found", 404)
  if (!assignee.isActive) throw new AppError("Assigned user is not active", 403)
  if (assignee.role !== "ASSISTANT") throw new AppError("Assigned user must have system role ASSISTANT", 403)

  const assigneeMember = await SeriesMember.findOne({ seriesId: input.seriesId, userId: input.assignedTo })
  if (!assigneeMember) throw new AppError("Assigned user is not a member of this series", 403)
  if (assigneeMember.role !== "ASSISTANT") throw new AppError("Only Assistants can be assigned tasks", 403)
  if (!assigneeMember.isActive) throw new AppError("Assigned Assistant is not active", 403)
  if (assigneeMember.accessScope !== "TASK_ONLY") throw new AppError("Assigned Assistant must use TASK_ONLY access scope", 403)

  const assignerMember = await SeriesMember.findOne({ seriesId: input.seriesId, userId: input.assignedBy })
  if (!assignerMember) throw new AppError("Assigner is not a member of this series", 403)
  if (!["MANGAKA", "EDITOR"].includes(assignerMember.role)) throw new AppError("Only Mangaka or Editor can assign tasks", 403)
  if (!assignerMember.isActive) throw new AppError("Assigner is not active", 403)
}
