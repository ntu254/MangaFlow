import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { Chapter } from "../chapter/chapter.service.js";
import type { PageRepository } from "../page/page.repository.js";
import type { Page } from "../page/page.service.js";
import type { RegionRepository } from "../region/region.repository.js";
import type { CreateRegionInput, Region, UpdateRegionInput } from "../region/region.service.js";
import type { SeriesRepository } from "../series/series.service.js";
import type { AnnotationRepository } from "./annotation.repository.js";
import type { Annotation, CreateAnnotationInput, UpdateAnnotationInput } from "./annotation.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439191";
const chapterId = "507f1f77bcf86cd799439192";
const pageId = "507f1f77bcf86cd799439193";
const otherPageId = "507f1f77bcf86cd799439198";
const ownerId = "507f1f77bcf86cd799439194";
const editorId = "507f1f77bcf86cd799439195";
const assistantId = "507f1f77bcf86cd799439196";
const strangerId = "507f1f77bcf86cd799439197";

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

const owner = createAuthUser("clerk_owner_annotation", ownerId, "MANGAKA");
const editor = createAuthUser("clerk_editor_annotation", editorId, "EDITOR");
const assistant = createAuthUser("clerk_assistant_annotation", assistantId, "ASSISTANT");
const stranger = createAuthUser("clerk_stranger_annotation", strangerId, "MANGAKA");

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
    async upsertFromClerk(profile) {
      const existing = byClerkId.get(profile.clerkId);
      if (existing) return existing;
      const created = createAuthUser(profile.clerkId, `user_${profile.clerkId}`, "MANGAKA");
      byClerkId.set(profile.clerkId, created);
      return created;
    },
    async updateOnboarding() {
      throw new Error("not needed in annotation route tests");
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
    title: "Chapter 11",
    chapterNumber: 11,
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
    originalFileUrl: "storage://annotation-page.png",
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

function createRegionRepository(seed: Region[] = [createRegion()]) {
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
      const updated = { ...current, ...data, updatedAt: now } as Region;
      if (data.taskId === null) updated.taskId = undefined;
      regions.set(regionId, updated);
      return updated;
    },
    async deleteRegion(regionId) {
      return regions.delete(regionId);
    }
  };

  return repository;
}

function createAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: overrides.id ?? "annotation_1",
    pageId: overrides.pageId ?? pageId,
    createdBy: overrides.createdBy ?? ownerId,
    targetType: overrides.targetType ?? "PAGE",
    targetId: overrides.targetId ?? overrides.pageId ?? pageId,
    regionId: overrides.regionId,
    type: overrides.type ?? "RECTANGLE",
    x: overrides.x ?? 0.1,
    y: overrides.y ?? 0.2,
    width: overrides.width ?? 0.3,
    height: overrides.height ?? 0.4,
    comment: overrides.comment,
    status: overrides.status ?? "OPEN",
    createdAt: now,
    updatedAt: now
  };
}

function createAnnotationRepository(seed: Annotation[] = []) {
  const annotations = new Map(seed.map((annotation) => [annotation.id, annotation]));

  const repository: AnnotationRepository = {
    async createAnnotation(data: CreateAnnotationInput) {
      const annotation = createAnnotation({
        id: `annotation_${annotations.size + 1}`,
        pageId: data.pageId,
        createdBy: data.createdBy,
        targetType: data.targetType ?? "PAGE",
        targetId: data.targetId ?? data.pageId,
        regionId: data.regionId,
        type: data.type ?? "RECTANGLE",
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        comment: data.comment,
        status: data.status ?? "OPEN"
      });
      annotations.set(annotation.id, annotation);
      return annotation;
    },
    async findByPage(inputPageId) {
      return [...annotations.values()].filter((annotation) => annotation.pageId === inputPageId);
    },
    async findById(annotationId) {
      return annotations.get(annotationId) ?? null;
    },
    async updateAnnotation(annotationId, data: UpdateAnnotationInput) {
      const current = annotations.get(annotationId);
      if (!current) return null;
      const updated = {
        ...current,
        ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
        updatedAt: now
      } as Annotation;
      annotations.set(annotationId, updated);
      return updated;
    },
    async deleteAnnotation(annotationId) {
      return annotations.delete(annotationId);
    }
  };

  return { repository, annotations };
}

