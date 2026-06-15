import { editorApproveSubmissionService, mangakaApproveSubmissionService, rejectSubmissionService, requestSubmissionRevisionService, } from "../submission.service.js";
export async function mangakaApproveSubmission(req, res, _next) {
    const submission = await mangakaApproveSubmissionService({
        submissionId: req.params.submissionId,
        actor: req.user,
        reviewerNote: req.body.reviewerNote,
    });
    res.json({ success: true, message: "Submission approved by Mangaka", data: submission });
}
export async function requestSubmissionRevision(req, res, _next) {
    const submission = await requestSubmissionRevisionService({
        submissionId: req.params.submissionId,
        actor: req.user,
        reviewerNote: req.body.reviewerNote,
    });
    res.json({ success: true, message: "Submission revision requested", data: submission });
}
export async function rejectSubmission(req, res, _next) {
    const submission = await rejectSubmissionService({
        submissionId: req.params.submissionId,
        actor: req.user,
        reviewerNote: req.body.reviewerNote,
    });
    res.json({ success: true, message: "Submission rejected", data: submission });
}
export async function editorApproveSubmission(req, res, _next) {
    const submission = await editorApproveSubmissionService({
        submissionId: req.params.submissionId,
        actor: req.user,
        reviewerNote: req.body.reviewerNote,
    });
    res.json({ success: true, message: "Submission final-approved by Editor", data: submission });
}
//# sourceMappingURL=submission-review.controller.js.map