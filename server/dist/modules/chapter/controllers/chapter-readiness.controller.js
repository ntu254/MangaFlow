import { getChapterReadinessService } from "../chapter.service.js";
export async function getChapterReadiness(req, res, _next) {
    const readiness = await getChapterReadinessService(String(req.params.chapterId));
    res.json({ success: true, message: "Chapter readiness retrieved successfully", data: readiness });
}
//# sourceMappingURL=chapter-readiness.controller.js.map