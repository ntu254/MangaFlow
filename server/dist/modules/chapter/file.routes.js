import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { requireRole } from "../../shared/middleware/requireRole.js";
import { validate } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/middleware/asyncHandler.js";
import * as fileController from "./file.controller.js";
import { getPresignedUploadUrlSchema, pageIdParamsSchema, confirmPageUploadSchema, fileAssetIdParamsSchema, createRegionSchema, regionIdParamsSchema, updateRegionSchema, listRegionsParamsSchema, aiSuggestionDecisionSchema, } from "./file.validation.js";
const router = Router();
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});
// ── File upload ─────────────────────────────────────────────────────────────
router.post("/presigned-upload", requireAuth, requireRole("MANGAKA", "EDITOR", "ASSISTANT"), validate(getPresignedUploadUrlSchema), asyncHandler(fileController.getPresignedUploadUrl));
/**
 * Flow-02: Confirm upload with all 3 assets (original / working / thumbnail).
 */
router.post("/pages/:pageId/confirm-upload", requireAuth, requireRole("MANGAKA", "EDITOR"), validate(confirmPageUploadSchema), asyncHandler(fileController.confirmPageUpload));
router.get("/files/:fileAssetId/presigned-download", requireAuth, validate(fileAssetIdParamsSchema, "params"), asyncHandler(fileController.getPresignedDownloadUrl));
router.get("/pages/:pageId", requireAuth, validate(pageIdParamsSchema, "params"), asyncHandler(fileController.getPageWithFileAsset));
// ── AI segmentation (Flow-04) ────────────────────────────────────────────────
/**
 * POST /api/files/pages/:pageId/ai/segment
 * Spec: POST /api/pages/:pageId/ai/segment — run AI segmentation using workingFileAssetId.
 */
router.post("/pages/:pageId/ai/segment", requireAuth, requireRole("MANGAKA", "EDITOR"), aiLimiter, validate(pageIdParamsSchema, "params"), asyncHandler(fileController.runAISegmentation));
/**
 * GET /api/files/pages/:pageId/ai-results
 * Spec: GET /api/pages/:pageId/ai-results
 */
router.get("/pages/:pageId/ai-results", requireAuth, validate(pageIdParamsSchema, "params"), asyncHandler(fileController.listAIResults));
/**
 * POST /api/files/ai-results/:aiResultId/accept-region
 * Spec: POST /api/ai-results/:aiResultId/accept-region
 */
router.post("/ai-results/:aiResultId/accept-region", requireAuth, requireRole("MANGAKA", "EDITOR"), validate(aiSuggestionDecisionSchema), asyncHandler(fileController.acceptAISuggestion));
/**
 * POST /api/files/ai-results/:aiResultId/reject-region
 * Spec: POST /api/ai-results/:aiResultId/reject-region
 */
router.post("/ai-results/:aiResultId/reject-region", requireAuth, requireRole("MANGAKA", "EDITOR"), validate(aiSuggestionDecisionSchema), asyncHandler(fileController.rejectAISuggestion));
// ── Region CRUD (Flow-04) ────────────────────────────────────────────────────
router.post("/pages/:pageId/regions", requireAuth, requireRole("MANGAKA", "EDITOR"), validate(createRegionSchema), asyncHandler(fileController.createRegion));
router.get("/pages/:pageId/regions", requireAuth, validate(listRegionsParamsSchema, "params"), asyncHandler(fileController.listRegions));
router.get("/regions/:regionId", requireAuth, validate(regionIdParamsSchema, "params"), asyncHandler(fileController.getRegion));
/**
 * PATCH /api/files/regions/:regionId
 * Flow-04: update region type and/or bbox coordinates (not status).
 */
router.patch("/regions/:regionId", requireAuth, requireRole("MANGAKA", "EDITOR"), validate(updateRegionSchema), asyncHandler(fileController.updateRegion));
router.delete("/regions/:regionId", requireAuth, requireRole("MANGAKA", "EDITOR"), validate(regionIdParamsSchema, "params"), asyncHandler(fileController.deleteRegion));
export default router;
//# sourceMappingURL=file.routes.js.map