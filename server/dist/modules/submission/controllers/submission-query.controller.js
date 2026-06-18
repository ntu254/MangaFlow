import { createTaskSubmissionService, listReviewQueueSubmissionsService, listTaskSubmissionsService, getTaskUploadUrlService, } from "../submission.service.js";
export async function createTaskSubmission(req, res, _next) {
    const submission = await createTaskSubmissionService({
        taskId: req.params.taskId,
        actor: req.user,
        resultText: req.body.resultText,
        fileAssetId: req.body.fileAssetId,
    });
    res.status(201).json({ success: true, message: "Submission created successfully", data: submission });
}
export async function listTaskSubmissions(req, res, _next) {
    const submissions = await listTaskSubmissionsService(req.params.taskId, req.user);
    res.json({ success: true, message: "Submissions retrieved successfully", data: submissions });
}
export async function listReviewQueueSubmissions(req, res, _next) {
    const submissions = await listReviewQueueSubmissionsService(req.user);
    res.json({ success: true, message: "Review queue retrieved successfully", data: submissions });
}
export async function getTaskUploadUrl(req, res, _next) {
    const result = await getTaskUploadUrlService({
        taskId: req.params.taskId,
        actor: req.user,
        originalName: req.body.originalName,
        contentType: req.body.contentType,
        size: req.body.size,
    });
    res.json({ success: true, message: "Upload URL generated", data: result });
}
//# sourceMappingURL=submission-query.controller.js.map