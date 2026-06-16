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
function isDuplicateManuscriptVersionError(error) {
    return Boolean(error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000 &&
        "keyPattern" in error &&
        typeof error.keyPattern === "object" &&
        error.keyPattern &&
        "seriesId" in error.keyPattern &&
        "version" in error.keyPattern);
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function createManuscriptUploadDraft(input) {
    const fileAsset = await FileAsset.create({
        seriesId: input.seriesId,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        r2Key: input.r2Key,
        r2Bucket: config.r2Bucket,
        uploadedBy: input.uploadedBy,
        assetType: "MANUSCRIPT",
        slot: input.slot,
    });
    let manuscript;
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const latest = await getLatestManuscriptBySeries(input.seriesId);
        const version = latest ? latest.version + 1 : 1;
        try {
            manuscript = await Manuscript.create({
                seriesId: input.seriesId,
                uploadedBy: input.uploadedBy,
                version,
                status: "DRAFT",
                fileAssetId: fileAsset.id,
            });
            break;
        }
        catch (error) {
            if (!isDuplicateManuscriptVersionError(error) || attempt === 7) {
                throw error;
            }
            await delay(20 * (attempt + 1));
        }
    }
    if (!manuscript) {
        throw new Error("Unable to create manuscript draft");
    }
    return { manuscript, fileAsset };
}
export async function createSeriesFileAssetDraft(input) {
    const fileAsset = await FileAsset.create({
        seriesId: input.seriesId,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        r2Key: input.r2Key,
        r2Bucket: config.r2Bucket,
        uploadedBy: input.uploadedBy,
        assetType: input.assetType,
        slot: input.slot,
    });
    return { fileAsset, manuscript: null };
}
export async function updateManuscriptStatus(manuscriptId, status, reviewNote) {
    return Manuscript.findByIdAndUpdate(manuscriptId, { status, reviewNote }, { new: true });
}
//# sourceMappingURL=manuscript.repository.js.map