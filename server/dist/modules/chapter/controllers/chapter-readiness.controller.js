import { getChapterReadinessService, markChapterReadyService } from "../chapter.service.js";
export async function getChapterReadiness(req, res, _next) {
    const readiness = await getChapterReadinessService(String(req.params.chapterId));
    res.json({ success: true, message: "Chapter readiness retrieved successfully", data: readiness });
}
export async function markChapterReady(req, res, _next) {
    const chapter = await markChapterReadyService(String(req.params.chapterId));
    res.json({ success: true, message: "Chapter marked as ready for publication", data: chapter });
}
//# sourceMappingURL=chapter-readiness.controller.js.map