import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  createAdminRate,
  listActiveRateOptions,
  listAdminRates,
  patchAdminRate,
} from "../controllers/rate-table.controller.js";

const router = Router();

router.get("/rates/active", requireRole("ADMIN", "MANGAKA", "EDITOR") as any, listActiveRateOptions);
router.get("/admin/rates", requireRole("ADMIN") as any, listAdminRates);
router.post("/admin/rates", requireRole("ADMIN") as any, createAdminRate);
router.patch("/admin/rates/:id", requireRole("ADMIN") as any, patchAdminRate);

export default router;