function createAnnotationApp(
  clerkId: string,
  roleByUserId: Record<string, string | null>,
  seed: Annotation[] = [],
  regions: Region[] = [createRegion()]
) {
  const { repository, annotations } = createAnnotationRepository(seed);
  const user = [owner, editor, assistant, stranger].find(u => u.clerkId === clerkId);
  const app = createApp({
    authVerifier: createVerifier(clerkId, user?.systemRole ?? null),
    userRepository: createUserRepository([owner, editor, assistant, stranger]),
    seriesRepository: createSeriesRepository(roleByUserId),
    chapterRepository: createChapterRepository(),
    pageRepository: createPageRepository(),
    regionRepository: createRegionRepository(regions),
    annotationRepository: repository
  });
  return { app, annotations };
}

describe("annotation routes", () => {
  it("lets owner Mangaka create, list, fetch, update, and delete own page annotations", async () => {
    const { app, annotations } = createAnnotationApp(owner.clerkId, { [ownerId]: "OWNER_MANGAKA" });

    const createResponse = await request(app)
      .post(`/api/pages/${pageId}/annotations`)
      .set("Authorization", "Bearer valid")
      .send({
        regionId: "region_1",
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.4,
        comment: "Dialogue bubble needs revision"
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      pageId,
      targetType: "PAGE",
      targetId: pageId,
      regionId: "region_1",
      type: "RECTANGLE",
      status: "OPEN",
      createdBy: ownerId
    });

    const annotationId = createResponse.body.data.id;
    const listResponse = await request(app)
      .get(`/api/pages/${pageId}/annotations`)
      .set("Authorization", "Bearer valid");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const detailResponse = await request(app)
      .get(`/api/annotations/${annotationId}`)
      .set("Authorization", "Bearer valid");
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.id).toBe(annotationId);

    const updateResponse = await request(app)
      .patch(`/api/annotations/${annotationId}`)
      .set("Authorization", "Bearer valid")
      .send({ status: "RESOLVED", comment: "Fixed" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toMatchObject({ status: "RESOLVED", comment: "Fixed" });

    const deleteResponse = await request(app)
      .delete(`/api/annotations/${annotationId}`)
      .set("Authorization", "Bearer valid");
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.deleted).toBe(true);
    expect(annotations.has(annotationId)).toBe(false);
  });

  it("allows assigned editors to update annotations they did not create", async () => {
    const seed = [createAnnotation({ id: "annotation_editor_update", createdBy: ownerId })];
    const { app } = createAnnotationApp(editor.clerkId, { [editorId]: "EDITOR" }, seed);

    const response = await request(app)
      .patch("/api/annotations/annotation_editor_update")
      .set("Authorization", "Bearer valid")
      .send({ comment: "Needs a stronger tone" });

    expect(response.status).toBe(200);
    expect(response.body.data.comment).toBe("Needs a stronger tone");
  });

  it("allows assistants to read but not create or mutate annotations", async () => {
    const seed = [createAnnotation({ id: "annotation_assistant_read" })];
    const { app } = createAnnotationApp(assistant.clerkId, { [assistantId]: "ASSISTANT" }, seed);

    const listResponse = await request(app)
      .get(`/api/pages/${pageId}/annotations`)
      .set("Authorization", "Bearer valid");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const createResponse = await request(app)
      .post(`/api/pages/${pageId}/annotations`)
      .set("Authorization", "Bearer valid")
      .send({ x: 0, y: 0, width: 0.5, height: 0.5 });
    expect(createResponse.status).toBe(403);

    const updateResponse = await request(app)
      .patch("/api/annotations/annotation_assistant_read")
      .set("Authorization", "Bearer valid")
      .send({ status: "RESOLVED" });
    expect(updateResponse.status).toBe(403);
  });

  it("rejects non-members and invalid region/page links", async () => {
    const strangerApp = createAnnotationApp(stranger.clerkId, { [strangerId]: null }, [createAnnotation()]).app;
    const readResponse = await request(strangerApp)
      .get(`/api/pages/${pageId}/annotations`)
      .set("Authorization", "Bearer valid");
    expect(readResponse.status).toBe(403);

    const ownerApp = createAnnotationApp(
      owner.clerkId,
      { [ownerId]: "OWNER_MANGAKA" },
      [],
      [createRegion({ id: "other_page_region", pageId: otherPageId })]
    ).app;
    const createResponse = await request(ownerApp)
      .post(`/api/pages/${pageId}/annotations`)
      .set("Authorization", "Bearer valid")
      .send({ regionId: "other_page_region", x: 0, y: 0, width: 0.5, height: 0.5 });
    expect(createResponse.status).toBe(400);
    expect(createResponse.body.code).toBe("REGION_PAGE_MISMATCH");
  });
});
