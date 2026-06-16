import { forwardManuscriptToBoardService, rejectManuscriptService, requestManuscriptRevisionService, } from "./manuscript.service.js";
export async function requestRevision(req, res) {
    const manuscript = await requestManuscriptRevisionService({
        manuscriptId: String(req.params.manuscriptId),
        actor: req.user,
        ...req.body,
    });
    res.json({ success: true, message: "Manuscript revision requested", data: manuscript });
}
export async function forwardToBoard(req, res) {
    const manuscript = await forwardManuscriptToBoardService({
        manuscriptId: String(req.params.manuscriptId),
        actor: req.user,
        ...req.body,
    });
    res.json({ success: true, message: "Manuscript forwarded to Board", data: manuscript });
}
export async function reject(req, res) {
    const manuscript = await rejectManuscriptService({
        manuscriptId: String(req.params.manuscriptId),
        actor: req.user,
        ...req.body,
    });
    res.json({ success: true, message: "Manuscript rejected", data: manuscript });
}
//# sourceMappingURL=manuscript.controller.js.map