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
        status: "UPLOADING",
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
async function upsertFileAsset(input, uploadedBy, slot) {
    return FileAsset.findByIdAndUpdate(input.fileAssetId, {
        _id: input.fileAssetId,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        r2Key: input.r2Key,
        r2Bucket: process.env.R2_BUCKET || "mangaflow",
        uploadedBy,
        assetType: "PRODUCTION",
        slot,
    }, { new: true, upsert: true, setDefaultsOnInsert: true });
}
export async function confirmPageUploadRepository(input) {
    const existingPage = await Page.findById(input.pageId);
    if (!existingPage) {
        throw new Error("Page not found");
    }
    const [originalAsset, workingAsset, thumbnailAsset] = await Promise.all([
        upsertFileAsset(input.original, input.uploadedBy, "ORIGINAL"),
        upsertFileAsset(input.working, input.uploadedBy, "WORKING"),
        upsertFileAsset(input.thumbnail, input.uploadedBy, "THUMBNAIL"),
    ]);
    const page = await Page.findByIdAndUpdate(input.pageId, {
        status: "UPLOADED",
        originalFileAssetId: input.original.fileAssetId,
        workingFileAssetId: input.working.fileAssetId,
        thumbnailFileAssetId: input.thumbnail.fileAssetId,
    }, { new: true });
    if (!page) {
        throw new Error("Page not found");
    }
    return { page, originalAsset, workingAsset, thumbnailAsset };
}
export async function markPageProcessingFailed(pageId) {
    return Page.findByIdAndUpdate(pageId, { status: "PROCESSING_FAILED" }, { new: true });
}
export async function getFileAssetById(fileAssetId) {
    return FileAsset.findById(fileAssetId);
}
export async function getPageWithFileAsset(pageId) {
    return Page.findById(pageId)
        .populate("originalFileAssetId")
        .populate("workingFileAssetId")
        .populate("thumbnailFileAssetId");
}
//# sourceMappingURL=page.repository.js.map