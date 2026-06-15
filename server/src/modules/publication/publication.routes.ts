import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./publication.controller.js"
import { createPublicationSchema, publicationIdParamsSchema, schedulePublicationBodySchema } from "./publication.validation.js"

const router = Router()

router.post("/", requireAuth, requireRole("EDITOR"), validate(createPublicationSchema), controller.createPublication)
router.post("/:publicationId/schedule", requireAuth, requireRole("EDITOR"), validate(publicationIdParamsSchema, "params"), validate(schedulePublicationBodySchema), controller.schedulePublication)
router.post("/:publicationId/publish", requireAuth, requireRole("EDITOR"), validate(publicationIdParamsSchema, "params"), controller.publishPublication)

export default router
