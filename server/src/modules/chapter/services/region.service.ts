import { AppError } from "../../../shared/errors/AppError.js"
import { createRegionRepository, deleteRegionRepository, getRegionById, getRegionsByPage, updateRegionStatus } from "../chapter.repository.js"
import { assertCanReadPage, assertCanReadRegion, assertCanWritePage, assertCanWriteRegion, type AccessActor } from "../../../shared/policies/accessPolicy.service.js"

export interface CreateRegionInput {
  pageId: string
  regionIndex: number
  bbox: { x: number; y: number; width: number; height: number }
  actor: AccessActor
}

export async function createRegionService(input: CreateRegionInput) {
  if (!input.pageId?.trim()) throw new AppError("Page id is required", 400)
  await assertCanWritePage(input.actor, input.pageId.trim())

  if (typeof input.regionIndex !== "number" || input.regionIndex < 0) throw new AppError("Valid region index is required", 400)
  if (!input.bbox || typeof input.bbox.x !== "number" || typeof input.bbox.y !== "number" || typeof input.bbox.width !== "number" || typeof input.bbox.height !== "number" || input.bbox.width <= 0 || input.bbox.height <= 0) {
    throw new AppError("Valid bbox with positive width/height is required", 400)
  }
  try {
    return await createRegionRepository(input.pageId.trim(), input.regionIndex, input.bbox)
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

export async function updateRegionStatusService(regionId: string, status: "ACTIVE" | "ARCHIVED", actor: AccessActor) {
  const trimmed = regionId.trim()
  if (!trimmed) throw new AppError("Region id is required", 400)
  await assertCanWriteRegion(actor, trimmed)

  if (!["ACTIVE", "ARCHIVED"].includes(status)) throw new AppError("Invalid region status", 400)
  const region = await updateRegionStatus(trimmed, status)
  if (!region) throw new AppError("Region not found", 404)
  return region
}

export async function deleteRegionService(regionId: string, actor: AccessActor) {
  const trimmed = regionId.trim()
  if (!trimmed) throw new AppError("Region id is required", 400)
  await assertCanWriteRegion(actor, trimmed)

  const region = await deleteRegionRepository(trimmed)
  if (!region) throw new AppError("Region not found", 404)
  return region
}