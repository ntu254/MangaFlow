import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { env } from "../config/env.js";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  resetUserPassword,
  deactivateUser,
  deleteUser,
  listManagedNotifications,
  createManagedNotification,
  patchManagedNotification,
  deleteManagedNotification,
  listAssistantEarnings,
  workflowSummary,
  storageSummary,
  resetDemoData,
  clearDemoData,
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/admin/users", requireRole("ADMIN") as any, listUsers);
router.post("/admin/users", requireRole("ADMIN") as any, createUser);
router.get("/admin/users/:userId", requireRole("ADMIN") as any, getUser);
router.patch("/admin/users/:userId", requireRole("ADMIN") as any, updateUser);
router.post("/admin/users/:userId/reset-password", requireRole("ADMIN") as any, resetUserPassword);
router.post("/admin/users/:userId/deactivate", requireRole("ADMIN") as any, deactivateUser);
router.delete("/admin/users/:userId", requireRole("ADMIN") as any, deleteUser);
router.get("/admin/notifications", requireRole("ADMIN") as any, listManagedNotifications);
router.post("/admin/notifications", requireRole("ADMIN") as any, createManagedNotification);
router.patch(
  "/admin/notifications/:notificationId",
  requireRole("ADMIN") as any,
  patchManagedNotification,
);
router.delete(
  "/admin/notifications/:notificationId",
  requireRole("ADMIN") as any,
  deleteManagedNotification,
);
router.get("/admin/workflow-summary", requireRole("ADMIN") as any, workflowSummary);
router.get("/admin/storage-summary", requireRole("ADMIN") as any, storageSummary);
router.get("/assistant/earnings", requireRole("ASSISTANT") as any, listAssistantEarnings);

// Demo tooling is only wired up outside production so the paths 404 in prod.
if (env.NODE_ENV !== "production") {
  router.post("/admin/demo/reset", requireRole("ADMIN") as any, resetDemoData);
  router.post("/admin/demo/clear", requireRole("ADMIN") as any, clearDemoData);
}

export default router;
