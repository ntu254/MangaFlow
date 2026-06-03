import request from "supertest";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { Series, SeriesRepository } from "../series/series.service.js";
import type { Chapter } from "../chapter/chapter.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { Page } from "../page/page.service.js";
import type { PageRepository } from "../page/page.repository.js";
import type { Region } from "../region/region.service.js";
import type { RegionRepository } from "../region/region.repository.js";
import { storageService } from "../../infrastructure/storage/storage.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "series_ai_1";
const ownerId = "mangaka_owner_1";
const assistantId = "assistant_1";
const adminId = "admin_1";
const strangerId = "stranger_1";
const chapterId = "chapter_1";
const pageId = "page_1";

function createAuthUser(id: string, systemRole: SystemRole): AuthUser {
  return {
    id,
    email: `${id}@example.com`,
    fullName: id,
    avatarUrl: null,
    systemRole,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

const owner = createAuthUser(ownerId, "MANGAKA");
const assistant = createAuthUser(assistantId, "ASSISTANT");
const admin = createAuthUser(adminId, "ADMIN");
const stranger = createAuthUser(strangerId, "MANGAKA");
const users = [owner, assistant, admin, stranger];

function createVerifier(id: string, systemRole: SystemRole | null = null): AuthVerifier {
  return {
    async verify() {
      return { sub: id, systemRole, status: "ACTIVE" as const };
    },
    async verifyWithProfile() {
      return { sub: id, email: `${id}@example.com`, fullName: id, avatarUrl: null };
    }
  };
}

function createUserRepository(): UserRepository {
  const byId = new Map(users.map((user) => [user.id, user]));
  return {
    async findById(userId) {
      return byId.get(userId) ?? null;
    }
  };
}

function createSeriesRepository(roleByUserId: Record<string, string | null>): SeriesRepository {
  const series: Series = {
    id: seriesId,
    title: "AI Series",
    slug: "ai-series",
    description: "AI tests",
    genre: [],
    coverUrl: null,
    ownerId,
    status: "ONGOING",
    publicationType: "WEEKLY",
    createdAt: now,
    updatedAt: now
  };
  return {
    async createSeries() { return series; },
    async findSeriesById() { return series; },
    async findSeriesBySlug() { return series; },
    async listSeriesForUser() { return [series]; },
    async updateSeries() { return series; },
    async deleteSeries() { return false; },
    async getSeriesMemberRole(inputSeriesId, userId) {
      if (inputSeriesId !== seriesId) return null;
      return roleByUserId[userId] ?? null;
    }
  };
}

function createChapterRepository(): ChapterRepository {
  const chapter: Chapter = {
    id: chapterId,
    seriesId,
    chapterNumber: 1,
    title: "First chapter",
    status: "DRAFT",
    createdAt: now,
    updatedAt: now
  };
  return {
    async createChapter() { return chapter; },
    async findById(id) { return id === chapterId ? chapter : null; },
    async findChaptersBySeries() { return [chapter]; },
    async updateChapter() { return chapter; },
    async deleteChapter() { return false; }
  };
}

function createPageRepository(): PageRepository {
  const page: Page = {
    id: pageId,
    chapterId,
    pageNumber: 1,
    originalFileUrl: "http://storage/original.jpg",
    previewUrl: "http://storage/preview.jpg",
    thumbnailUrl: "http://storage/thumb.jpg",
    processedFileUrl: undefined,
    width: 1000,
    height: 2000,
    currentVersion: 1,
    status: "UPLOADED",
    createdAt: now,
    updatedAt: now
  };
  const store = new Map<string, Page>([[page.id, page]]);
  return {
    async createPage() { return page; },
    async findPagesByChapter(id) {
      return id === chapterId ? [...store.values()] : [];
    },
    async findById(id) {
      return store.get(id) ?? null;
    },
    async updatePage(id, data) {
      const current = store.get(id);
      if (!current) return null;
      const updated = { ...current, ...data, updatedAt: now } as Page;
      store.set(id, updated);
      return updated;
    },
    async deletePage() { return true; }
  };
}

function createRegionRepository() {
  const store: Region[] = [];
  const deletedCounts: Record<string, number> = {};

  return {
    store,
    deletedCounts,
    async createRegion(data: any): Promise<Region> {
      const region: Region = {
        id: `reg_${store.length + 1}`,
        pageId: data.pageId,
        taskId: data.taskId,
        type: data.type,
        source: data.source,
        shape: data.shape,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        confidence: data.confidence,
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now
      };
      store.push(region);
      return region;
    },
    async findByPage(pageId: string) {
      return store.filter(r => r.pageId === pageId);
    },
    async findById(id: string) {
      return store.find(r => r.id === id) ?? null;
    },
    async updateRegion() { return null; },
    async deleteRegion() { return true; },
    async deleteByPageAndSource(pageId: string, source: string) {
      const initialLength = store.length;
      const filtered = store.filter(r => !(r.pageId === pageId && r.source === source));
      const deleted = initialLength - filtered.length;
      store.length = 0;
      store.push(...filtered);
      deletedCounts[`${pageId}_${source}`] = (deletedCounts[`${pageId}_${source}`] ?? 0) + deleted;
      return deleted;
    }
  };
}

function createAiApp(userId: string, roleByUserId: Record<string, string | null>, regionRepo = createRegionRepository()) {
  const user = users.find(u => u.id === userId);
  return createApp({
    authVerifier: createVerifier(userId, user?.systemRole ?? null),
    userRepository: createUserRepository(),
    seriesRepository: createSeriesRepository(roleByUserId),
    chapterRepository: createChapterRepository(),
    pageRepository: createPageRepository(),
    regionRepository: regionRepo,
    aiServiceUrl: "http://mock-ai-service:8000"
  });
}

describe("AI Integration Routes", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(storageService, "getFile").mockResolvedValue(Buffer.from("mock image"));
    vi.spyOn(storageService, "uploadFile").mockResolvedValue("http://storage/processed.png");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("GET /api/ai/health proxying FastAPI health check successfully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" })
    } as Response);

    const app = createAiApp(owner.id, { [ownerId]: "OWNER_MANGAKA" });
    const response = await request(app)
      .get("/api/ai/health")
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("ok");
  });

  it("POST /api/pages/:pageId/ai/bubble-detect stores normalized regions", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bubble_count: 2,
        bubbles: [
          { id: 1, bbox: { x: 100, y: 200, width: 200, height: 100 }, confidence: 0.95 },
          { id: 2, bbox: { x: 500, y: 600, width: 100, height: 150 }, confidence: 0.82 }
        ]
      })
    } as Response);

    const regionRepo = createRegionRepository();
    // Seed an old AI region to verify it gets cleaned up
    await regionRepo.createRegion({ pageId, type: "BUBBLE", source: "AI", x: 0.1, y: 0.1, width: 0.1, height: 0.1, createdBy: ownerId });

    const app = createAiApp(owner.id, { [ownerId]: "OWNER_MANGAKA" }, regionRepo);
    const response = await request(app)
      .post(`/api/pages/${pageId}/ai/bubble-detect`)
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveLength(2);

    // Verify coordinates are normalized relative to page dimensions width=1000, height=2000
    // x = 100/1000 = 0.1, y = 200/2000 = 0.1, w = 200/1000 = 0.2, h = 100/2000 = 0.05
    expect(response.body.data[0]).toMatchObject({
      x: 0.1,
      y: 0.1,
      width: 0.2,
      height: 0.05,
      source: "AI",
      type: "BUBBLE"
    });

    // Verify deletion occurred
    expect(regionRepo.deletedCounts[`${pageId}_AI`]).toBe(1);
    expect(regionRepo.store.filter(r => r.source === "AI")).toHaveLength(2);
  });

  it("POST /api/pages/:pageId/ai/bubble-process updates page and uploads whitened image", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        image_mime_type: "image/png",
        image_base64: Buffer.from("processed").toString("base64"),
        bubble_count: 1,
        bubbles: [
          { id: 1, bbox: { x: 100, y: 200, width: 200, height: 100 }, confidence: 0.95 }
        ]
      })
    } as Response);

    const app = createAiApp(owner.id, { [ownerId]: "OWNER_MANGAKA" });
    const response = await request(app)
      .post(`/api/pages/${pageId}/ai/bubble-process`)
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(200);
    expect(response.body.data.page.processedFileUrl).toBe("http://storage/processed.png");
    expect(response.body.data.page.status).toBe("AI_PROCESSED");
    expect(response.body.data.regions).toHaveLength(1);
    expect(storageService.uploadFile).toHaveBeenCalled();
  });

  it("POST /api/chapters/:chapterId/ai/batch-bubble-process updates all pages in chapter", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        image_mime_type: "image/png",
        image_base64: Buffer.from("processed").toString("base64"),
        bubble_count: 1,
        bubbles: [
          { id: 1, bbox: { x: 50, y: 50, width: 50, height: 50 }, confidence: 0.9 }
        ]
      })
    } as Response);

    const app = createAiApp(owner.id, { [ownerId]: "OWNER_MANGAKA" });
    const response = await request(app)
      .post(`/api/chapters/${chapterId}/ai/batch-bubble-process`)
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(200);
    expect(response.body.data.processedCount).toBe(1);
    expect(response.body.data.results[0]).toMatchObject({
      pageId,
      status: "success"
    });
  });

  it("denies access to unauthorized system and series roles", async () => {
    const app = createAiApp(assistant.id, { [assistantId]: "ASSISTANT" });
    const response = await request(app)
      .post(`/api/pages/${pageId}/ai/bubble-detect`)
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(403);
  });
});

