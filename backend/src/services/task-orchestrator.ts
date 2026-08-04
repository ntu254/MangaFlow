/**
 * Sprint 3.3 (TASK-001) — facade over the legacy task-submission.service.ts so
 * the new orchestrator can route calls without forcing every controller to
 * rewrite its imports. The full split into:
 *
 *   - task.service.ts (CRUD + action gating)
 *   - submission.service.ts (PENDING/MANGAKA_APPROVED lifecycle)
 *   - earning-orchestrator.ts (record + reverse + adjust)
 *
 * lands behind this file. Existing controllers can call into either the
 * re-exported helpers or the legacy service. When all callers have moved
 * over, this file becomes the public entry point and the legacy service is
 * retired.
 */
export {
  applyMangakaApproval,
  applySubmissionAction,
  applyTaskAction,
  handleSubmissionUpload,
  recordSubmission,
  sendSubmissionReview,
} from "./task-submission.service.js";
