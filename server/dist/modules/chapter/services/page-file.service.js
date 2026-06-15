import { AppError } from "../../../shared/errors/AppError.js";
import { FileAsset } from "../chapter.model.js";
import { confirmPageUploadRepository, getFileAssetById, getPageWithFileAsset } from "../chapter.repository.js";
import { createPresignedDownloadUrl, createPresignedUploadUrl, validateFileSize, validateFileType } from "../file.service.js";
import { assertCanReadFileAsset, assertCanReadPage, assertCanWritePage } from "../../../shared/policies/accessPolicy.service.js";
export async function getPresignedUploadUrlService(input) {
    if (!input.originalName?.trim())
        throw new AppError("Original file name is required", 400);
    if (!input.contentType?.trim())
        throw new AppError("Content type is required", 400);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validateFileType(input.contentType, allowedTypes)) {
        throw new AppError("File type not allowed. Use JPEG, PNG, WebP, or PDF", 400);
    }
    return createPresignedUploadUrl(input.originalName, input.contentType, input.expiresIn);
}
export async function confirmPageUploadService(input) {
    const trimmedPageId = input.pageId.trim();
    if (!trimmedPageId)
        throw new AppError("Page id is required", 400);
    await assertCanWritePage(input.actor, trimmedPageId);
    if (!input.fileAssetId?.trim() || !input.r2Key?.trim() || !input.originalName?.trim() || !input.mimeType?.trim()) {
        throw new AppError("All file asset fields are required", 400);
    }
    if (!validateFileSize(input.size, 100))
        throw new AppError("File size exceeds 100MB limit", 400);
    try {
        const result = await confirmPageUploadRepository({
            pageId: trimmedPageId,
            fileAssetId: input.fileAssetId,
            r2Key: input.r2Key,
            originalName: input.originalName,
            mimeType: input.mimeType,
            size: input.size,
        });
        const fileAsset = await FileAsset.findByIdAndUpdate(input.fileAssetId, { uploadedBy: input.userId }, { new: true });
        return { page: result.page, fileAsset: fileAsset || result.fileAsset };
    }
    catch (error) {
        const message = String(error.message ?? "");
        if (message.includes("Page not found"))
            throw new AppError("Page not found", 404);
        throw new AppError("Unable to confirm page upload", 400);
    }
}
export async function getPresignedDownloadUrlService(fileAssetId, actor, expiresIn) {
    const trimmed = fileAssetId.trim();
    if (!trimmed)
        throw new AppError("File asset id is required", 400);
    const fileAsset = await getFileAssetById(trimmed);
    if (!fileAsset)
        throw new AppError("File asset not found", 404);
    await assertCanReadFileAsset(actor, trimmed);
    return createPresignedDownloadUrl(fileAsset.r2Key, expiresIn);
}
export async function getPageWithFileAssetService(pageId, actor) {
    const trimmed = pageId.trim();
    if (!trimmed)
        throw new AppError("Page id is required", 400);
    await assertCanReadPage(actor, trimmed);
    const page = await getPageWithFileAsset(trimmed);
    if (!page)
        throw new AppError("Page not found", 404);
    return page;
}
//# sourceMappingURL=page-file.service.js.map