import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as fileController from "./file.controller.js"
import {
  getPresignedUploadUrlSchema,
  pageIdParamsSchema,
  confirmPageUploadSchema,
  fileAssetIdParamsSchema,
  createRegionSchema,
  regionIdParamsSchema,
  updateRegionStatusSchema,
  listRegionsParamsSchema,
} from "./file.validation.js"

const router = Router()

router.post(
  "/presigned-upload",
  requireAuth,
  requireRole("MANGAKA", "EDITOR", "ASSISTANT"),
  validate(getPresignedUploadUrlSchema),
  fileController.getPresignedUploadUrl,
)

router.post(
  "/pages/:pageId/confirm-upload",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(confirmPageUploadSchema),
  fileController.confirmPageUpload,
)

router.get(
  "/files/:fileAssetId/presigned-download",
  requireAuth,
  validate(fileAssetIdParamsSchema, "params"),
  fileController.getPresignedDownloadUrl,
)

router.get(
  "/pages/:pageId",
  requireAuth,
  validate(pageIdParamsSchema, "params"),
  fileController.getPageWithFileAsset,
)

router.post(
  "/pages/:pageId/ai/bubble-detect",
  requireAuth,
  requireRole("MANGAKA", "EDITOR", "ASSISTANT"),
  validate(pageIdParamsSchema, "params"),
  fileController.detectBubbles,
)

router.post(
  "/pages/:pageId/ai/bubble-process",
  requireAuth,
  requireRole("MANGAKA", "EDITOR", "ASSISTANT"),
  validate(pageIdParamsSchema, "params"),
  fileController.processBubbles,
)

router.post(
  "/pages/:pageId/regions",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(createRegionSchema),
  fileController.createRegion,
)

router.get(
  "/pages/:pageId/regions",
  requireAuth,
  validate(listRegionsParamsSchema, "params"),
  fileController.listRegions,
)

router.get(
  "/regions/:regionId",
  requireAuth,
  validate(regionIdParamsSchema, "params"),
  fileController.getRegion,
)

router.patch(
  "/regions/:regionId/status",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(updateRegionStatusSchema),
  fileController.updateRegionStatus,
)

router.delete(
  "/regions/:regionId",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(regionIdParamsSchema, "params"),
  fileController.deleteRegion,
)

export default router