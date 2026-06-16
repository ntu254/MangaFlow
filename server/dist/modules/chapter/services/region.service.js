import { AppError } from "../../../shared/errors/AppError.js";
import { createRegionRepository, deleteRegionRepository, getRegionById, getRegionsByPage, nextRegionIndex, updateRegionRepository, } from "../chapter.repository.js";
import { REGION_TYPES } from "../chapter.model.js";
import { Task } from "../../task/task.model.js";
import { assertCanReadPage, assertCanReadRegion, assertCanWritePage, assertCanWriteRegion } from "../../../shared/policies/accessPolicy.service.js";
function assertBbox(bbox) {
    if (!bbox ||
        typeof bbox.x !== "number" ||
        typeof bbox.y !== "number" ||
        typeof bbox.width !== "number" ||
        typeof bbox.height !== "number" ||
        bbox.width <= 0 ||
        bbox.height <= 0) {
        throw new AppError("Valid bbox with positive width/height is required", 400);
    }
}
function assertType(type) {
    if (!REGION_TYPES.includes(type))
        throw new AppError("Invalid region type", 400);
}
export async function createRegionService(input) {
    if (!input.pageId?.trim())
        throw new AppError("Page id is required", 400);
    await assertCanWritePage(input.actor, input.pageId.trim());
    const type = input.type ?? "PANEL";
    assertType(type);
    assertBbox(input.bbox);
    try {
        const regionIndex = await nextRegionIndex(input.pageId.trim());
        return await createRegionRepository({
            pageId: input.pageId.trim(),
            regionIndex,
            type,
            bbox: input.bbox,
            source: "MANUAL",
            status: "CREATED",
        });
    }
    catch (error) {
        const message = String(error.message ?? "");
        if (message.includes("Page not found"))
            throw new AppError("Page not found", 404);
        if (message.includes("already exists"))
            throw new AppError(message, 409);
        throw new AppError("Unable to create region", 400);
    }
}
export async function listRegionsService(pageId, actor) {
    const trimmed = pageId.trim();
    if (!trimmed)
        throw new AppError("Page id is required", 400);
    await assertCanReadPage(actor, trimmed);
    return getRegionsByPage(trimmed);
}
export async function getRegionService(regionId, actor) {
    const trimmed = regionId.trim();
    if (!trimmed)
        throw new AppError("Region id is required", 400);
    await assertCanReadRegion(actor, trimmed);
    const region = await getRegionById(trimmed);
    if (!region)
        throw new AppError("Region not found", 404);
    return region;
}
export async function updateRegionService(regionId, input) {
    const trimmed = regionId.trim();
    if (!trimmed)
        throw new AppError("Region id is required", 400);
    await assertCanWriteRegion(input.actor, trimmed);
    const region = await getRegionById(trimmed);
    if (!region)
        throw new AppError("Region not found", 404);
    // Block editing geometry of a region already linked to an active task
    if (region.status === "LINKED_TO_TASK") {
        const activeTask = await Task.findOne({ regionId: trimmed, status: { $nin: ["DONE", "CANCELLED", "APPROVED"] } });
        if (activeTask)
            throw new AppError("Region is linked to an active task and cannot be edited", 409);
    }
    const patch = {};
    if (input.type !== undefined) {
        assertType(input.type);
        patch.type = input.type;
    }
    if (input.bbox !== undefined) {
        assertBbox(input.bbox);
        patch.bbox = input.bbox;
    }
    if (patch.type === undefined && patch.bbox === undefined) {
        throw new AppError("No region changes provided", 400);
    }
    const updated = await updateRegionRepository(trimmed, patch);
    if (!updated)
        throw new AppError("Region not found", 404);
    return updated;
}
export async function deleteRegionService(regionId, actor) {
    const trimmed = regionId.trim();
    if (!trimmed)
        throw new AppError("Region id is required", 400);
    await assertCanWriteRegion(actor, trimmed);
    const region = await getRegionById(trimmed);
    if (!region)
        throw new AppError("Region not found", 404);
    if (region.status === "LINKED_TO_TASK") {
        const activeTask = await Task.findOne({ regionId: trimmed, status: { $nin: ["DONE", "CANCELLED", "APPROVED"] } });
        if (activeTask)
            throw new AppError("Region is linked to an active task and cannot be deleted", 409);
    }
    const deleted = await deleteRegionRepository(trimmed);
    if (!deleted)
        throw new AppError("Region not found", 404);
    return deleted;
}
//# sourceMappingURL=region.service.js.map