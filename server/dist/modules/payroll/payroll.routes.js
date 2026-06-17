import { Router } from "express";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { requirePermission } from "../../shared/policies/permissions.js";
import { validate } from "../../shared/middleware/validate.js";
import * as controller from "./payroll.controller.js";
import { earningIdParamsSchema, taskIdParamsSchema } from "./payroll.validation.js";
const router = Router();
// Flow-11: Assistants must never trigger their own earning calculation.
router.post("/tasks/:taskId/calculate", requireAuth, requirePermission("EARNING_CALCULATE"), validate(taskIdParamsSchema, "params"), controller.calculateTaskEarning);
// MVP: no dedicated Finance role yet — Admin or Editor confirms.
router.post("/tasks/:taskId/confirm", requireAuth, requirePermission("EARNING_CONFIRM"), validate(taskIdParamsSchema, "params"), controller.confirmTaskEarning);
// Mark-paid touches money state — Admin only.
router.post("/earnings/:earningId/mark-paid", requireAuth, requirePermission("EARNING_MARK_PAID"), validate(earningIdParamsSchema, "params"), controller.markEarningPaid);
// Listing is open to all production roles; the service filters per actor.
router.get("/earnings", requireAuth, requirePermission("EARNING_LIST"), controller.listPayrollEarnings);
export default router;
//# sourceMappingURL=payroll.routes.js.map