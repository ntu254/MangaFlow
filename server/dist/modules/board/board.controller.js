import { castBoardVoteService, createAtRiskDecisionService, finalizeBoardDecisionService, listBoardQueueService, tieBreakBoardDecisionService } from "./board.service.js";
export async function listQueue(_req, res) {
    const data = await listBoardQueueService();
    res.json({ success: true, message: "Board queue retrieved", data });
}
export async function castVote(req, res) {
    const data = await castBoardVoteService(String(req.params.seriesId), req.user.userId, req.body.value);
    res.status(201).json({ success: true, message: "Board vote recorded", data });
}
export async function finalizeDecision(req, res) {
    const data = await finalizeBoardDecisionService(String(req.params.seriesId), req.user.userId);
    res.json({ success: true, message: "Board decision finalized", data });
}
export async function tieBreakDecision(req, res) {
    const data = await tieBreakBoardDecisionService(String(req.params.seriesId), req.user.userId, req.body.value);
    res.json({ success: true, message: "Board tie-break finalized", data });
}
export async function createAtRiskDecision(req, res) {
    const data = await createAtRiskDecisionService(String(req.params.seriesId), req.user.userId, req.body.decision, req.body.note);
    res.status(201).json({ success: true, message: "At-risk decision recorded", data });
}
//# sourceMappingURL=board.controller.js.map