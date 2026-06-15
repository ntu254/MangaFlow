import { Page, Region } from "../chapter.model.js";
export async function createRegionRepository(pageId, regionIndex, bbox) {
    const page = await Page.findById(pageId);
    if (!page) {
        throw new Error("Page not found");
    }
    const existing = await Region.findOne({ pageId, regionIndex });
    if (existing) {
        throw new Error(`Region ${regionIndex} already exists on this page`);
    }
    const region = await Region.create({ pageId, regionIndex, bbox, status: "ACTIVE" });
    await Page.findByIdAndUpdate(pageId, { $push: { regionIds: region._id } });
    return region;
}
export async function getRegionsByPage(pageId) {
    return Region.find({ pageId }).sort({ regionIndex: 1 }).lean();
}
export async function getRegionById(regionId) {
    return Region.findById(regionId);
}
export async function updateRegionStatus(regionId, status) {
    return Region.findByIdAndUpdate(regionId, { status }, { new: true });
}
export async function deleteRegionRepository(regionId) {
    const region = await Region.findByIdAndDelete(regionId);
    if (region) {
        await Page.findByIdAndUpdate(region.pageId, { $pull: { regionIds: region._id } });
    }
    return region;
}
//# sourceMappingURL=region.repository.js.map