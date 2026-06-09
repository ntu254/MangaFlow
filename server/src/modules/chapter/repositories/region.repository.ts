import { Page, Region } from "../chapter.model.js"

export async function createRegionRepository(
  pageId: string,
  regionIndex: number,
  bbox: { x: number; y: number; width: number; height: number },
): Promise<any> {
  const page = await Page.findById(pageId)
  if (!page) {
    throw new Error("Page not found")
  }

  const existing = await Region.findOne({ pageId, regionIndex })
  if (existing) {
    throw new Error(`Region ${regionIndex} already exists on this page`)
  }

  const region = await Region.create({ pageId, regionIndex, bbox, status: "ACTIVE" })
  await Page.findByIdAndUpdate(pageId, { $push: { regionIds: region._id } })
  return region
}

export async function getRegionsByPage(pageId: string): Promise<any[]> {
  return Region.find({ pageId }).sort({ regionIndex: 1 }).lean()
}

export async function getRegionById(regionId: string): Promise<any | null> {
  return Region.findById(regionId)
}

export async function updateRegionStatus(regionId: string, status: "ACTIVE" | "ARCHIVED"): Promise<any | null> {
  return Region.findByIdAndUpdate(regionId, { status }, { new: true })
}

export async function deleteRegionRepository(regionId: string): Promise<any | null> {
  const region = await Region.findByIdAndDelete(regionId)
  if (region) {
    await Page.findByIdAndUpdate(region.pageId, { $pull: { regionIds: region._id } })
  }
  return region
}
