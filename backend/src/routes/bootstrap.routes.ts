import { Router } from "express";
import { bootstrapHandler, dashboardSummaryHandler } from "../controllers/bootstrap.controller.js";

const router = Router();

router.get("/me/bootstrap", bootstrapHandler);
router.get("/dashboard/:role/summary", dashboardSummaryHandler);

export default router;
