import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requirePermission } from "../../shared/policies/permissions.js"
import { validate } from "../../shared/middleware/validate.js"
import * as taskController from "./task.controller.js"
import { listTaskTypesSchema, taskTypeIdParamsSchema } from "./task.validation.js"

const router = Router()

router.get(
  "/",
  requireAuth,
  validate(listTaskTypesSchema, "query"),
  taskController.listTaskTypes,
)

router.get(
  "/active",
  requireAuth,
  (req, _res, next) => {
    req.query.activeOnly = "true"
    next()
  },
  validate(listTaskTypesSchema, "query"),
  taskController.listTaskTypes,
)

// Flow-00 §11: TaskType is system config; only Admin may delete.
router.delete(
  "/:taskTypeId",
  requireAuth,
  requirePermission("ADMIN_CONFIG_MANAGE"),
  validate(taskTypeIdParamsSchema, "params"),
  taskController.deleteTaskType,
)

router.get(
  "/:taskTypeId",
  requireAuth,
  validate(taskTypeIdParamsSchema, "params"),
  taskController.getTaskType,
)

export default router
