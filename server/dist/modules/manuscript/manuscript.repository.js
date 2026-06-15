import { Manuscript, Series } from "../series/series.model.js";
export async function getManuscriptById(manuscriptId) {
    return Manuscript.findById(manuscriptId);
}
export async function getSeriesForManuscript(seriesId) {
    return Series.findById(seriesId);
}
export async function updateManuscriptReviewStatus(manuscriptId, status, reviewNote) {
    return Manuscript.findByIdAndUpdate(manuscriptId, { status, reviewNote }, { new: true });
}
export async function updateSeriesReviewStatus(seriesId, status) {
    return Series.findByIdAndUpdate(seriesId, { status }, { new: true });
}
//# sourceMappingURL=manuscript.repository.js.map