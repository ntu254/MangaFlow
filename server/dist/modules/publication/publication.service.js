import { AppError } from "../../shared/errors/AppError.js";
import { getChapterReadinessService } from "../chapter/chapter.service.js";
import { findActiveSeriesMember } from "../../shared/policies/seriesMember.policy.js";
import { createPublicationRecord, getPublicationById, getPublicationChapter, markPublicationPublished, updateChapterDraftSchedule, updateChapterPublicationStatus, updatePublicationSchedule, } from "./publication.repository.js";
async function assertEditorForSeries(seriesId, actor) {
    if (actor.role !== "EDITOR") {
        throw new AppError("Publication access denied", 403);
    }
    const member = await findActiveSeriesMember(seriesId, actor.userId);
    if (!member || member.role !== "EDITOR") {
        throw new AppError("Publication access denied", 403);
    }
}
function parseScheduleDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new AppError("Valid publication date is required", 400);
    }
    return date;
}
export async function createPublicationService(input) {
    const chapter = await getPublicationChapter(input.chapterId);
    if (!chapter) {
        throw new AppError("Chapter not found", 404);
    }
    await assertEditorForSeries(String(chapter.seriesId), input.actor);
    const scheduledFor = input.scheduledFor ? parseScheduleDate(input.scheduledFor) : undefined;
    if (scheduledFor) {
        await updateChapterDraftSchedule(input.chapterId, scheduledFor);
    }
    return createPublicationRecord({
        chapterId: input.chapterId,
        seriesId: String(chapter.seriesId),
        createdBy: input.actor.userId,
        scheduledFor,
    });
}
export async function schedulePublicationService(input) {
    const publication = await getPublicationById(input.publicationId);
    if (!publication) {
        throw new AppError("Publication not found", 404);
    }
    await assertEditorForSeries(String(publication.seriesId), input.actor);
    const scheduledFor = parseScheduleDate(input.scheduledFor);
    await updateChapterDraftSchedule(String(publication.chapterId), scheduledFor);
    return updatePublicationSchedule(input.publicationId, scheduledFor, input.actor.userId);
}
export async function publishPublicationService(publicationId, actor) {
    const publication = await getPublicationById(publicationId);
    if (!publication) {
        throw new AppError("Publication not found", 404);
    }
    await assertEditorForSeries(String(publication.seriesId), actor);
    if (publication.publishedAt) {
        throw new AppError("Publication is already published", 409);
    }
    const readiness = await getChapterReadinessService(String(publication.chapterId));
    if (!readiness.ready) {
        const failed = readiness.items.filter((item) => !item.passed).map((item) => item.key).join(", ");
        throw new AppError(`Chapter is not ready for publication: ${failed}`, 409);
    }
    await updateChapterPublicationStatus(String(publication.chapterId), "READY_FOR_PUBLICATION");
    await updateChapterPublicationStatus(String(publication.chapterId), "PUBLISHED");
    return markPublicationPublished(publicationId, actor.userId, new Date());
}
//# sourceMappingURL=publication.service.js.map