import { Router } from "express";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { requireRole } from "../../shared/middleware/requireRole.js";
import { validate } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/middleware/asyncHandler.js";
import * as controller from "./manuscript.controller.js";
import { manuscriptIdParamsSchema, manuscriptReviewBodySchema } from "./manuscript.validation.js";
const router = Router();
router.post("/:manuscriptId/request-revision", requireAuth, requireRole("EDITOR"), validate(manuscriptIdParamsSchema, "params"), validate(manuscriptReviewBodySchema), asyncHandler(controller.requestRevision));
router.post("/:manuscriptId/forward-to-board", requireAuth, requireRole("EDITOR"), validate(manuscriptIdParamsSchema, "params"), validate(manuscriptReviewBodySchema), asyncHandler(controller.forwardToBoard));
router.post("/:manuscriptId/reject", requireAuth, requireRole("EDITOR"), validate(manuscriptIdParamsSchema, "params"), validate(manuscriptReviewBodySchema), asyncHandler(controller.reject));
export default router;
//# sourceMappingURL=manuscript.routes.js.map