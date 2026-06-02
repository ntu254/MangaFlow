import { describe, expect, it } from "vitest";
import type { RegionRepository } from "./region.repository.js";
import { createRegionService, type CreateRegionInput, type Region, type UpdateRegionInput } from "./region.service.js";

const now = "2026-06-03T00:00:00.000Z";

function createRegion(overrides: Partial<Region> = {}): Region {
  return {
    id: overrides.id ?? "region_1",
    pageId: overrides.pageId ?? "page_1",
    taskId: overrides.taskId,
    type: overrides.type ?? "BUBBLE",
    source: overrides.source ?? "MANUAL",
    shape: overrides.shape ?? "RECTANGLE",
    x: overrides.x ?? 0.1,
    y: overrides.y ?? 0.2,
    width: overrides.width ?? 0.3,
    height: overrides.height ?? 0.4,
    confidence: overrides.confidence,
    createdBy: overrides.createdBy ?? "user_1",
    createdAt: now,
    updatedAt: now
  };
}

function createRepository(seed: Region[] = []) {
  const regions = new Map(seed.map((region) => [region.id, region]));

  const repository: RegionRepository = {
    async createRegion(data: CreateRegionInput) {
      const region = createRegion({
        id: `region_${regions.size + 1}`,
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
      regions.set(region.id, region);
      return region;
    },
    async findByPage(pageId) {
      return [...regions.values()].filter((region) => region.pageId === pageId);
    },
    async findById(regionId) {
      return regions.get(regionId) ?? null;
    },
    async updateRegion(regionId, data: UpdateRegionInput) {
      const current = regions.get(regionId);
      if (!current) return null;
      const updated = {
        ...current,
        ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
        updatedAt: now
      } as Region;
      if (data.taskId === null) updated.taskId = undefined;
      if (data.confidence === null) updated.confidence = undefined;
      regions.set(regionId, updated);
      return updated;
    },
    async deleteRegion(regionId) {
      return regions.delete(regionId);
    }
  };

  return { repository, regions };
}

describe("region service", () => {
  it("creates manual rectangle regions with normalized coordinates", async () => {
    const { repository } = createRepository();
    const service = createRegionService(repository);

    await expect(
      service.createRegion({
        pageId: "page_1",
        type: "BUBBLE",
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.4,
        createdBy: "user_1"
      })
    ).resolves.toMatchObject({
      pageId: "page_1",
      type: "BUBBLE",
      source: "MANUAL",
      shape: "RECTANGLE"
    });
  });

  it("rejects invalid enums, confidence, and out-of-bounds boxes", async () => {
    const { repository } = createRepository();
    const service = createRegionService(repository);

    const validInput: CreateRegionInput = {
      pageId: "page_1",
      type: "BUBBLE",
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5,
      createdBy: "user_1"
    };

    await expect(service.createRegion({ ...validInput, type: "BAD" as "BUBBLE" })).rejects.toMatchObject({
      code: "INVALID_REGION_TYPE"
    });
    await expect(service.createRegion({ ...validInput, shape: "CIRCLE" as "RECTANGLE" })).rejects.toMatchObject({
      code: "INVALID_REGION_SHAPE"
    });
    await expect(service.createRegion({ ...validInput, confidence: 1.2 })).rejects.toMatchObject({
      code: "INVALID_CONFIDENCE"
    });
    await expect(service.createRegion({ ...validInput, x: 0.8, width: 0.3 })).rejects.toMatchObject({
      code: "INVALID_COORDINATES"
    });
  });

  it("validates merged rectangle bounds during updates and deletes existing regions", async () => {
    const { repository, regions } = createRepository([createRegion({ id: "region_existing", width: 0.4 })]);
    const service = createRegionService(repository);

    await expect(service.updateRegion("region_existing", { x: 0.3, width: 0.5 })).resolves.toMatchObject({
      x: 0.3,
      width: 0.5
    });
    await expect(service.updateRegion("region_existing", { x: 0.9 })).rejects.toMatchObject({
      code: "INVALID_COORDINATES"
    });
    await expect(service.deleteRegion("region_existing")).resolves.toBe(true);
    expect(regions.has("region_existing")).toBe(false);
  });

  it("returns not found errors for missing regions", async () => {
    const { repository } = createRepository();
    const service = createRegionService(repository);

    await expect(service.getById("missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404
    });
  });
});
