import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
  listAudit,
  listManagedNotifications,
  createManagedNotification,
  patchManagedNotification,
  deleteManagedNotification,
  listPayroll,
  confirmPayroll,
  markPaidPayroll,
  voidPayroll,
  executeOverride,
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
router.post("/admin/users/:userId/deactivate", requireRole("ADMIN") as any, deactivateUser);
router.delete("/admin/users/:userId", requireRole("ADMIN") as any, deleteUser);
router.get("/admin/audit", requireRole("ADMIN") as any, listAudit);
router.get("/admin/notifications", requireRole("ADMIN") as any, listManagedNotifications);
router.post("/admin/notifications", requireRole("ADMIN") as any, createManagedNotification);
router.patch("/admin/notifications/:notificationId", requireRole("ADMIN") as any, patchManagedNotification);
router.delete("/admin/notifications/:notificationId", requireRole("ADMIN") as any, deleteManagedNotification);
router.get("/admin/payroll", requireRole("ADMIN") as any, listPayroll);
router.get("/admin/workflow-summary", requireRole("ADMIN") as any, workflowSummary);
router.get("/admin/storage-summary", requireRole("ADMIN") as any, storageSummary);
router.post("/admin/payroll/:earningId/confirm", requireRole("ADMIN") as any, confirmPayroll);
router.post("/admin/payroll/:earningId/mark-paid", requireRole("ADMIN") as any, markPaidPayroll);
router.post("/admin/payroll/:earningId/void", requireRole("ADMIN") as any, voidPayroll);
router.post("/admin/override", requireRole("ADMIN") as any, executeOverride);
router.post("/admin/demo/reset", requireRole("ADMIN") as any, resetDemoData);
router.post("/admin/demo/clear", requireRole("ADMIN") as any, clearDemoData);
router.get("/assistant/earnings", requireRole("ASSISTANT") as any, listAssistantEarnings);

export default router;
