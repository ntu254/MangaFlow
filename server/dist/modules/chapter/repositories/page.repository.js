import { Chapter, FileAsset, Page } from "../chapter.model.js";
export async function createPageRepository(chapterId, pageNumber) {
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
        throw new Error("Chapter not found");
    }
    const existing = await Page.findOne({ chapterId, pageNumber });
    if (existing) {
        throw new Error(`Page ${pageNumber} already exists in this chapter`);
    }
    return Page.create({
        chapterId,
        pageNumber,
        status: "UPLOADED",
        regionIds: [],
    });
}
export async function getPagesByChapter(chapterId) {
    return Page.find({ chapterId }).sort({ pageNumber: 1 }).lean();
}
export async function getPageById(pageId) {
    return Page.findById(pageId);
}
export async function updatePageStatus(pageId, status) {
    return Page.findByIdAndUpdate(pageId, { status }, { new: true });
}
export async function confirmPageUploadRepository(input) {
    const page = await Page.findByIdAndUpdate(input.pageId, { status: "UPLOADED", originalFileAssetId: input.fileAssetId }, { new: true });
    if (!page) {
        throw new Error("Page not found");
    }
    const fileAsset = await FileAsset.create({
        _id: input.fileAssetId,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        r2Key: input.r2Key,
        r2Bucket: process.env.R2_BUCKET || "mangaflow",
        uploadedBy: page.chapterId,
    });
    return { page, fileAsset };
}
export async function getFileAssetById(fileAssetId) {
    return FileAsset.findById(fileAssetId);
}
export async function getPageWithFileAsset(pageId) {
    return Page.findById(pageId).populate("originalFileAssetId");
}
//# sourceMappingURL=page.repository.js.map