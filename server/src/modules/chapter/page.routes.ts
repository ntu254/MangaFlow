import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { validate } from "../../shared/middleware/validate.js"
import { z } from "zod"
import * as controller from "./page.controller.js"

const router = Router()

const pageIdParamsSchema = z.object({
  pageId: z.string().min(1, "Page ID is required"),
})

router.get(
  "/:pageId/studio",
  requireAuth,
  validate(pageIdParamsSchema, "params"),
  controller.getPageStudio,
)

export default router
