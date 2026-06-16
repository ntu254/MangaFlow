import { runAISegmentationService, listAIResultsService, acceptAISuggestionService, rejectAISuggestionService, } from "../chapter.service.js";
function actorOf(req) {
    return { userId: req.user.userId, role: req.user.role };
}
export async function runAISegmentation(req, res, _next) {
    const aiResult = await runAISegmentationService(String(req.params.pageId), actorOf(req));
    res.status(201).json({ success: true, message: "AI segmentation completed", data: aiResult });
}
export async function listAIResults(req, res, _next) {
    const results = await listAIResultsService(String(req.params.pageId), actorOf(req));
    res.json({ success: true, message: "AI results retrieved", data: results });
}
export async function acceptAISuggestion(req, res, _next) {
    const result = await acceptAISuggestionService({
        aiResultId: String(req.params.aiResultId),
        suggestionIndex: req.body.suggestionIndex,
        actor: actorOf(req),
    });
    res.status(201).json({ success: true, message: "AI suggestion accepted", data: result });
}
export async function rejectAISuggestion(req, res, _next) {
    const result = await rejectAISuggestionService({
        aiResultId: String(req.params.aiResultId),
        suggestionIndex: req.body.suggestionIndex,
        actor: actorOf(req),
    });
    res.json({ success: true, message: "AI suggestion rejected", data: result });
}
//# sourceMappingURL=ai.controller.js.map