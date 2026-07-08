import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { listMaterials, createMaterial, patchMaterial, addMaterialVersion, deleteMaterial } from "../controllers/material.controller.js";

const router = Router();

router.get("/materials", listMaterials);
router.post("/materials", requireRole("EDITOR", "MANGAKA") as any, createMaterial);
router.patch("/materials/:id", requireRole("EDITOR", "MANGAKA") as any, patchMaterial);
router.post("/materials/:id/versions", requireRole("EDITOR", "MANGAKA") as any, addMaterialVersion);
router.delete("/materials/:id", requireRole("EDITOR", "MANGAKA") as any, deleteMaterial);

export default router;
