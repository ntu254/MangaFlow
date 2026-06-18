import { Router } from "express";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { requireSeriesRole } from "../../shared/middleware/requireSeriesRole.js";
import { validate } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/middleware/asyncHandler.js";
import * as taskController from "./task.controller.js";
import { createTaskSchema, taskIdParamsSchema, seriesIdParamsSchema, chapterIdParamsSchema, assigneeIdParamsSchema, updateTaskStatusBodySchema, updateTaskPriorityBodySchema, updateTaskDueDateBodySchema, } from "./task.validation.js";
const router = Router();
// Task endpoints
router.post("/", requireAuth, requireSeriesRole("MANGAKA", "EDITOR"), validate(createTaskSchema), asyncHandler(taskController.createTask));
router.patch("/:taskId/status", requireAuth, validate(taskIdParamsSchema, "params"), validate(updateTaskStatusBodySchema), asyncHandler(taskController.updateTaskStatus));
router.patch("/:taskId/priority", requireAuth, validate(taskIdParamsSchema, "params"), validate(updateTaskPriorityBodySchema), asyncHandler(taskController.updateTaskPriority));
router.patch("/:taskId/due-date", requireAuth, validate(taskIdParamsSchema, "params"), validate(updateTaskDueDateBodySchema), asyncHandler(taskController.updateTaskDueDate));
router.get("/series/:seriesId", requireAuth, validate(seriesIdParamsSchema, "params"), asyncHandler(taskController.listTasksBySeries));
router.get("/chapter/:chapterId", requireAuth, validate(chapterIdParamsSchema, "params"), asyncHandler(taskController.listTasksByChapter));
router.get("/assignee/:assigneeId", requireAuth, validate(assigneeIdParamsSchema, "params"), asyncHandler(taskController.listTasksByAssignee));
router.get("/:taskId", requireAuth, validate(taskIdParamsSchema, "params"), asyncHandler(taskController.getTask));
export default router;
//# sourceMappingURL=task.routes.js.map