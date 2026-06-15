import { getPageWorkspaceService } from "./page.service.js";
export async function getPageWorkspace(req, res) {
    const data = await getPageWorkspaceService(String(req.params.pageId), req.user.userId, req.user.role);
    res.json({ success: true, message: "Page workspace retrieved", data });
}
//# sourceMappingURL=page.controller.js.map