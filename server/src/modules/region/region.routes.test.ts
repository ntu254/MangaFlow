import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { Chapter } from "../chapter/chapter.service.js";
import type { PageRepository } from "../page/page.repository.js";
import type { Page } from "../page/page.service.js";
import type { RegionRepository } from "./region.repository.js";
import type { CreateRegionInput, Region, UpdateRegionInput } from "./region.service.js";
import type { SeriesRepository } from "../series/series.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439091";
const chapterId = "507f1f77bcf86cd799439092";
const pageId = "507f1f77bcf86cd799439093";
const ownerId = "507f1f77bcf86cd799439094";
const editorId = "507f1f77bcf86cd799439095";
const assistantId = "507f1f77bcf86cd799439096";
const strangerId = "507f1f77bcf86cd799439097";

function createAuthUser(clerkId: string, id: string, systemRole: SystemRole): AuthUser {
  return {
    id,
    clerkId,
    email: `${clerkId}@example.com`,
    fullName: clerkId,
    avatarUrl: null,
    systemRole,
    requestedSystemRole: null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

const owner = createAuthUser("clerk_owner", ownerId, "MANGAKA");
const editor = createAuthUser("clerk_editor", editorId, "EDITOR");
const assistant = createAuthUser("clerk_assistant", assistantId, "ASSISTANT");
const stranger = createAuthUser("clerk_stranger", strangerId, "MANGAKA");

function createVerifier(clerkId: string, systemRole: SystemRole | null = null): AuthVerifier {
  return {
    async verify() {
      return { clerkId, systemRole, status: "ACTIVE" as const };
    },
    async verifyWithProfile() {
      return { clerkId, email: `${clerkId}@example.com`, fullName: clerkId, avatarUrl: null };
    }
  };
}

function createUserRepository(users: AuthUser[]): UserRepository {
  const byClerkId = new Map(users.map((user) => [user.clerkId, user]));

  return {
    async findByClerkId(clerkId) {
      return byClerkId.get(clerkId) ?? null;
    },
    async upsertFromProfile(profile) {
      const existing = byClerkId.get(profile.clerkId);
      if (existing) return existing;
      const created = createAuthUser(profile.clerkId, `user_${profile.clerkId}`, "MANGAKA");
      byClerkId.set(profile.clerkId, created);
      return created;
    },
    async updateOnboarding() {
      throw new Error("not needed in region route tests");
    }
  };
}

function createSeriesRepository(roleByUserId: Record<string, string | null>): SeriesRepository {
  return {
    async createSeries() {
      throw new Error("not needed");
    },
    async findSeriesById() {
      return null;
    },
    async findSeriesBySlug() {
      return null;
    },
    async listSeriesForUser() {
      return [];
    },
    async updateSeries() {
      return null;
    },
    async deleteSeries() {
      return false;
    },
    async getSeriesMemberRole(inputSeriesId, inputUserId) {
      if (inputSeriesId !== seriesId) return null;
      return roleByUserId[inputUserId] ?? null;
    }
  };
}

function createChapterRepository(): ChapterRepository {
  const chapter: Chapter = {
    id: chapterId,
    seriesId,
    title: "Chapter 9",
    chapterNumber: 9,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now
  };

  return {
    async createChapter() {
      return chapter;
    },
    async findChaptersBySeries() {
      return [chapter];
    },
    async findById(inputChapterId) {
      return inputChapterId === chapterId ? chapter : null;
    },
    async updateChapter() {
      return chapter;
    },
    async deleteChapter() {
      return false;
    }
  };
}

function createPageRepository(): PageRepository {
  const page: Page = {
    id: pageId,
    chapterId,
    pageNumber: 1,
    originalFileUrl: "storage://page.png",
    width: 1200,
    height: 1600,
    currentVersion: 1,
    status: "UPLOADED",
    createdAt: now,
    updatedAt: now
  };

  return {
    async createPage() {
      return page;
    },
    async findPagesByChapter() {
      return [page];
    },
    async findById(inputPageId) {
      return inputPageId === pageId ? page : null;
    },
    async updatePage() {
      return page;
    },
    async deletePage() {
      return false;
    }
  };
}

function createRegion(overrides: Partial<Region> = {}): Region {
  return {
    id: overrides.id ?? "region_1",
    pageId: overrides.pageId ?? pageId,
    taskId: overrides.taskId,
    type: overrides.type ?? "BUBBLE",
    source: overrides.source ?? "MANUAL",
    shape: overrides.shape ?? "RECTANGLE",
    x: overrides.x ?? 0.1,
    y: overrides.y ?? 0.2,
    width: overrides.width ?? 0.3,
    height: overrides.height ?? 0.4,
    confidence: overrides.confidence,
    createdBy: overrides.createdBy ?? ownerId,
    createdAt: now,
    updatedAt: now
  };
}

function createRegionRepository(seed: Region[] = []) {
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
    async findByPage(inputPageId) {
      return [...regions.values()].filter((region) => region.pageId === inputPageId);
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
      regions.set(regionId, updated);
      return updated;
    },
    async deleteRegion(regionId) {
      return regions.delete(regionId);
    }
  };

  return { repository, regions };
}

function createRegionApp(clerkId: string, roleByUserId: Record<string, string | null>, seed: Region[] = []) {
  const { repository, regions } = createRegionRepository(seed);
  const user = [owner, editor, assistant, stranger].find(u => u.clerkId === clerkId);
  const app = createApp({
    authVerifier: createVerifier(clerkId, user?.systemRole ?? null),
    userRepository: createUserRepository([owner, editor, assistant, stranger]),
    seriesRepository: createSeriesRepository(roleByUserId),
    chapterRepository: createChapterRepository(),
    pageRepository: createPageRepository(),
    regionRepository: repository
  });
  return { app, regions };
}

describe("region routes", () => {
  it("lets owner Mangaka create, list, update, fetch, and delete page regions", async () => {
    const { app, regions } = createRegionApp(owner.clerkId, { [ownerId]: "OWNER_MANGAKA" });

    const createResponse = await request(app)
      .post(`/api/pages/${pageId}/regions`)
      .set("Authorization", "Bearer valid")
      .send({
        type: "BUBBLE",
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.4
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      pageId,
      type: "BUBBLE",
      source: "MANUAL",
      createdBy: ownerId
    });

    const regionId = createResponse.body.data.id;
    const listResponse = await request(app)
      .get(`/api/pages/${pageId}/regions`)
      .set("Authorization", "Bearer valid");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const detailResponse = await request(app)
      .get(`/api/regions/${regionId}`)
      .set("Authorization", "Bearer valid");
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.id).toBe(regionId);

    const updateResponse = await request(app)
      .patch(`/api/regions/${regionId}`)
      .set("Authorization", "Bearer valid")
      .send({ type: "CLEANUP", confidence: 0.75 });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toMatchObject({ type: "CLEANUP", confidence: 0.75 });

    const deleteResponse = await request(app)
      .delete(`/api/regions/${regionId}`)
      .set("Authorization", "Bearer valid");
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.deleted).toBe(true);
    expect(regions.has(regionId)).toBe(false);
  });

  it("allows editors to write regions and rejects invalid normalized boxes", async () => {
    const { app } = createRegionApp(editor.clerkId, { [editorId]: "EDITOR" });

    const validResponse = await request(app)
      .post(`/api/pages/${pageId}/regions`)
      .set("Authorization", "Bearer valid")
      .send({ type: "INKING", x: 0, y: 0, width: 1, height: 1 });
    expect(validResponse.status).toBe(201);

    const invalidResponse = await request(app)
      .post(`/api/pages/${pageId}/regions`)
      .set("Authorization", "Bearer valid")
      .send({ type: "INKING", x: 0.9, y: 0, width: 0.2, height: 1 });
    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.code).toBe("INVALID_COORDINATES");
  });

  it("allows assistants to read but not mutate regions", async () => {
    const seed = [createRegion({ id: "region_assistant_read" })];
    const { app } = createRegionApp(assistant.clerkId, { [assistantId]: "ASSISTANT" }, seed);

    const listResponse = await request(app)
      .get(`/api/pages/${pageId}/regions`)
      .set("Authorization", "Bearer valid");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const detailResponse = await request(app)
      .get("/api/regions/region_assistant_read")
      .set("Authorization", "Bearer valid");
    expect(detailResponse.status).toBe(200);

    const createResponse = await request(app)
      .post(`/api/pages/${pageId}/regions`)
      .set("Authorization", "Bearer valid")
      .send({ type: "BUBBLE", x: 0, y: 0, width: 0.5, height: 0.5 });
    expect(createResponse.status).toBe(403);

    const updateResponse = await request(app)
      .patch("/api/regions/region_assistant_read")
      .set("Authorization", "Bearer valid")
      .send({ type: "CLEANUP" });
    expect(updateResponse.status).toBe(403);
  });

  it("rejects non-members from reading page regions", async () => {
    const { app } = createRegionApp(stranger.clerkId, { [strangerId]: null }, [createRegion()]);

    const response = await request(app)
      .get(`/api/pages/${pageId}/regions`)
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FORBIDDEN");
  });
});

