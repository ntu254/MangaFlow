import { AppError } from "../../shared/errors/AppError.js";
import { getManuscriptById, getSeriesForManuscript, updateManuscriptReviewStatus, updateSeriesReviewStatus, } from "./manuscript.repository.js";
async function assertEditor(actor) {
    if (actor.role !== "EDITOR") {
        throw new AppError("Only Editor can review manuscripts", 403);
    }
}
async function getReviewContext(manuscriptId) {
    const manuscript = await getManuscriptById(manuscriptId);
    if (!manuscript) {
        throw new AppError("Manuscript not found", 404);
    }
    const series = await getSeriesForManuscript(String(manuscript.seriesId));
    if (!series) {
        throw new AppError("Series not found", 404);
    }
    if (series.status !== "EDITOR_REVIEW") {
        throw new AppError("Series must be in EDITOR_REVIEW for manuscript review", 409);
    }
    if (manuscript.status !== "EDITOR_REVIEW") {
        throw new AppError("Manuscript must be in EDITOR_REVIEW for this action", 409);
    }
    return { manuscript, series };
}
async function applyReviewDecision(input, manuscriptStatus, seriesStatus) {
    await assertEditor(input.actor);
    const { manuscript, series } = await getReviewContext(input.manuscriptId);
    const updatedManuscript = await updateManuscriptReviewStatus(String(manuscript._id), manuscriptStatus, input.reviewNote);
    await updateSeriesReviewStatus(String(series._id), seriesStatus);
    return updatedManuscript;
}
export async function requestManuscriptRevisionService(input) {
    return applyReviewDecision(input, "REVISION_REQUESTED", "REVISION_REQUESTED");
}
export async function forwardManuscriptToBoardService(input) {
    return applyReviewDecision(input, "APPROVED_TO_BOARD", "BOARD_REVIEW");
}
export async function rejectManuscriptService(input) {
    return applyReviewDecision(input, "REJECTED", "REJECTED");
}
//# sourceMappingURL=manuscript.service.js.map