import { getAdminSidebarSummaryService, getMangakaSummaryService, getAssistantSummaryService, getEditorSummaryService, getBoardSummaryService } from "./dashboard.service.js";
export async function getAdminSidebarSummary(_req, res) {
    const data = await getAdminSidebarSummaryService();
    res.json({ success: true, message: "Admin dashboard summary retrieved", data });
}
export async function getMangakaSummary(req, res) {
    const data = await getMangakaSummaryService(req.user.userId);
    res.json({ success: true, message: "Mangaka dashboard summary retrieved", data });
}
export async function getAssistantSummary(req, res) {
    const data = await getAssistantSummaryService(req.user.userId);
    res.json({ success: true, message: "Assistant dashboard summary retrieved", data });
}
export async function getEditorSummary(req, res) {
    const data = await getEditorSummaryService(req.user.userId);
    res.json({ success: true, message: "Editor dashboard summary retrieved", data });
}
export async function getBoardSummary(req, res) {
    const data = await getBoardSummaryService(req.user.userId);
    res.json({ success: true, message: "Board dashboard summary retrieved", data });
}
//# sourceMappingURL=dashboard.controller.js.map