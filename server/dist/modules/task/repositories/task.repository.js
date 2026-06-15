import { Task } from "../task.model.js";
export async function createTaskRecord(input) {
    return Task.create({
        seriesId: input.seriesId,
        chapterId: input.chapterId,
        pageId: input.pageId,
        regionId: input.regionId,
        taskTypeId: input.taskTypeId,
        assignedTo: input.assignedTo,
        assignedBy: input.assignedBy,
        title: input.title,
        description: input.description,
        status: input.status || "TODO",
        priority: input.priority || "NORMAL",
        baseRate: input.baseRate,
        dueDate: input.dueDate,
        contextPageIds: input.contextPageIds || [],
    });
}
export async function getTaskById(taskId) {
    return Task.findById(taskId).populate("taskTypeId");
}
export async function listTasksBySeries(seriesId, filters) {
    const query = { seriesId };
    if (filters?.status)
        query.status = filters.status;
    if (filters?.assignedTo)
        query.assignedTo = filters.assignedTo;
    return Task.find(query).sort({ createdAt: -1 }).populate("taskTypeId").lean();
}
export async function listTasksByChapter(chapterId) {
    return Task.find({ chapterId }).sort({ createdAt: -1 }).populate("taskTypeId").lean();
}
export async function listTasksByAssignee(assigneeId) {
    return Task.find({ assignedTo: assigneeId }).sort({ dueDate: 1 }).populate("taskTypeId").lean();
}
export async function updateTaskStatus(taskId, status) {
    return Task.findByIdAndUpdate(taskId, { status }, { new: true }).populate("taskTypeId");
}
export async function updateTaskPriority(taskId, priority) {
    return Task.findByIdAndUpdate(taskId, { priority }, { new: true }).populate("taskTypeId");
}
export async function updateTaskDueDate(taskId, dueDate) {
    return Task.findByIdAndUpdate(taskId, { dueDate }, { new: true }).populate("taskTypeId");
}
//# sourceMappingURL=task.repository.js.map