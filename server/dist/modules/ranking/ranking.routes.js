import { Router } from "express";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { requireRole } from "../../shared/middleware/requireRole.js";
import { validate } from "../../shared/middleware/validate.js";
import * as controller from "./ranking.controller.js";
import { importRankingSchema, rankingIdParamsSchema } from "./ranking.validation.js";
const router = Router();
router.get("/", requireAuth, requireRole("BOARD"), controller.listRankings);
router.post("/import", requireAuth, requireRole("BOARD"), validate(importRankingSchema), controller.importRanking);
router.post("/:rankingId/finalize", requireAuth, requireRole("BOARD"), validate(rankingIdParamsSchema, "params"), controller.finalizeRanking);
router.get("/my-rankings", requireAuth, requireRole("MANGAKA"), controller.listMangakaRankings);
export default router;
//# sourceMappingURL=ranking.routes.js.map