import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./publication.controller.js"
import { createPublicationSchema, patchPublicationBodySchema, publicationIdParamsSchema, schedulePublicationBodySchema } from "./publication.validation.js"

const router = Router()

router.get("/", requireAuth, requireRole("EDITOR", "ADMIN", "MANGAKA"), controller.listPublications)
router.post("/", requireAuth, requireRole("EDITOR"), validate(createPublicationSchema), controller.createPublication)
router.patch("/:publicationId", requireAuth, requireRole("EDITOR"), validate(publicationIdParamsSchema, "params"), validate(patchPublicationBodySchema), controller.patchPublication)
router.post("/:publicationId/schedule", requireAuth, requireRole("EDITOR"), validate(publicationIdParamsSchema, "params"), validate(schedulePublicationBodySchema), controller.schedulePublication)
router.post("/:publicationId/cancel", requireAuth, requireRole("EDITOR"), validate(publicationIdParamsSchema, "params"), controller.cancelPublication)
router.post("/:publicationId/publish", requireAuth, requireRole("EDITOR"), validate(publicationIdParamsSchema, "params"), controller.publishPublication)

export default router
