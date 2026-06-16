import { User } from "../auth/auth.model.js";
import { Manuscript, Series } from "../series/series.model.js";
import { AtRiskDecisionRecord, BoardDecision, BoardMember, BoardReviewSession, BoardVote } from "./board.model.js";
export async function listBoardQueueSeries() {
    return Series.find({ status: { $in: ["BOARD_REVIEW", "APPROVED", "REJECTED", "REVISION_REQUESTED"] } }).sort({ updatedAt: -1 });
}
export async function getDecisionBySeries(seriesId, session) {
    return BoardDecision.findOne({ seriesId }).session(session ?? null);
}
export async function getBoardSeries(seriesId, session) {
    return Series.findById(seriesId).session(session ?? null);
}
export async function getOpenBoardReviewSession(seriesId, session) {
    return BoardReviewSession.findOne({ seriesId, status: "OPEN" }).sort({ createdAt: -1 }).session(session ?? null);
}
export async function createBoardReviewSession(seriesId, openedBy, session) {
    const existing = await getOpenBoardReviewSession(seriesId, session);
    if (existing)
        return existing;
    const [reviewSession] = await BoardReviewSession.create([{ seriesId, openedBy, status: "OPEN" }], { session });
    return reviewSession;
}
export async function closeBoardReviewSession(sessionId, session) {
    return BoardReviewSession.findByIdAndUpdate(sessionId, { status: "CLOSED", closedAt: new Date() }, { new: true, session });
}
export async function createBoardVote(seriesId, sessionId, userId, value, note, session) {
    const [vote] = await BoardVote.create([{ seriesId, sessionId, userId, value, note }], { session });
    return vote;
}
export async function listBoardVotes(seriesId, session, sessionId) {
    return BoardVote.find(sessionId ? { seriesId, sessionId } : { seriesId }).session(session ?? null);
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
export async function updateDecision(seriesId, status, result, decidedBy, session, publicationType, note) {
    const patch = { status, result, decidedBy, publicationType, note };
    if (!["PENDING", "TIE_BREAK_REQUIRED"].includes(status))
        patch.finalizedAt = new Date();
    return BoardDecision.findOneAndUpdate({ seriesId }, patch, { new: true, upsert: true, setDefaultsOnInsert: true, session });
}
export async function updateSeriesAfterDecision(seriesId, status, session, publicationType) {
    const patch = { status };
    if (publicationType)
        patch.publicationType = publicationType;
    return Series.findByIdAndUpdate(seriesId, patch, { new: true, session });
}
export async function updateLatestManuscriptAfterDecision(seriesId, status, session) {
    const manuscript = await Manuscript.findOne({ seriesId }).sort({ version: -1 }).session(session ?? null);
    if (!manuscript)
        return null;
    manuscript.status = status;
    await manuscript.save({ session });
    return manuscript;
}
export async function createAtRiskDecision(seriesId, decision, decidedBy, note, session) {
    const [record] = await AtRiskDecisionRecord.create([{ seriesId, decision, decidedBy, note }], { session });
    return record;
}
//# sourceMappingURL=board.repository.js.map