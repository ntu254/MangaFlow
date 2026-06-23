import { Router } from "express"
import { z } from "zod"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { requireSeriesRole } from "../../shared/middleware/requireSeriesRole.js"
import { validate } from "../../shared/middleware/validate.js"
import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import * as controller from "./series.controller.js"
import { assignTantouEditorSchema, createManuscriptUploadSchema, createSeriesSchema, manuscriptFileParamsSchema, seriesIdParamsSchema, updateSeriesSchema } from "./series.validation.js"
import { acceptOwnSeriesInviteSchema, acceptSeriesMemberSchema, addSeriesMemberSchema, updateSeriesMemberSchema } from "./series-member.validation.js"
import {
  acceptSeriesMemberInvite,
  addSeriesMember,
  listSeriesMembers,
  listMySeriesMemberships,
  updateSeriesMember,
  removeSeriesMember,
  getEligibleAssistants,
} from "./series-member.controller.js"

const router = Router()
const createSeriesChapterSchema = z.object({
  params: z.object({
    seriesId: z.string().min(1, "Series ID is required"),
  }),
  body: z.object({
    chapterNumber: z.number().int().positive("Chapter number must be positive"),
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
  }),
})

router.get("/", requireAuth, asyncHandler(controller.listSeries))
router.get(
  "/memberships/my",
  requireAuth,
  requireRole("ASSISTANT"),
  asyncHandler(listMySeriesMemberships),
)
router.get("/:seriesId", requireAuth, validate(seriesIdParamsSchema, "params"), asyncHandler(controller.getSeriesDetail))
router.get("/:seriesId/summary", requireAuth, validate(seriesIdParamsSchema, "params"), asyncHandler(controller.getSeriesSummary))
router.post("/", requireAuth, requireRole("MANGAKA"), validate(createSeriesSchema), asyncHandler(controller.createSeries))

router.post(
  "/:seriesId/chapters",
  requireAuth,
  validate(createSeriesChapterSchema),
  requireSeriesRole("MANGAKA", "EDITOR"),
  asyncHandler(controller.createChapterForSeries),
)

router.post(
  "/:seriesId/manuscripts/uploads",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  validate(createManuscriptUploadSchema),
  asyncHandler(controller.createManuscriptUpload),
)

const createCoverUploadSchema = z.object({
  originalName: z.string().trim().min(1, "Original name is required").max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  expiresIn: z.number().int().positive().max(3600).optional(),
})

router.post(
  "/:seriesId/cover/upload-url",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  validate(createCoverUploadSchema),
  asyncHandler(controller.createCoverUpload),
)

router.delete(
  "/:seriesId/manuscripts/files/:fileAssetId",
  requireAuth,
  requireRole("MANGAKA"),
  validate(manuscriptFileParamsSchema, "params"),
  asyncHandler(controller.deleteManuscriptFile),
)

router.get(
  "/:seriesId/manuscripts/files/:fileAssetId/download",
  requireAuth,
  validate(manuscriptFileParamsSchema, "params"),
  asyncHandler(controller.downloadManuscriptFile),
)

router.post(
  "/:seriesId/manuscripts/files/verify",
  requireAuth,
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(controller.verifyManuscriptFiles),
)

router.patch(
  "/:seriesId",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  validate(updateSeriesSchema),
  asyncHandler(controller.updateSeries),
)
router.post(
  "/:seriesId/submit",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(controller.submitSeries),
)
router.post(
  "/:seriesId/submit-to-editor",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(controller.submitSeries),
)

router.post(
  "/:seriesId/assign-editor",
  requireAuth,
  requireRole("ADMIN"),
  validate(seriesIdParamsSchema, "params"),
  validate(assignTantouEditorSchema),
  asyncHandler(controller.assignTantouEditor),
)

router.post(
  "/:seriesId/members",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(seriesIdParamsSchema, "params"),
  validate(addSeriesMemberSchema),
  asyncHandler(addSeriesMember),
)

// Flow-03: only active series members (or Admin) can read the team composition.
// Prevents cross-series leak of team identity.
router.get(
  "/:seriesId/members",
  requireAuth,
  validate(seriesIdParamsSchema, "params"),
  requireSeriesRole("MANGAKA", "EDITOR", "ASSISTANT"),
  asyncHandler(listSeriesMembers),
)

router.patch(
  "/:seriesId/members/:memberId",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(updateSeriesMemberSchema),
  asyncHandler(updateSeriesMember),
)

router.post(
  "/:seriesId/members/accept",
  requireAuth,
  requireRole("ASSISTANT"),
  validate(acceptOwnSeriesInviteSchema),
  asyncHandler(acceptSeriesMemberInvite),
)

router.post(
  "/:seriesId/members/:memberId/accept",
  requireAuth,
  requireRole("ASSISTANT"),
  validate(acceptSeriesMemberSchema),
  asyncHandler(acceptSeriesMemberInvite),
)

router.delete(
  "/:seriesId/members/:memberId",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(z.object({ seriesId: z.string().min(1), memberId: z.string().min(1) }), "params"),
  asyncHandler(removeSeriesMember),
)

router.get(
  "/:seriesId/eligible-assistants",
  requireAuth,
  requireRole("MANGAKA", "EDITOR", "ADMIN"),
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(getEligibleAssistants),
)


router.delete(
  "/:seriesId/draft",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(controller.deleteDraftSeries),
)

router.post(
  "/:seriesId/withdraw",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(controller.withdrawSeriesProposal),
)

router.post(
  "/:seriesId/cancel",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(controller.cancelSeries),
)

router.delete(
  "/:seriesId/hard",
  requireAuth,
  requireRole("ADMIN"),
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(controller.hardDeleteSeries),
)

export default router
