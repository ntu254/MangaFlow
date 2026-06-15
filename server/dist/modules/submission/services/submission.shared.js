import { AppError } from "../../../shared/errors/AppError.js";
import { getSubmissionById, getTaskForSubmission } from "../submission.repository.js";
export async function getSubmissionWithTask(submissionId) {
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
        throw new AppError("Submission not found", 404);
    }
    const task = await getTaskForSubmission(String(submission.taskId));
    if (!task) {
        throw new AppError("Task not found", 404);
    }
    return { submission, task };
}
//# sourceMappingURL=submission.shared.js.map