import { FileAsset } from "../../chapter/chapter.model.js";
import { config } from "../../../shared/utils/env.js";
import { Manuscript } from "../series.model.js";
export async function hasManuscript(seriesId) {
    const existing = await Manuscript.exists({ seriesId });
    return Boolean(existing);
}
export async function getLatestManuscriptBySeries(seriesId) {
    return Manuscript.findOne({ seriesId }).sort({ version: -1 });
}
export async function createManuscriptUploadDraft(input) {
    const fileAsset = await FileAsset.create({
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        r2Key: input.r2Key,
        r2Bucket: config.r2Bucket,
        uploadedBy: input.uploadedBy,
    });
    const latest = await getLatestManuscriptBySeries(input.seriesId);
    const version = latest ? latest.version + 1 : 1;
    const manuscript = await Manuscript.create({
        seriesId: input.seriesId,
        uploadedBy: input.uploadedBy,
        version,
        status: "DRAFT",
        fileAssetId: fileAsset.id,
    });
    return { manuscript, fileAsset };
}
export async function updateManuscriptStatus(manuscriptId, status, reviewNote) {
    return Manuscript.findByIdAndUpdate(manuscriptId, { status, reviewNote }, { new: true });
}
//# sourceMappingURL=manuscript.repository.js.map