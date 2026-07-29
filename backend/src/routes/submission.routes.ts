import { Router } from "express";
import { requireExactRole } from "../middleware/auth.js";
import {
  listSubmissions,
  createSubmission,
  submitTask,
  reopenTask,
  reviewQueue,
  getSubmission,
  listTaskSubmissions,
  approveSubmission,
  rejectSubmission,
  requestRevision,
  editorApprove
} from "../controllers/submission.controller.js";

const router = Router();

router.get("/submissions", listSubmissions);
router.post("/submissions", requireExactRole("ASSISTANT", "MANGAKA", "EDITOR") as any, createSubmission);
router.post("/tasks/:taskId/submit", requireExactRole("ASSISTANT") as any, submitTask);
router.post("/tasks/:taskId/reopen", requireExactRole("ASSISTANT") as any, reopenTask);
router.get("/submissions/review-queue", requireExactRole("EDITOR") as any, reviewQueue);
router.get("/submissions/:submissionId", getSubmission);
router.get("/tasks/:taskId/submissions", listTaskSubmissions);
router.post("/submissions/:submissionId/approve", requireExactRole("MANGAKA") as any, approveSubmission);
router.post("/submissions/:submissionId/reject", requireExactRole("MANGAKA") as any, rejectSubmission);
router.post("/submissions/:submissionId/request-revision", requireExactRole("MANGAKA") as any, requestRevision);
router.post("/submissions/:submissionId/editor-approve", requireExactRole("EDITOR") as any, editorApprove);

export default router;
