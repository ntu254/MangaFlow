import { Page, Region } from "../chapter.model.js";
export async function createRegionRepository(input) {
    const page = await Page.findById(input.pageId);
    if (!page) {
        throw new Error("Page not found");
    }
    const existing = await Region.findOne({ pageId: input.pageId, regionIndex: input.regionIndex });
    if (existing) {
        throw new Error(`Region ${input.regionIndex} already exists on this page`);
    }
    const region = await Region.create({
        pageId: input.pageId,
        regionIndex: input.regionIndex,
        type: input.type,
        bbox: input.bbox,
        status: input.status ?? "CREATED",
        source: input.source ?? "MANUAL",
        aiResultId: input.aiResultId,
        confidence: input.confidence,
    });
    await Page.findByIdAndUpdate(input.pageId, { $push: { regionIds: region._id } });
    return region;
}
export async function nextRegionIndex(pageId) {
    const last = await Region.find({ pageId }).sort("-regionIndex").limit(1);
    return last.length > 0 ? last[0].regionIndex + 1 : 1;
}
export async function getRegionsByPage(pageId) {
    return Region.find({ pageId }).sort({ regionIndex: 1 }).lean();
}
export async function getRegionById(regionId) {
    return Region.findById(regionId);
}
export async function updateRegionStatusRepository(regionId, status) {
    return Region.findByIdAndUpdate(regionId, { status }, { new: true });
}
export async function updateRegionRepository(regionId, patch) {
    return Region.findByIdAndUpdate(regionId, patch, { new: true });
}
export async function deleteRegionRepository(regionId) {
    const region = await Region.findByIdAndDelete(regionId);
    if (region) {
        await Page.findByIdAndUpdate(region.pageId, { $pull: { regionIds: region._id } });
    }
    return region;
}
//# sourceMappingURL=region.repository.js.map