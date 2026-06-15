import { Chapter } from "../chapter.model.js";
import { Series } from "../../series/series.model.js";
export async function createChapterRepository(input) {
    const series = await Series.findById(input.seriesId);
    if (!series) {
        throw new Error("Series not found");
    }
    const allowedStatuses = ["APPROVED", "ONGOING", "AT_RISK"];
    if (!allowedStatuses.includes(series.status)) {
        throw new Error(`Chapter creation not allowed. Series status is ${series.status}. Must be APPROVED, ONGOING, or AT_RISK.`);
    }
    const existing = await Chapter.findOne({ seriesId: input.seriesId, chapterNumber: input.chapterNumber });
    if (existing) {
        throw new Error(`Chapter ${input.chapterNumber} already exists for this series`);
    }
    const chapter = await Chapter.create({
        seriesId: input.seriesId,
        chapterNumber: input.chapterNumber,
        title: input.title,
        status: "DRAFT",
    });
    return {
        id: chapter.id,
        seriesId: String(chapter.seriesId),
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        status: chapter.status,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
    };
}
export async function getChapterById(chapterId) {
    return Chapter.findById(chapterId);
}
export async function listChaptersBySeries(seriesId) {
    return Chapter.find({ seriesId }).sort({ chapterNumber: 1 }).lean();
}
export async function updateChapterStatus(chapterId, status) {
    return Chapter.findByIdAndUpdate(chapterId, { status }, { new: true });
}
//# sourceMappingURL=chapter.repository.js.map