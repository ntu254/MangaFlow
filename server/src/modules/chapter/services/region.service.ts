import { AppError } from "../../../shared/errors/AppError.js"
import {
  createRegionRepository,
  deleteRegionRepository,
  getRegionById,
  getRegionsByPage,
  nextRegionIndex,
  updateRegionRepository,
} from "../chapter.repository.js"
import { REGION_TYPES, type RegionType } from "../chapter.model.js"
import { Task } from "../../task/task.model.js"
import { assertCanReadPage, assertCanReadRegion, assertCanWritePage, assertCanWriteRegion, type AccessActor } from "../../../shared/policies/accessPolicy.service.js"

function assertBbox(bbox: { x: number; y: number; width: number; height: number } | undefined) {
  if (
    !bbox ||
    typeof bbox.x !== "number" ||
    typeof bbox.y !== "number" ||
    typeof bbox.width !== "number" ||
    typeof bbox.height !== "number" ||
    bbox.x < 0 ||
    bbox.y < 0 ||
    bbox.width <= 0 ||
    bbox.height <= 0 ||
    bbox.x + bbox.width > 1 ||
    bbox.y + bbox.height > 1
  ) {
    throw new AppError("Region bounds must be normalized within the working image", 400)
  }
}

function assertType(type: string): asserts type is RegionType {
  if (!REGION_TYPES.includes(type as RegionType)) throw new AppError("Invalid region type", 400)
}

export interface CreateRegionInput {
  pageId: string
  type: string
  bbox: { x: number; y: number; width: number; height: number }
  actor: AccessActor
}

export async function createRegionService(input: CreateRegionInput) {
  if (!input.pageId?.trim()) throw new AppError("Page id is required", 400)
  await assertCanWritePage(input.actor, input.pageId.trim())

  const type = input.type ?? "PANEL"
  assertType(type)
  assertBbox(input.bbox)

  try {
    const regionIndex = await nextRegionIndex(input.pageId.trim())
    return await createRegionRepository({
      pageId: input.pageId.trim(),
      regionIndex,
      type,
      bbox: input.bbox,
      source: "MANUAL",
      status: "ACTIVE",
    })
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Page not found")) throw new AppError("Page not found", 404)
    if (message.includes("already exists")) throw new AppError(message, 409)
    throw new AppError("Unable to create region", 400)
  }
}

export async function listRegionsService(pageId: string, actor: AccessActor) {
  const trimmed = pageId.trim()
  if (!trimmed) throw new AppError("Page id is required", 400)
  await assertCanReadPage(actor, trimmed)
  return getRegionsByPage(trimmed)
}

export async function getRegionService(regionId: string, actor: AccessActor) {
  const trimmed = regionId.trim()
  if (!trimmed) throw new AppError("Region id is required", 400)
  await assertCanReadRegion(actor, trimmed)
  const region = await getRegionById(trimmed)
  if (!region) throw new AppError("Region not found", 404)
  return region
}

export interface UpdateRegionInput {
  type?: string
  bbox?: { x: number; y: number; width: number; height: number }
  actor: AccessActor
}

export async function updateRegionService(regionId: string, input: UpdateRegionInput) {
  const trimmed = regionId.trim()
  if (!trimmed) throw new AppError("Region id is required", 400)
  await assertCanWriteRegion(input.actor, trimmed)

  const region = await getRegionById(trimmed)
  if (!region) throw new AppError("Region not found", 404)

  const activeTask = await Task.findOne({
    regionId: trimmed,
    status: { $in: ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"] },
  })
  if (activeTask) throw new AppError("This region has active tasks. Cancel or finish those tasks first.", 409)

  const patch: { type?: RegionType; bbox?: typeof input.bbox } = {}
  if (input.type !== undefined) {
    assertType(input.type)
    patch.type = input.type
  }
  if (input.bbox !== undefined) {
    assertBbox(input.bbox)
    patch.bbox = input.bbox
  }
  if (patch.type === undefined && patch.bbox === undefined) {
    throw new AppError("No region changes provided", 400)
  }

  const updated = await updateRegionRepository(trimmed, patch)
  if (!updated) throw new AppError("Region not found", 404)
  return updated
}

export async function deleteRegionService(regionId: string, actor: AccessActor) {
  const trimmed = regionId.trim()
  if (!trimmed) throw new AppError("Region id is required", 400)
  await assertCanWriteRegion(actor, trimmed)

  const region = await getRegionById(trimmed)
  if (!region) throw new AppError("Region not found", 404)

  const activeTask = await Task.findOne({
    regionId: trimmed,
    status: { $in: ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"] },
  })
  if (activeTask) throw new AppError("This region has active tasks. Cancel or finish those tasks first.", 409)

  const deleted = await deleteRegionRepository(trimmed)
  if (!deleted) throw new AppError("Region not found", 404)
  return deleted
}
