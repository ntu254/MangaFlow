import { createPageService, listPagesService } from "../chapter.service.js";
export async function createPage(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const page = await createPageService(String(req.params.chapterId), req.body.pageNumber, actor);
    res.status(201).json({ success: true, message: "Page created successfully", data: page });
}
export async function listPages(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const pages = await listPagesService(String(req.params.chapterId), actor);
    res.json({ success: true, message: "Pages retrieved successfully", data: pages });
}
//# sourceMappingURL=page.controller.js.map