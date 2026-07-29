import { Router } from "express";
import { requireExactRole } from "../middleware/auth.js";
import { listMaterials, createMaterial, patchMaterial, addMaterialVersion, deleteMaterial } from "../controllers/material.controller.js";

const router = Router();

router.get("/materials", listMaterials);
router.post("/materials", requireExactRole("EDITOR", "MANGAKA") as any, createMaterial);
router.patch("/materials/:id", requireExactRole("EDITOR", "MANGAKA") as any, patchMaterial);
router.post("/materials/:id/versions", requireExactRole("EDITOR", "MANGAKA") as any, addMaterialVersion);
router.delete("/materials/:id", requireExactRole("EDITOR", "MANGAKA") as any, deleteMaterial);

export default router;
