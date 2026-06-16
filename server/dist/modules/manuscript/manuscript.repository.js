import { Manuscript, Series } from "../series/series.model.js";
export async function getManuscriptById(manuscriptId) {
    return Manuscript.findById(manuscriptId);
}
export async function getLatestManuscriptForSeries(seriesId) {
    return Manuscript.findOne({ seriesId }).sort({ version: -1 });
}
export async function getSeriesForManuscript(seriesId) {
    return Series.findById(seriesId);
}
export async function updateManuscriptReviewStatus(manuscriptId, status, reviewNote, metadata) {
    return Manuscript.findByIdAndUpdate(manuscriptId, { status, reviewNote, ...metadata }, { new: true });
}
export async function updateSeriesReviewStatus(seriesId, status) {
    return Series.findByIdAndUpdate(seriesId, { status }, { new: true });
}
export async function listEditorReviewQueue() {
    const seriesList = await Series.find({ status: "EDITOR_REVIEW" }).sort({ updatedAt: -1 }).lean();
    const seriesIds = seriesList.map((series) => series._id);
    const manuscripts = await Manuscript.find({ seriesId: { $in: seriesIds } }).sort({ version: -1 }).lean();
    const latestBySeries = new Map();
    for (const manuscript of manuscripts) {
        const key = String(manuscript.seriesId);
        if (!latestBySeries.has(key))
            latestBySeries.set(key, manuscript);
    }
    return seriesList.map((series) => ({
        series,
        manuscript: latestBySeries.get(String(series._id)) ?? null,
    }));
}
//# sourceMappingURL=manuscript.repository.js.map