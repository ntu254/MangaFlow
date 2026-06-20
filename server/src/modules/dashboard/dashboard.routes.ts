import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import * as controller from "./dashboard.controller.js"

const router = Router()

router.get("/admin/sidebar-summary", requireAuth, requireRole("ADMIN"), controller.getAdminSidebarSummary)
router.get("/mangaka/summary", requireAuth, requireRole("MANGAKA", "ADMIN"), controller.getMangakaSummary)
router.get("/assistant/summary", requireAuth, requireRole("ASSISTANT", "ADMIN"), controller.getAssistantSummary)
router.get("/editor/summary", requireAuth, requireRole("EDITOR", "ADMIN"), controller.getEditorSummary)
router.get("/board/summary", requireAuth, requireRole("BOARD", "ADMIN"), controller.getBoardSummary)

export default router
