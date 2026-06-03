import type { RegionRepository } from "./region.repository.js";
import type { RegionShape, RegionSource, RegionType } from "./region.model.js";

export type Region = {
  id: string;
  pageId: string;
  taskId?: string;
  type: RegionType;
  source: RegionSource;
  shape: RegionShape;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateRegionInput = {
  pageId: string;
  taskId?: string;
  type: RegionType;
  source?: RegionSource;
  shape?: RegionShape;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  createdBy: string;
};

export type UpdateRegionInput = {
  taskId?: string | null;
  type?: RegionType;
  source?: RegionSource;
  shape?: RegionShape;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  confidence?: number | null;
};

export class RegionServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

const regionTypes = new Set<RegionType>([
  "BACKGROUND",
  "INKING",
  "SCREENTONE",
  "CLEANUP",
  "EFFECT",
  "BUBBLE",
  "OTHER"
]);
const regionSources = new Set<RegionSource>(["MANUAL", "AI"]);
const regionShapes = new Set<RegionShape>(["RECTANGLE"]);

function isUnitInterval(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function assertNormalizedBox(input: Pick<CreateRegionInput, "x" | "y" | "width" | "height">) {
  if (!isUnitInterval(input.x) || !isUnitInterval(input.y)) {
    throw new RegionServiceError("INVALID_COORDINATES", "Region coordinates must be normalized from 0 to 1");
  }
  if (!Number.isFinite(input.width) || !Number.isFinite(input.height) || input.width <= 0 || input.height <= 0) {
    throw new RegionServiceError("INVALID_COORDINATES", "Region width and height must be greater than 0");
  }
  if (input.width > 1 || input.height > 1 || input.x + input.width > 1 || input.y + input.height > 1) {
    throw new RegionServiceError("INVALID_COORDINATES", "Region rectangle must stay inside the page bounds");
  }
}

function assertRegionEnums(input: { type?: RegionType; source?: RegionSource; shape?: RegionShape }) {
  if (input.type && !regionTypes.has(input.type)) {
    throw new RegionServiceError("INVALID_REGION_TYPE", "Invalid region type");
  }
  if (input.source && !regionSources.has(input.source)) {
    throw new RegionServiceError("INVALID_REGION_SOURCE", "Invalid region source");
  }
  if (input.shape && !regionShapes.has(input.shape)) {
    throw new RegionServiceError("INVALID_REGION_SHAPE", "Only RECTANGLE regions are supported");
  }
}

function assertConfidence(confidence: number | null | undefined) {
  if (confidence === null || confidence === undefined) return;
  if (!isUnitInterval(confidence)) {
    throw new RegionServiceError("INVALID_CONFIDENCE", "Region confidence must be normalized from 0 to 1");
  }
}

export function createRegionService(repository: RegionRepository) {
  return {
    async createRegion(input: CreateRegionInput) {
      if (!input.pageId) {
        throw new RegionServiceError("INVALID_PAGE", "Page id is required");
      }
      if (!input.createdBy) {
        throw new RegionServiceError("INVALID_USER", "Created by user id is required");
      }
      assertRegionEnums(input);
      assertNormalizedBox(input);
      assertConfidence(input.confidence);

      return repository.createRegion({
        ...input,
        source: input.source ?? "MANUAL",
        shape: input.shape ?? "RECTANGLE"
      });
    },

    async listByPage(pageId: string) {
      return repository.findByPage(pageId);
    },

    async getById(regionId: string) {
      const region = await repository.findById(regionId);
      if (!region) {
        throw new RegionServiceError("NOT_FOUND", "Region not found", 404);
      }
      return region;
    },

    async updateRegion(regionId: string, input: UpdateRegionInput) {
      const current = await this.getById(regionId);
      assertRegionEnums(input);
      assertConfidence(input.confidence);

      const nextBox = {
        x: input.x ?? current.x,
        y: input.y ?? current.y,
        width: input.width ?? current.width,
        height: input.height ?? current.height
      };
      assertNormalizedBox(nextBox);

      const updated = await repository.updateRegion(regionId, input);
      if (!updated) {
        throw new RegionServiceError("NOT_FOUND", "Region not found for update", 404);
      }
      return updated;
    },

    async deleteRegion(regionId: string) {
      await this.getById(regionId);
      return repository.deleteRegion(regionId);
    }
  };
}

export type RegionService = ReturnType<typeof createRegionService>;

