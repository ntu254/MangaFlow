import { Chapter } from "../chapter/chapter.model.js";
import { Publication } from "./publication.model.js";
export async function getPublicationChapter(chapterId) {
    return Chapter.findById(chapterId);
}
export async function getPublicationById(publicationId) {
    return Publication.findById(publicationId);
}
export async function getPublicationByChapter(chapterId) {
    return Publication.findOne({ chapterId });
}
export async function createPublicationRecord(input) {
    return Publication.findOneAndUpdate({ chapterId: input.chapterId }, {
        chapterId: input.chapterId,
        seriesId: input.seriesId,
        createdBy: input.createdBy,
        ...(input.scheduledFor ? { scheduledFor: input.scheduledFor, scheduleManagedBy: input.createdBy } : {}),
    }, { new: true, upsert: true, setDefaultsOnInsert: true });
}
export async function updatePublicationSchedule(publicationId, scheduledFor, actorId) {
    return Publication.findByIdAndUpdate(publicationId, { scheduledFor, scheduleManagedBy: actorId }, { new: true });
}
export async function markPublicationPublished(publicationId, actorId, publishedAt) {
    return Publication.findByIdAndUpdate(publicationId, { publishedAt, publishedBy: actorId }, { new: true });
}
export async function updateChapterDraftSchedule(chapterId, scheduledFor) {
    return Chapter.findByIdAndUpdate(chapterId, { draftSchedule: scheduledFor }, { new: true });
}
export async function updateChapterPublicationStatus(chapterId, status) {
    return Chapter.findByIdAndUpdate(chapterId, { status }, { new: true });
}
//# sourceMappingURL=publication.repository.js.map