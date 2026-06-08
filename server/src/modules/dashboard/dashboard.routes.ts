import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import * as controller from "./dashboard.controller.js"

const router = Router()

router.get("/admin/sidebar-summary", requireAuth, requireRole("ADMIN"), controller.getAdminSidebarSummary)

export default router
