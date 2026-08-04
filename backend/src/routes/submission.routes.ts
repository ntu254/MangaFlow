import { Router } from "express";
import { requireExactRole } from "../middleware/auth.js";
import { asyncRoute, AppError } from "../lib/http.js";
import {
  listSubmissions,
  submitTask,
  reopenTask,
  reviewQueue,
  getSubmission,
  listTaskSubmissions,
  approveSubmission,
  rejectSubmission,
  requestRevision,
} from "../controllers/submission.controller.js";

const router = Router();

router.post(
  "/submissions",
  requireExactRole("ASSISTANT") as any,
  asyncRoute(async () => {
    throw new AppError(
      410,
      "Direct submission creation is retired. Submit work through the task workflow.",
      "ENDPOINT_DEPRECATED",
      { replacement: "/api/tasks/:taskId/submit" },
    );
  }),
);
router.post(
  "/submissions/:submissionId/editor-approve",
  requireExactRole("EDITOR") as any,
  asyncRoute(async () => {
    throw new AppError(
      410,
      "Editor submission approval is retired. Use chapter review workflow.",
      "WORKFLOW_REMOVED",
      { replacement: "/api/chapters/:chapterId/reviews" },
    );
  }),
);

router.get("/submissions", listSubmissions);
router.post("/tasks/:taskId/submit", requireExactRole("ASSISTANT") as any, submitTask);
router.post("/tasks/:taskId/reopen", requireExactRole("ASSISTANT") as any, reopenTask);
router.get("/submissions/review-queue", requireExactRole("EDITOR") as any, reviewQueue);
router.get("/submissions/:submissionId", getSubmission);
router.get("/tasks/:taskId/submissions", listTaskSubmissions);
router.post("/submissions/:submissionId/approve", requireExactRole("MANGAKA") as any, approveSubmission);
router.post("/submissions/:submissionId/reject", requireExactRole("MANGAKA") as any, rejectSubmission);
router.post("/submissions/:submissionId/request-revision", requireExactRole("MANGAKA") as any, requestRevision);

export default router;
