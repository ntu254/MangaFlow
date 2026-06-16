import { AppError } from "../errors/AppError.js";
import { Chapter, FileAsset, Page, Region } from "../../modules/chapter/chapter.model.js";
import { SeriesMember } from "../../modules/series/series.model.js";
import { Submission } from "../../modules/submission/submission.model.js";
import { Task } from "../../modules/task/task.model.js";
async function isActiveSeriesManager(seriesId, actor) {
    const member = await SeriesMember.findOne({ seriesId, userId: actor.userId });
    // Support both the new status field (Flow-03) and the legacy isActive boolean
    const isActive = member?.status === "ACTIVE" || (member?.status === undefined && member?.isActive === true);
    return Boolean(isActive && ["MANGAKA", "EDITOR"].includes(member.role));
}
export async function canReadChapter(actor, chapterId) {
    const chapter = await Chapter.findById(chapterId);
    if (!chapter)
        throw new AppError("Chapter not found", 404);
    const seriesId = String(chapter.seriesId);
    if (actor.role === "ADMIN")
        return true;
    return await isActiveSeriesManager(seriesId, actor);
}
export async function assertCanReadChapter(actor, chapterId) {
    if (!(await canReadChapter(actor, chapterId))) {
        throw new AppError("Chapter access denied", 403);
    }
}
export async function canReadPage(actor, pageId) {
    const page = await Page.findById(pageId);
    if (!page)
        throw new AppError("Page not found", 404);
    const chapter = await Chapter.findById(page.chapterId);
    if (!chapter)
        throw new AppError("Chapter not found", 404);
    const seriesId = String(chapter.seriesId);
    if (actor.role === "ADMIN")
        return true;
    if (await isActiveSeriesManager(seriesId, actor))
        return true;
    if (actor.role !== "ASSISTANT")
        return false;
    const assignedOrContextTask = await Task.findOne({
        seriesId,
        assignedTo: actor.userId,
        $or: [
            { pageId },
            { contextPageIds: pageId },
        ],
    });
    return Boolean(assignedOrContextTask);
}
export async function assertCanReadPage(actor, pageId) {
    if (!(await canReadPage(actor, pageId))) {
        throw new AppError("Page access denied", 403);
    }
}
export async function assertCanReadRegion(actor, regionId) {
    const region = await Region.findById(regionId);
    if (!region)
        throw new AppError("Region not found", 404);
    await assertCanReadPage(actor, String(region.pageId));
}
export async function canWritePage(actor, pageId) {
    const page = await Page.findById(pageId);
    if (!page)
        throw new AppError("Page not found", 404);
    const chapter = await Chapter.findById(page.chapterId);
    if (!chapter)
        throw new AppError("Chapter not found", 404);
    const seriesId = String(chapter.seriesId);
    if (actor.role === "ADMIN")
        return true;
    return await isActiveSeriesManager(seriesId, actor);
}
export async function assertCanWritePage(actor, pageId) {
    if (!(await canWritePage(actor, pageId))) {
        throw new AppError("Page write access denied", 403);
    }
}
export async function canWriteChapter(actor, chapterId) {
    const chapter = await Chapter.findById(chapterId);
    if (!chapter)
        throw new AppError("Chapter not found", 404);
    const seriesId = String(chapter.seriesId);
    if (actor.role === "ADMIN")
        return true;
    return await isActiveSeriesManager(seriesId, actor);
}
export async function assertCanWriteChapter(actor, chapterId) {
    if (!(await canWriteChapter(actor, chapterId))) {
        throw new AppError("Chapter write access denied", 403);
    }
}
export async function canWriteRegion(actor, regionId) {
    const region = await Region.findById(regionId);
    if (!region)
        throw new AppError("Region not found", 404);
    return canWritePage(actor, String(region.pageId));
}
export async function assertCanWriteRegion(actor, regionId) {
    if (!(await canWriteRegion(actor, regionId))) {
        throw new AppError("Region write access denied", 403);
    }
}
export async function assertCanReadFileAsset(actor, fileAssetId) {
    const fileAsset = await FileAsset.findById(fileAssetId);
    if (!fileAsset)
        throw new AppError("File asset not found", 404);
    if (String(fileAsset.uploadedBy) === actor.userId)
        return;
    if (actor.role === "ADMIN")
        return;
    const page = await Page.findOne({
        $or: [
            { originalFileAssetId: fileAssetId },
            { variantFileAssetIds: fileAssetId },
        ],
    });
    if (page) {
        await assertCanReadPage(actor, String(page._id));
        return;
    }
    const submission = await Submission.findOne({ fileAssetId });
    if (submission) {
        if (String(submission.submittedBy) === actor.userId)
            return;
        if (await isActiveSeriesManager(String(submission.seriesId), actor))
            return;
        if (actor.role === "ASSISTANT") {
            const task = await Task.findOne({ _id: submission.taskId, assignedTo: actor.userId });
            if (task)
                return;
        }
    }
    throw new AppError("File access denied", 403);
}
//# sourceMappingURL=accessPolicy.service.js.map