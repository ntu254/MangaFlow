import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  listRegions,
  createRegion,
  patchRegions,
  patchRegion,
  deleteRegion,
  listTasks,
  sendEditorReview,
  listComments,
  createComment,
  patchComment,
  resolveComment,
  reopenComment,
  listTaskComments,
} from "../controllers/studio.controller.js";
import {
  createTask,
  getTaskDetail,
  getTaskDetailAlias,
  patchTask,
  patchTasks,
  taskAction,
} from "../modules/studio/presentation/task-production.controller.js";

const router = Router();

router.post(
  "/studio/chapters/:chapterId/send-editor-review",
  requireRole("MANGAKA") as any,
  sendEditorReview,
);

// Regions
router.get("/studio/regions", listRegions);
router.post("/studio/regions", requireRole("MANGAKA") as any, createRegion);
router.patch("/studio/regions", requireRole("MANGAKA") as any, patchRegions);
router.patch("/studio/regions/:id", requireRole("MANGAKA") as any, patchRegion);
router.delete("/studio/regions/:id", requireRole("MANGAKA") as any, deleteRegion);

// Tasks
router.get("/studio/tasks", listTasks);
router.post("/studio/tasks", requireRole("MANGAKA") as any, createTask);
router.patch("/studio/tasks", requireRole("MANGAKA") as any, patchTasks);
router.patch("/studio/tasks/:id", requireRole("MANGAKA") as any, patchTask);
router.get("/tasks/:taskId", getTaskDetail);
router.get("/studio/tasks/:taskId", getTaskDetailAlias);
router.post(
  "/studio/tasks/:taskId/actions/:action",
  requireRole("EDITOR", "MANGAKA", "ASSISTANT") as any,
  taskAction,
);

// Comments
router.get("/comments", listComments);
router.post("/comments", requireRole("EDITOR", "MANGAKA", "ASSISTANT") as any, createComment);
router.patch("/comments/:commentId", requireRole("EDITOR", "MANGAKA") as any, patchComment);
router.post(
  "/comments/:commentId/resolve",
  requireRole("EDITOR", "MANGAKA", "ASSISTANT") as any,
  resolveComment,
);
router.post("/comments/:commentId/reopen", requireRole("EDITOR", "MANGAKA") as any, reopenComment);
router.get("/comments/task/:taskId", listTaskComments);

export default router;
