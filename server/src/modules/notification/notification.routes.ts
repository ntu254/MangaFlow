import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import * as controller from "./notification.controller.js"

const router = Router()

router.use(requireAuth)
router.get("/", asyncHandler(controller.listNotifications))
router.patch("/:notificationId/read", asyncHandler(controller.markNotificationRead))
router.patch("/:notificationId/archive", asyncHandler(controller.archiveNotification))

export default router
