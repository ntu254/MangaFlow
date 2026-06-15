import { AppError } from "../../../shared/errors/AppError.js";
import { createChapterRepository, getChapterById, listChaptersBySeries, updateChapterStatus } from "../chapter.repository.js";
import { assertCanReadChapter, assertCanWriteChapter } from "../../../shared/policies/accessPolicy.service.js";
export async function createChapterService(input) {
    if (!input.title?.trim()) {
        throw new AppError("Chapter title is required", 400);
    }
    if (typeof input.chapterNumber !== "number" || input.chapterNumber < 1) {
        throw new AppError("Valid chapter number is required", 400);
    }
    try {
        return await createChapterRepository({
            seriesId: input.seriesId.trim(),
            chapterNumber: input.chapterNumber,
            title: input.title.trim(),
        });
    }
    catch (error) {
        const message = String(error.message ?? "");
        if (message.includes("Series not found"))
            throw new AppError("Series not found", 404);
        if (message.includes("Chapter creation not allowed"))
            throw new AppError(message, 409);
        if (message.includes("already exists"))
            throw new AppError(message, 409);
        throw new AppError("Unable to create chapter", 400);
    }
}
export async function listChaptersService(seriesId) {
    if (!seriesId?.trim())
        throw new AppError("Series id is required", 400);
    return listChaptersBySeries(seriesId.trim());
}
export async function getChapterService(chapterId, actor) {
    const trimmed = chapterId.trim();
    if (!trimmed)
        throw new AppError("Chapter id is required", 400);
    await assertCanReadChapter(actor, trimmed);
    const chapter = await getChapterById(trimmed);
    if (!chapter)
        throw new AppError("Chapter not found", 404);
    return chapter;
}
export async function updateChapterStatusService(chapterId, status, actor) {
    const trimmed = chapterId.trim();
    if (!trimmed)
        throw new AppError("Chapter id is required", 400);
    await assertCanWriteChapter(actor, trimmed);
    if (!status?.trim())
        throw new AppError("Status is required", 400);
    const chapter = await updateChapterStatus(trimmed, status);
    if (!chapter)
        throw new AppError("Chapter not found", 404);
    return chapter;
}
//# sourceMappingURL=chapter.lifecycle.js.map