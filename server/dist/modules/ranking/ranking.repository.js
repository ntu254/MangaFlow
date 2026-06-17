import { Ranking } from "./ranking.model.js";
export async function upsertRanking(input) {
    return Ranking.findOneAndUpdate({ period: input.period, seriesId: input.seriesId }, { ...input, status: "DRAFT" }, { new: true, upsert: true, setDefaultsOnInsert: true });
}
export async function listRankings() {
    return Ranking.find()
        .sort({ finalScore: -1, voteCount: -1, updatedAt: -1 })
        .populate("seriesId", "title")
        .lean();
}
export async function listRankingsBySeriesIds(seriesIds) {
    return Ranking.find({ seriesId: { $in: seriesIds } })
        .sort({ finalScore: -1, voteCount: -1, updatedAt: -1 })
        .populate("seriesId", "title")
        .lean();
}
export async function getRankingById(rankingId) {
    return Ranking.findById(rankingId);
}
export async function updateRankingStatus(rankingId, status) {
    return Ranking.findByIdAndUpdate(rankingId, { status }, { new: true });
}
export async function submitRanking(rankingId) {
    return Ranking.findByIdAndUpdate(rankingId, { status: "SUBMITTED" }, { new: true });
}
export async function voidRanking(rankingId) {
    return Ranking.findByIdAndUpdate(rankingId, { status: "VOIDED" }, { new: true });
}
//# sourceMappingURL=ranking.repository.js.map