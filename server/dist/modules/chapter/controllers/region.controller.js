import { createRegionService, deleteRegionService, getRegionService, listRegionsService, updateRegionService, } from "../chapter.service.js";
export async function createRegion(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const region = await createRegionService({
        pageId: String(req.params.pageId),
        type: req.body.type,
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
export async function updateRegion(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const region = await updateRegionService(String(req.params.regionId), {
        type: req.body.type,
        bbox: req.body.bbox,
        actor,
    });
    res.json({ success: true, message: "Region updated successfully", data: region });
}
export async function deleteRegion(req, res, _next) {
    const actor = { userId: req.user.userId, role: req.user.role };
    const region = await deleteRegionService(String(req.params.regionId), actor);
    res.json({ success: true, message: "Region deleted successfully", data: region });
}
//# sourceMappingURL=region.controller.js.map