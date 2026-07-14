import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  createUser,
  deactivateUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from "../modules/users/presentation/user-management.controller.js";

const router = Router();

router.get("/admin/users", requireRole("ADMIN") as any, listUsers);
router.post("/admin/users", requireRole("ADMIN") as any, createUser);
router.get("/admin/users/:userId", requireRole("ADMIN") as any, getUser);
router.patch("/admin/users/:userId", requireRole("ADMIN") as any, updateUser);
router.post("/admin/users/:userId/deactivate", requireRole("ADMIN") as any, deactivateUser);
router.delete("/admin/users/:userId", requireRole("ADMIN") as any, deleteUser);

export default router;
