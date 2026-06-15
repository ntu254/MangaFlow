import { AppError } from "../../../shared/errors/AppError.js";
import { listTasksByAssignee, listTasksByChapter, listTasksBySeries, getTaskById } from "../task.repository.js";
import { Chapter } from "../../chapter/chapter.model.js";
import { SeriesMember } from "../../series/series.model.js";
import { assertSeriesTaskAccess } from "./task.access.js";
export async function getTaskService(taskId, actor) {
    const task = await getTaskById(taskId);
    if (!task)
        throw new AppError("Task not found", 404);
    await assertSeriesTaskAccess(String(task.seriesId), actor, task.assignedTo);
    return task;
}
export async function listTasksBySeriesService(seriesId, actor, filters) {
    const member = await SeriesMember.findOne({ seriesId, userId: actor.userId });
    if (!member || !member.isActive)
        throw new AppError("Task access denied", 403);
    if (member.role === "ASSISTANT")
        return listTasksBySeries(seriesId, { ...filters, assignedTo: actor.userId });
    if (!["MANGAKA", "EDITOR"].includes(member.role))
        throw new AppError("Task access denied", 403);
    return listTasksBySeries(seriesId, filters);
}
export async function listTasksByChapterService(chapterId, actor) {
    const chapter = await Chapter.findById(chapterId);
    if (!chapter)
        throw new AppError("Chapter not found", 404);
    const seriesId = String(chapter.seriesId);
    const member = await SeriesMember.findOne({ seriesId, userId: actor.userId });
    if (!member || !member.isActive)
        throw new AppError("Task access denied", 403);
    if (member.role === "ASSISTANT") {
        return (await listTasksByChapter(chapterId)).filter((task) => String(task.assignedTo) === actor.userId);
    }
    if (!["MANGAKA", "EDITOR"].includes(member.role))
        throw new AppError("Task access denied", 403);
    return listTasksByChapter(chapterId);
}
export async function listTasksByAssigneeService(assigneeId, actor) {
    if (assigneeId !== actor.userId && actor.role !== "ADMIN")
        throw new AppError("Task access denied", 403);
    return listTasksByAssignee(assigneeId);
}
//# sourceMappingURL=task.queries.js.map