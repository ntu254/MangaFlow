import { AppError } from "../../../shared/errors/AppError.js";
import { confirmPageUploadRepository, getFileAssetById, getPageWithFileAsset, markPageProcessingFailed } from "../chapter.repository.js";
import { createPresignedDownloadUrl, createPresignedUploadUrl, validateFileSize, validateFileType } from "../file.service.js";
import { assertCanReadFileAsset, assertCanReadPage, assertCanWritePage } from "../../../shared/policies/accessPolicy.service.js";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export async function getPresignedUploadUrlService(input) {
    if (!input.originalName?.trim())
        throw new AppError("Original file name is required", 400);
    if (!input.contentType?.trim())
        throw new AppError("Content type is required", 400);
    if (!validateFileType(input.contentType, ALLOWED_TYPES)) {
        throw new AppError("File type not allowed. Use JPEG, PNG, WebP, or PDF", 400);
    }
    return createPresignedUploadUrl(input.originalName, input.contentType, input.expiresIn);
}
function assertAsset(asset, label) {
    if (!asset)
        throw new AppError(`${label} file asset is required`, 400);
    if (!asset.fileAssetId?.trim() || !asset.r2Key?.trim() || !asset.originalName?.trim() || !asset.mimeType?.trim()) {
        throw new AppError(`All ${label} file asset fields are required`, 400);
    }
    if (!validateFileType(asset.mimeType, ALLOWED_TYPES)) {
        throw new AppError(`${label} file type not allowed`, 400);
    }
    if (!validateFileSize(asset.size, 100))
        throw new AppError(`${label} file size exceeds 100MB limit`, 400);
}
export async function confirmPageUploadService(input) {
    const trimmedPageId = input.pageId.trim();
    if (!trimmedPageId)
        throw new AppError("Page id is required", 400);
    await assertCanWritePage(input.actor, trimmedPageId);
    assertAsset(input.original, "Original");
    assertAsset(input.working, "Working");
    assertAsset(input.thumbnail, "Thumbnail");
    try {
        const result = await confirmPageUploadRepository({
            pageId: trimmedPageId,
            uploadedBy: input.userId,
            original: input.original,
            working: input.working,
            thumbnail: input.thumbnail,
        });
        return {
            page: result.page,
            originalAsset: result.originalAsset,
            workingAsset: result.workingAsset,
            thumbnailAsset: result.thumbnailAsset,
        };
    }
    catch (error) {
        const message = String(error.message ?? "");
        if (message.includes("Page not found"))
            throw new AppError("Page not found", 404);
        await markPageProcessingFailed(trimmedPageId).catch(() => undefined);
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