import { AppError } from "../../../shared/errors/AppError.js";
import { Chapter, Page, Region } from "../../chapter/chapter.model.js";
import { Series } from "../../series/series.model.js";
import { TaskType } from "../task.model.js";
export async function validateTaskCreationScope(input) {
    const series = await Series.findById(input.seriesId);
    if (!series)
        throw new AppError("Series not found", 404);
    const allowedStatuses = ["APPROVED", "ONGOING", "AT_RISK"];
    if (!allowedStatuses.includes(series.status)) {
        throw new AppError(`Task creation not allowed. Series status is ${series.status}. Must be APPROVED, ONGOING, or AT_RISK.`, 409);
    }
    const chapter = await Chapter.findById(input.chapterId);
    if (!chapter)
        throw new AppError("Chapter not found", 404);
    if (String(chapter.seriesId) !== input.seriesId)
        throw new AppError("Chapter does not belong to the specified series", 400);
    const taskType = await TaskType.findById(input.taskTypeId);
    if (!taskType)
        throw new AppError("Task type not found", 404);
    if (!taskType.isActive)
        throw new AppError("Task type is not active", 409);
    if (input.pageId) {
        const page = await Page.findById(input.pageId);
        if (!page)
            throw new AppError("Page not found", 404);
        if (String(page.chapterId) !== input.chapterId)
            throw new AppError("Page does not belong to the specified chapter", 400);
    }
    if (input.regionId) {
        if (!input.pageId)
            throw new AppError("Page ID is required when assigning a region task", 400);
        const region = await Region.findById(input.regionId);
        if (!region)
            throw new AppError("Region not found", 404);
        if (String(region.pageId) !== input.pageId)
            throw new AppError("Region does not belong to the specified page", 400);
    }
    if (input.contextPageIds && input.contextPageIds.length > 0) {
        const pages = await Page.find({ _id: { $in: input.contextPageIds }, chapterId: input.chapterId });
        if (pages.length !== input.contextPageIds.length) {
            throw new AppError("One or more context pages not found or do not belong to this chapter", 400);
        }
    }
    return { taskType };
}
//# sourceMappingURL=task-scope.guard.js.map