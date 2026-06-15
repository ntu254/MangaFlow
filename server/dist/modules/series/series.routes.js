import { Router } from "express";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { requireRole } from "../../shared/middleware/requireRole.js";
import { validate } from "../../shared/middleware/validate.js";
import * as controller from "./series.controller.js";
import { createManuscriptUploadSchema, createSeriesSchema, seriesIdParamsSchema, updateSeriesSchema } from "./series.validation.js";
import { addSeriesMemberSchema } from "./series-member.validation.js";
import { addSeriesMember } from "./series-member.controller.js";
const router = Router();
router.get("/", requireAuth, controller.listSeries);
router.get("/:seriesId", requireAuth, validate(seriesIdParamsSchema, "params"), controller.getSeriesDetail);
router.get("/:seriesId/summary", requireAuth, validate(seriesIdParamsSchema, "params"), controller.getSeriesSummary);
router.post("/", requireAuth, requireRole("MANGAKA"), validate(createSeriesSchema), controller.createSeries);
router.post("/:seriesId/manuscripts/uploads", requireAuth, requireRole("MANGAKA"), validate(seriesIdParamsSchema, "params"), validate(createManuscriptUploadSchema), controller.createManuscriptUpload);
router.patch("/:seriesId", requireAuth, requireRole("MANGAKA"), validate(seriesIdParamsSchema, "params"), validate(updateSeriesSchema), controller.updateSeries);
router.post("/:seriesId/submit", requireAuth, requireRole("MANGAKA"), validate(seriesIdParamsSchema, "params"), controller.submitSeries);
router.post("/:seriesId/members", requireAuth, requireRole("MANGAKA", "EDITOR"), validate(seriesIdParamsSchema, "params"), validate(addSeriesMemberSchema), addSeriesMember);
export default router;
//# sourceMappingURL=series.routes.js.map