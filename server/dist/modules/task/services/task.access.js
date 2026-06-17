import { AppError } from "../../../shared/errors/AppError.js";
import { findActiveSeriesMember } from "../../../shared/policies/seriesMember.policy.js";
export async function assertSeriesManager(seriesId, actor) {
    const member = await findActiveSeriesMember(seriesId, actor.userId);
    if (!member || !["MANGAKA", "EDITOR"].includes(member.role)) {
        throw new AppError("Only active Mangaka or Editor series members can manage tasks", 403);
    }
}
export async function assertSeriesTaskAccess(seriesId, actor, assignedTo) {
    if (assignedTo && String(assignedTo) === actor.userId) {
        return;
    }
    const member = await findActiveSeriesMember(seriesId, actor.userId);
    if (!member) {
        throw new AppError("Task access denied", 403);
    }
    if (["MANGAKA", "EDITOR"].includes(member.role)) {
        return;
    }
    if (member.role === "ASSISTANT" && member.accessScope === "TASK_ONLY") {
        throw new AppError("Assistant access is limited to assigned tasks", 403);
    }
    throw new AppError("Task access denied", 403);
}
//# sourceMappingURL=task.access.js.map