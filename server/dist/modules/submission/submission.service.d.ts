export type { SubmissionActor } from "./policies/submission-access.policy.js";
export type { SubmitTaskInput } from "./services/submission-query.service.js";
export type { ReviewInput } from "./services/submission-command.service.js";
export { createTaskSubmissionService, listTaskSubmissionsService, listReviewQueueSubmissionsService } from "./services/submission-query.service.js";
export { mangakaApproveSubmissionService, editorApproveSubmissionService, requestSubmissionRevisionService, rejectSubmissionService, editorRejectSubmissionService } from "./services/submission-command.service.js";
//# sourceMappingURL=submission.service.d.ts.map