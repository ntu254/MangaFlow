import { Router } from "express";
import { requireExactRole } from "../middleware/auth.js";
import {
  listRegions,
  createRegion,
  patchRegions,
  patchRegion,
  deleteRegion,
  listTasks,
  createTask,
  patchTasks,
  patchTask,
  getTaskDetail,
  getTaskDetailAlias,
  taskAction,
  sendEditorReview,
  listComments,
  createComment,
  replyToComment,
  patchComment,
  addressComment,
  resolveComment,
  reopenComment,
  listTaskComments,
} from "../controllers/studio.controller.js";

const router = Router();

router.post(
  "/studio/chapters/:chapterId/send-editor-review",
  requireExactRole("MANGAKA") as any,
  sendEditorReview,
);

// Regions
router.get("/studio/regions", listRegions);
router.post("/studio/regions", requireExactRole("MANGAKA") as any, createRegion);
router.patch("/studio/regions", requireExactRole("MANGAKA") as any, patchRegions);
router.patch("/studio/regions/:id", requireExactRole("MANGAKA") as any, patchRegion);
router.delete("/studio/regions/:id", requireExactRole("MANGAKA") as any, deleteRegion);

// Tasks
router.get("/studio/tasks", listTasks);
router.post("/studio/tasks", requireExactRole("MANGAKA") as any, createTask);
router.patch("/studio/tasks", requireExactRole("MANGAKA") as any, patchTasks);
router.patch("/studio/tasks/:id", requireExactRole("MANGAKA") as any, patchTask);
router.get("/tasks/:taskId", getTaskDetail);
router.get("/studio/tasks/:taskId", getTaskDetailAlias);
router.post(
  "/studio/tasks/:taskId/actions/:action",
  requireExactRole("EDITOR", "MANGAKA", "ASSISTANT") as any,
  taskAction,
);

// Comments
router.get("/comments", listComments);
router.post("/comments", requireExactRole("EDITOR", "MANGAKA", "ASSISTANT") as any, createComment);
router.post(
  "/comments/:commentId/replies",
  requireExactRole("EDITOR", "MANGAKA", "ASSISTANT") as any,
  replyToComment,
);
router.patch("/comments/:commentId", requireExactRole("EDITOR", "MANGAKA") as any, patchComment);
router.post("/comments/:commentId/resolve", requireExactRole("EDITOR") as any, resolveComment);
router.post("/comments/:commentId/address", requireExactRole("MANGAKA") as any, addressComment);
router.post("/comments/:commentId/reopen", requireExactRole("EDITOR") as any, reopenComment);
router.get("/comments/task/:taskId", listTaskComments);

export default router;
