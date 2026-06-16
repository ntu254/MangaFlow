import { Page, Region, type RegionStatus, type RegionType } from "../chapter.model.js"

export interface CreateRegionInput {
  pageId: string
  regionIndex: number
  type: RegionType
  bbox: { x: number; y: number; width: number; height: number }
  source?: "MANUAL" | "AI"
  status?: RegionStatus
  aiResultId?: string
  confidence?: number
}

export async function createRegionRepository(input: CreateRegionInput): Promise<any> {
  const page = await Page.findById(input.pageId)
  if (!page) {
    throw new Error("Page not found")
  }

  const existing = await Region.findOne({ pageId: input.pageId, regionIndex: input.regionIndex })
  if (existing) {
    throw new Error(`Region ${input.regionIndex} already exists on this page`)
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
  })
  await Page.findByIdAndUpdate(input.pageId, { $push: { regionIds: region._id } })
  return region
}

export async function nextRegionIndex(pageId: string): Promise<number> {
  const last = await Region.find({ pageId }).sort("-regionIndex").limit(1)
  return last.length > 0 ? last[0].regionIndex + 1 : 1
}

export async function getRegionsByPage(pageId: string): Promise<any[]> {
  return Region.find({ pageId }).sort({ regionIndex: 1 }).lean()
}

export async function getRegionById(regionId: string): Promise<any | null> {
  return Region.findById(regionId)
}

export async function updateRegionStatusRepository(regionId: string, status: RegionStatus): Promise<any | null> {
  return Region.findByIdAndUpdate(regionId, { status }, { new: true })
}

export interface UpdateRegionInput {
  type?: RegionType
  bbox?: { x: number; y: number; width: number; height: number }
  status?: RegionStatus
}

export async function updateRegionRepository(regionId: string, patch: UpdateRegionInput): Promise<any | null> {
  return Region.findByIdAndUpdate(regionId, patch, { new: true })
}

export async function deleteRegionRepository(regionId: string): Promise<any | null> {
  const region = await Region.findByIdAndDelete(regionId)
  if (region) {
    await Page.findByIdAndUpdate(region.pageId, { $pull: { regionIds: region._id } })
  }
  return region
}
