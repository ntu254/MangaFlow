import { User } from "../auth/auth.model.js";
import { Series } from "../series/series.model.js";
import { AtRiskDecisionRecord, BoardDecision, BoardMember, BoardVote } from "./board.model.js";
export async function listBoardQueueSeries() {
    return Series.find({ status: { $in: ["BOARD_REVIEW", "APPROVED", "REJECTED", "REVISION_REQUESTED"] } }).sort({ updatedAt: -1 });
}
export async function getDecisionBySeries(seriesId, session) {
    return BoardDecision.findOne({ seriesId }).session(session ?? null);
}
export async function getBoardSeries(seriesId, session) {
    return Series.findById(seriesId).session(session ?? null);
}
export async function upsertBoardVote(seriesId, userId, value, session) {
    return BoardVote.findOneAndUpdate({ seriesId, userId }, { value }, { new: true, upsert: true, setDefaultsOnInsert: true, session });
}
export async function listBoardVotes(seriesId, session) {
    return BoardVote.find({ seriesId }).session(session ?? null);
}
export async function listEligibleBoardUsers() {
    const members = await BoardMember.find({ isActive: true });
    if (members.length > 0)
        return members;
    return User.find({ role: "BOARD", isActive: true });
}
export async function isBoardChair(userId) {
    const member = await BoardMember.findOne({ userId, isActive: true, isChair: true });
    return Boolean(member);
}
export async function getOrCreateDecision(seriesId, session) {
    return BoardDecision.findOneAndUpdate({ seriesId }, { $setOnInsert: { status: "PENDING" } }, { new: true, upsert: true, setDefaultsOnInsert: true, session });
}
export async function updateDecision(seriesId, status, result, decidedBy, session) {
    return BoardDecision.findOneAndUpdate({ seriesId }, { status, result, decidedBy }, { new: true, upsert: true, setDefaultsOnInsert: true, session });
}
export async function updateSeriesAfterDecision(seriesId, status, session) {
    return Series.findByIdAndUpdate(seriesId, { status }, { new: true, session });
}
export async function createAtRiskDecision(seriesId, decision, decidedBy, note, session) {
    const [record] = await AtRiskDecisionRecord.create([{ seriesId, decision, decidedBy, note }], { session });
    return record;
}
//# sourceMappingURL=board.repository.js.map