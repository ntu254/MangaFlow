import { AppError } from "../../../shared/errors/AppError.js";
import { createPageRepository, getPagesByChapter } from "../chapter.repository.js";
import { assertCanReadChapter, assertCanWriteChapter } from "../../../shared/policies/accessPolicy.service.js";
export async function createPageService(chapterId, pageNumber, actor) {
    const trimmed = chapterId.trim();
    if (!trimmed)
        throw new AppError("Chapter id is required", 400);
    await assertCanWriteChapter(actor, trimmed);
    if (typeof pageNumber !== "number" || pageNumber < 1)
        throw new AppError("Valid page number is required", 400);
    try {
        return await createPageRepository(trimmed, pageNumber);
    }
    catch (error) {
        const message = String(error.message ?? "");
        if (message.includes("Chapter not found"))
            throw new AppError("Chapter not found", 404);
        if (message.includes("already exists"))
            throw new AppError(message, 409);
        throw new AppError("Unable to create page", 400);
    }
}
export async function listPagesService(chapterId, actor) {
    const trimmed = chapterId.trim();
    if (!trimmed)
        throw new AppError("Chapter id is required", 400);
    await assertCanReadChapter(actor, trimmed);
    return getPagesByChapter(trimmed);
}
//# sourceMappingURL=page.service.js.map