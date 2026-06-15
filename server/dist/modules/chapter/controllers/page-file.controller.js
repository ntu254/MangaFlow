import { confirmPageUploadService, getPageWithFileAssetService, getPresignedDownloadUrlService, getPresignedUploadUrlService, } from "../chapter.service.js";
export async function getPresignedUploadUrl(req, res, _next) {
    const result = await getPresignedUploadUrlService({
        originalName: req.body.originalName,
        contentType: req.body.contentType,
        expiresIn: req.body.expiresIn,
    });
    res.json({ success: true, message: "Presigned upload URL generated", data: result });
}
export async function confirmPageUpload(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const result = await confirmPageUploadService({
        pageId: String(req.params.pageId),
        fileAssetId: req.body.fileAssetId,
        r2Key: req.body.r2Key,
        originalName: req.body.originalName,
        mimeType: req.body.mimeType,
        size: req.body.size,
        userId: req.user.userId,
        actor,
    });
    res.json({ success: true, message: "Page upload confirmed", data: result });
}
export async function getPresignedDownloadUrl(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const result = await getPresignedDownloadUrlService(String(req.params.fileAssetId), actor, req.query.expiresIn ? Number(req.query.expiresIn) : undefined);
    res.json({ success: true, message: "Presigned download URL generated", data: result });
}
export async function getPageWithFileAsset(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const page = await getPageWithFileAssetService(String(req.params.pageId), actor);
    res.json({ success: true, message: "Page with file asset retrieved", data: page });
}
//# sourceMappingURL=page-file.controller.js.map