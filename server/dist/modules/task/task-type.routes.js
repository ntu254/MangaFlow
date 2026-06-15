import { Router } from "express";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { validate } from "../../shared/middleware/validate.js";
import * as taskController from "./task.controller.js";
import { listTaskTypesSchema, taskTypeIdParamsSchema } from "./task.validation.js";
const router = Router();
router.get("/", requireAuth, validate(listTaskTypesSchema, "query"), taskController.listTaskTypes);
router.get("/active", requireAuth, (req, _res, next) => {
    req.query.activeOnly = "true";
    next();
}, validate(listTaskTypesSchema, "query"), taskController.listTaskTypes);
router.delete("/:taskTypeId", requireAuth, validate(taskTypeIdParamsSchema, "params"), taskController.deleteTaskType);
router.get("/:taskTypeId", requireAuth, validate(taskTypeIdParamsSchema, "params"), taskController.getTaskType);
export default router;
//# sourceMappingURL=task-type.routes.js.map