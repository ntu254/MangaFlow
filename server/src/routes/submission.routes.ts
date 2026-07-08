import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  listSubmissions,
  createSubmission,
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
router.post("/submissions", requireRole("ASSISTANT", "MANGAKA", "EDITOR") as any, createSubmission);
router.get("/submissions/review-queue", requireRole("EDITOR") as any, reviewQueue);
router.get("/submissions/:submissionId", getSubmission);
router.get("/tasks/:taskId/submissions", listTaskSubmissions);
router.post("/submissions/:submissionId/approve", requireRole("MANGAKA", "EDITOR") as any, approveSubmission);
router.post("/submissions/:submissionId/reject", requireRole("MANGAKA", "EDITOR") as any, rejectSubmission);
router.post("/submissions/:submissionId/request-revision", requireRole("MANGAKA", "EDITOR") as any, requestRevision);
router.post("/submissions/:submissionId/editor-approve", requireRole("EDITOR") as any, editorApprove);

export default router;
