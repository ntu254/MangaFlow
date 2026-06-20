import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import * as controller from "./audit-log.controller.js"

const router = Router()

// Flow-12: Admin only
router.get("/", requireAuth, requireRole("ADMIN"), asyncHandler(controller.listAuditLogs))

export default router
