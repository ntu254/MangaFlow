import { Router } from "express";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { requireSeriesRole } from "../../shared/middleware/requireSeriesRole.js";
import { validate } from "../../shared/middleware/validate.js";
import * as taskController from "./task.controller.js";
import { createTaskSchema, taskIdParamsSchema, seriesIdParamsSchema, chapterIdParamsSchema, assigneeIdParamsSchema, updateTaskStatusBodySchema, updateTaskPriorityBodySchema, updateTaskDueDateBodySchema, } from "./task.validation.js";
const router = Router();
// Task endpoints
router.post("/", requireAuth, requireSeriesRole("MANGAKA", "EDITOR"), validate(createTaskSchema), taskController.createTask);
router.patch("/:taskId/status", requireAuth, validate(taskIdParamsSchema, "params"), validate(updateTaskStatusBodySchema), taskController.updateTaskStatus);
router.patch("/:taskId/priority", requireAuth, validate(taskIdParamsSchema, "params"), validate(updateTaskPriorityBodySchema), taskController.updateTaskPriority);
router.patch("/:taskId/due-date", requireAuth, validate(taskIdParamsSchema, "params"), validate(updateTaskDueDateBodySchema), taskController.updateTaskDueDate);
router.get("/series/:seriesId", requireAuth, validate(seriesIdParamsSchema, "params"), taskController.listTasksBySeries);
router.get("/chapter/:chapterId", requireAuth, validate(chapterIdParamsSchema, "params"), taskController.listTasksByChapter);
router.get("/assignee/:assigneeId", requireAuth, validate(assigneeIdParamsSchema, "params"), taskController.listTasksByAssignee);
router.get("/:taskId", requireAuth, validate(taskIdParamsSchema, "params"), taskController.getTask);
export default router;
//# sourceMappingURL=task.routes.js.map