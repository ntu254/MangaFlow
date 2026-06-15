import { Router } from "express";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { validate } from "../../shared/middleware/validate.js";
import * as controller from "./comment.controller.js";
import { commentIdParamsSchema, createCommentSchema, taskIdParamsSchema } from "./comment.validation.js";
const router = Router();
router.post("/", requireAuth, validate(createCommentSchema), controller.createComment);
router.get("/task/:taskId", requireAuth, validate(taskIdParamsSchema, "params"), controller.listTaskComments);
router.post("/:id/mark-fixed", requireAuth, validate(commentIdParamsSchema, "params"), controller.markCommentFixed);
router.post("/:id/verify-fixed", requireAuth, validate(commentIdParamsSchema, "params"), controller.verifyCommentFixed);
router.post("/:id/resolve", requireAuth, validate(commentIdParamsSchema, "params"), controller.resolveComment);
router.post("/:id/reopen", requireAuth, validate(commentIdParamsSchema, "params"), controller.reopenComment);
export default router;
//# sourceMappingURL=comment.routes.js.map