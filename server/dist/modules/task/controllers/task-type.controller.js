import { createTaskTypeService, listTaskTypesService, getTaskTypeService, updateTaskTypeService, deleteTaskTypeService, } from "../task.service.js";
export async function createTaskType(req, res, _next) {
    const result = await createTaskTypeService(req.body);
    res.status(201).json({ success: true, message: "Task type created successfully", data: result });
}
export async function listTaskTypes(req, res, _next) {
    const taskTypes = await listTaskTypesService(req.query.activeOnly !== "false");
    res.json({ success: true, message: "Task types retrieved successfully", data: taskTypes });
}
export async function getTaskType(req, res, _next) {
    const taskType = await getTaskTypeService(req.params.taskTypeId);
    res.json({ success: true, message: "Task type retrieved successfully", data: taskType });
}
export async function updateTaskType(req, res, _next) {
    const taskType = await updateTaskTypeService(req.params.taskTypeId, req.body);
    res.json({ success: true, message: "Task type updated successfully", data: taskType });
}
export async function deleteTaskType(req, res, _next) {
    await deleteTaskTypeService(req.params.taskTypeId);
    res.json({ success: true, message: "Task type deleted successfully", data: null });
}
//# sourceMappingURL=task-type.controller.js.map