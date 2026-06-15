import { createRegionService, deleteRegionService, getRegionService, listRegionsService, updateRegionStatusService, } from "../chapter.service.js";
export async function createRegion(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const region = await createRegionService({
        pageId: String(req.params.pageId),
        regionIndex: req.body.regionIndex,
        bbox: req.body.bbox,
        actor,
    });
    res.status(201).json({ success: true, message: "Region created successfully", data: region });
}
export async function listRegions(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const regions = await listRegionsService(String(req.params.pageId), actor);
    res.json({ success: true, message: "Regions retrieved successfully", data: regions });
}
export async function getRegion(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const region = await getRegionService(String(req.params.regionId), actor);
    res.json({ success: true, message: "Region retrieved successfully", data: region });
}
export async function updateRegionStatus(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const region = await updateRegionStatusService(String(req.params.regionId), req.body.status, actor);
    res.json({ success: true, message: "Region status updated successfully", data: region });
}
export async function deleteRegion(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const region = await deleteRegionService(String(req.params.regionId), actor);
    res.json({ success: true, message: "Region deleted successfully", data: region });
}
//# sourceMappingURL=region.controller.js.map