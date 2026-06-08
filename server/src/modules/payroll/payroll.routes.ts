import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./payroll.controller.js"
import { earningIdParamsSchema, taskIdParamsSchema } from "./payroll.validation.js"

const router = Router()

router.post(
  "/tasks/:taskId/calculate",
  requireAuth,
  validate(taskIdParamsSchema, "params"),
  controller.calculateTaskEarning,
)

router.post(
  "/tasks/:taskId/confirm",
  requireAuth,
  validate(taskIdParamsSchema, "params"),
  controller.confirmTaskEarning,
)

router.post(
  "/earnings/:earningId/mark-paid",
  requireAuth,
  validate(earningIdParamsSchema, "params"),
  controller.markEarningPaid,
)

router.get(
  "/earnings",
  requireAuth,
  controller.listPayrollEarnings,
)

export default router
