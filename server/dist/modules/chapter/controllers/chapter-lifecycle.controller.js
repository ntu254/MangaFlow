import { createChapterService, getChapterService, listChaptersService, updateChapterStatusService, } from "../chapter.service.js";
export async function createChapter(req, res, _next) {
    const chapter = await createChapterService({
        seriesId: req.body.seriesId,
        chapterNumber: req.body.chapterNumber,
        title: req.body.title,
    });
    res.status(201).json({ success: true, message: "Chapter created successfully", data: chapter });
}
export async function listChapters(req, res, _next) {
    const chapters = await listChaptersService(String(req.params.seriesId));
    res.json({ success: true, message: "Chapters retrieved successfully", data: chapters });
}
export async function getChapter(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const chapter = await getChapterService(String(req.params.chapterId), actor);
    res.json({ success: true, message: "Chapter retrieved successfully", data: chapter });
}
export async function updateChapterStatus(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const chapter = await updateChapterStatusService(String(req.params.chapterId), req.body.status, actor);
    res.json({ success: true, message: "Chapter status updated successfully", data: chapter });
}
//# sourceMappingURL=chapter-lifecycle.controller.js.map