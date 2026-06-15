import { AppError } from "../../shared/errors/AppError.js";
import { Page } from "./chapter.model.js";
import { Task } from "../task/task.model.js";
export async function getPageWorkspaceService(pageId, _userId, _role) {
    const page = await Page.findById(pageId).populate("fileAssetId");
    if (!page)
        throw new AppError("Page not found", 404);
    // In a real implementation we would fetch regions, tasks assigned to regions, etc.
    // We mock a detailed workspace view for the frontend canvas
    const tasks = await Task.find({ pageId }).populate("taskTypeId");
    return {
        page,
        tasks,
        regions: [],
        feedbackPoints: [],
        collaborators: []
    };
}
//# sourceMappingURL=page.service.js.map