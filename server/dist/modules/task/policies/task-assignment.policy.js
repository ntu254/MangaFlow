import { AppError } from "../../../shared/errors/AppError.js";
import { User } from "../../auth/auth.model.js";
import { findActiveSeriesMember } from "../../../shared/policies/seriesMember.policy.js";
import { SeriesMember } from "../../series/series.model.js";
export async function assertTaskAssignmentAllowed(input) {
    const assignee = await User.findById(input.assignedTo);
    if (!assignee)
        throw new AppError("Assigned user not found", 404);
    if (!assignee.isActive)
        throw new AppError("Assigned user is not active", 403);
    if (assignee.role !== "ASSISTANT")
        throw new AppError("Assigned user must have system role ASSISTANT", 403);
    // Distinguish "not a member" from "membership exists but inactive" so the error message
    // tells Mangaka/Editor what to fix (re-add vs reactivate).
    const assigneeMembership = await SeriesMember.findOne({ seriesId: input.seriesId, userId: input.assignedTo });
    if (!assigneeMembership)
        throw new AppError("Assigned user is not a member of this series", 403);
    if (assigneeMembership.role !== "ASSISTANT")
        throw new AppError("Only Assistants can be assigned tasks", 403);
    const activeAssigneeMember = await findActiveSeriesMember(input.seriesId, input.assignedTo);
    if (!activeAssigneeMember)
        throw new AppError("Assigned Assistant is not active in this series", 403);
    if (activeAssigneeMember.accessScope !== "TASK_ONLY")
        throw new AppError("Assigned Assistant must use TASK_ONLY access scope", 403);
    const activeAssignerMember = await findActiveSeriesMember(input.seriesId, input.assignedBy);
    if (!activeAssignerMember)
        throw new AppError("Assigner is not active in this series", 403);
    if (!["MANGAKA", "EDITOR"].includes(activeAssignerMember.role))
        throw new AppError("Only Mangaka or Editor can assign tasks", 403);
}
//# sourceMappingURL=task-assignment.policy.js.map