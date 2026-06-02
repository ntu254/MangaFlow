import mongoose from "mongoose";
import { RegionModel, type RegionDocument } from "./region.model.js";
import type { CreateRegionInput, Region, UpdateRegionInput } from "./region.service.js";

function serializeRegion(document: RegionDocument & { _id: unknown }): Region {
  return {
    id: String(document._id),
    pageId: String(document.pageId),
    taskId: document.taskId ? String(document.taskId) : undefined,
    type: document.type,
    source: document.source,
    shape: document.shape,
    x: document.x,
    y: document.y,
    width: document.width,
    height: document.height,
    confidence: document.confidence,
    createdBy: String(document.createdBy),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function createMongoRegionRepository() {
  return {
    async createRegion(data: CreateRegionInput): Promise<Region> {
      const region = await RegionModel.create({
        pageId: data.pageId,
        taskId: data.taskId,
        type: data.type,
        source: data.source ?? "MANUAL",
        shape: data.shape ?? "RECTANGLE",
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        confidence: data.confidence,
        createdBy: data.createdBy
      });
      return serializeRegion(region);
    },

    async findByPage(pageId: string): Promise<Region[]> {
      if (!mongoose.isValidObjectId(pageId)) return [];
      const regions = await RegionModel.find({ pageId }).sort({ createdAt: -1 });
      return regions.map(serializeRegion);
    },

    async findById(regionId: string): Promise<Region | null> {
      if (!mongoose.isValidObjectId(regionId)) return null;
      const region = await RegionModel.findById(regionId);
      return region ? serializeRegion(region) : null;
    },

    async updateRegion(regionId: string, data: UpdateRegionInput): Promise<Region | null> {
      if (!mongoose.isValidObjectId(regionId)) return null;
      const updateData: Record<string, unknown> = {};
      if (data.taskId !== undefined) updateData.taskId = data.taskId;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.source !== undefined) updateData.source = data.source;
      if (data.shape !== undefined) updateData.shape = data.shape;
      if (data.x !== undefined) updateData.x = data.x;
      if (data.y !== undefined) updateData.y = data.y;
      if (data.width !== undefined) updateData.width = data.width;
      if (data.height !== undefined) updateData.height = data.height;
      if (data.confidence !== undefined) updateData.confidence = data.confidence;

      const region = await RegionModel.findByIdAndUpdate(regionId, { $set: updateData }, { new: true });
      return region ? serializeRegion(region) : null;
    },

    async deleteRegion(regionId: string): Promise<boolean> {
      if (!mongoose.isValidObjectId(regionId)) return false;
      const result = await RegionModel.deleteOne({ _id: regionId });
      return result.deletedCount > 0;
    }
  };
}

export type RegionRepository = ReturnType<typeof createMongoRegionRepository>;

