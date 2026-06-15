import { createTaskService, getTaskService, listTasksBySeriesService, listTasksByChapterService, listTasksByAssigneeService, updateTaskStatusService, updateTaskPriorityService, updateTaskDueDateService, } from "../task.service.js";
export async function createTask(req, res, _next) {
    const result = await createTaskService({
        seriesId: req.body.seriesId,
        chapterId: req.body.chapterId,
        pageId: req.body.pageId,
        regionId: req.body.regionId,
        taskTypeId: req.body.taskTypeId,
        assignedTo: req.body.assignedTo,
        assignedBy: req.user.userId,
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        dueDate: new Date(req.body.dueDate),
        contextPageIds: req.body.contextPageIds,
    });
    res.status(201).json({ success: true, message: "Task created successfully", data: result });
}
export async function getTask(req, res, _next) {
    const task = await getTaskService(req.params.taskId, req.user);
    res.json({ success: true, message: "Task retrieved successfully", data: task });
}
export async function listTasksBySeries(req, res, _next) {
    const tasks = await listTasksBySeriesService(req.params.seriesId, req.user, {
        status: req.query.status,
        assignedTo: req.query.assignedTo,
    });
    res.json({ success: true, message: "Tasks retrieved successfully", data: tasks });
}
export async function listTasksByChapter(req, res, _next) {
    const tasks = await listTasksByChapterService(req.params.chapterId, req.user);
    res.json({ success: true, message: "Tasks retrieved successfully", data: tasks });
}
export async function listTasksByAssignee(req, res, _next) {
    const tasks = await listTasksByAssigneeService(req.params.assigneeId, req.user);
    res.json({ success: true, message: "Tasks retrieved successfully", data: tasks });
}
export async function updateTaskStatus(req, res, _next) {
    const task = await updateTaskStatusService(req.params.taskId, req.user, req.body.status);
    res.json({ success: true, message: "Task status updated successfully", data: task });
}
export async function updateTaskPriority(req, res, _next) {
    const task = await updateTaskPriorityService(req.params.taskId, req.user, req.body.priority);
    res.json({ success: true, message: "Task priority updated successfully", data: task });
}
export async function updateTaskDueDate(req, res, _next) {
    const task = await updateTaskDueDateService(req.params.taskId, req.user, new Date(req.body.dueDate));
    res.json({ success: true, message: "Task due date updated successfully", data: task });
}
//# sourceMappingURL=task.controller.js.map