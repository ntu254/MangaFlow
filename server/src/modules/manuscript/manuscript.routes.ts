import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./manuscript.controller.js"
import { manuscriptIdParamsSchema } from "./manuscript.validation.js"

const router = Router()
const editorOnly = [requireAuth, requireRole("EDITOR"), validate(manuscriptIdParamsSchema, "params")] as const

router.post("/:manuscriptId/request-revision", ...editorOnly, controller.requestRevision)
router.post("/:manuscriptId/forward-to-board", ...editorOnly, controller.forwardToBoard)
router.post("/:manuscriptId/reject", ...editorOnly, controller.reject)

export default router
