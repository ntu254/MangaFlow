import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, UserRepository } from "../auth/auth.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { Chapter } from "../chapter/chapter.service.js";
import type { CreateFileAssetInput, FileAsset } from "../file/file.types.js";
import type { FileRepository } from "../file/file.repository.js";
import type { PageRepository } from "./page.repository.js";
import type { CreatePageInput, Page, UpdatePageInput } from "./page.service.js";
import type { SeriesRepository } from "../series/series.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439011";
const chapterId = "507f1f77bcf86cd799439012";
const userId = "507f1f77bcf86cd799439013";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

const uploadRoot = path.join(process.cwd(), "uploads", "chapters", chapterId);

afterEach(() => {
  fs.rmSync(uploadRoot, { recursive: true, force: true });
});

function createVerifier(): AuthVerifier {
  return {
    async verify() {
      return {
        clerkId: "clerk_mangaka_001",
        email: "mangaka@example.com",
        fullName: "Mangaka One",
        avatarUrl: null
      };
    }
  };
}

function createUserRepository(): UserRepository {
  const user: AuthUser = {
    id: userId,
    clerkId: "clerk_mangaka_001",
    email: "mangaka@example.com",
    fullName: "Mangaka One",
    avatarUrl: null,
    systemRole: "MANGAKA",
    requestedSystemRole: null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };

  return {
    async findByClerkId(clerkId) {
      return clerkId === user.clerkId ? user : null;
    },
    async upsertFromClerk() {
      return user;
    },
    async updateOnboarding() {
      return user;
    }
  };
}

function createSeriesRepository(): SeriesRepository {
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
      if (inputSeriesId === seriesId && inputUserId === userId) {
        return "OWNER_MANGAKA";
      }
      return null;
    }
  };
}

function createChapterRepository(): ChapterRepository {
  const chapter: Chapter = {
    id: chapterId,
    seriesId,
    title: "Chapter 1",
    chapterNumber: 1,
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

function createPageRepository() {
  const pages: Page[] = [];

  const repository: PageRepository = {
    async createPage(data: CreatePageInput) {
      const page: Page = {
        id: `page_${pages.length + 1}`,
        chapterId: data.chapterId,
        pageNumber: data.pageNumber,
        originalFileUrl: data.originalFileUrl,
        previewUrl: data.previewUrl,
        thumbnailUrl: data.thumbnailUrl,
        processedFileUrl: data.processedFileUrl,
        width: data.width ?? 1200,
        height: data.height ?? 1600,
        currentVersion: 1,
        status: "UPLOADED",
        createdAt: now,
        updatedAt: now
      };
      pages.push(page);
      return page;
    },
    async findPagesByChapter(inputChapterId) {
      return pages.filter((page) => page.chapterId === inputChapterId);
    },
    async findById(pageId) {
      return pages.find((page) => page.id === pageId) ?? null;
    },
    async updatePage(pageId, data: UpdatePageInput) {
      const index = pages.findIndex((page) => page.id === pageId);
      if (index === -1) return null;
      pages[index] = { ...pages[index], ...data, updatedAt: now };
      return pages[index];
    },
    async deletePage(pageId) {
      const index = pages.findIndex((page) => page.id === pageId);
      if (index === -1) return false;
      pages.splice(index, 1);
      return true;
    }
  };

  return { repository, pages };
}

function createFileRepository() {
  const assets: FileAsset[] = [];

  const repository: FileRepository = {
    async createFileAsset(data: CreateFileAssetInput) {
      const asset: FileAsset = {
        id: `file_${assets.length + 1}`,
        ownerType: data.ownerType,
        ownerId: data.ownerId,
        originalUrl: data.originalUrl,
        aiProcessUrl: data.aiProcessUrl,
        previewUrl: data.previewUrl,
        thumbnailUrl: data.thumbnailUrl,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        versionNumber: data.versionNumber ?? 1,
        uploadedBy: data.uploadedBy,
        createdAt: now,
        updatedAt: now
      };
      assets.push(asset);
      return asset;
    },
    async findById(fileId) {
      return assets.find((asset) => asset.id === fileId) ?? null;
    },
    async findByOwner(ownerType, ownerId) {
      return assets.filter((asset) => asset.ownerType === ownerType && asset.ownerId === ownerId);
    },
    async findLatestByOwner(ownerType, ownerId) {
      return assets.find((asset) => asset.ownerType === ownerType && asset.ownerId === ownerId) ?? null;
    },
    async deleteFileAsset(fileId) {
      const index = assets.findIndex((asset) => asset.id === fileId);
      if (index === -1) return false;
      assets.splice(index, 1);
      return true;
    }
  };

  return { repository, assets };
}

describe("page upload routes", () => {
  it("uploads image pages through local storage and creates FileAsset metadata", async () => {
    const { repository: pageRepository, pages } = createPageRepository();
    const { repository: fileRepository, assets } = createFileRepository();
    const app = createApp({
      authVerifier: createVerifier(),
      userRepository: createUserRepository(),
      seriesRepository: createSeriesRepository(),
      chapterRepository: createChapterRepository(),
      pageRepository,
      fileRepository
    });

    const response = await request(app)
      .post(`/api/chapters/${chapterId}/pages`)
      .set("Authorization", "Bearer valid")
      .attach("files", tinyPng, {
        filename: "page-001.png",
        contentType: "image/png"
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      chapterId,
      pageNumber: 1,
      status: "UPLOADED",
      width: 1,
      height: 1
    });
    expect(response.body.data.originalFileUrl).toContain(`/uploads/chapters/${chapterId}/pages/v1/`);
    expect(response.body.data.previewUrl).toContain("preview_page-001.png");
    expect(response.body.data.thumbnailUrl).toContain("thumb_page-001.png");

    expect(pages).toHaveLength(1);
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      ownerType: "PAGE",
      ownerId: pages[0].id,
      fileName: "page-001.png",
      mimeType: "image/png",
      width: 1,
      height: 1,
      uploadedBy: userId
    });
    expect(assets[0].aiProcessUrl).toContain("ai_page-001.png");
    expect(fs.existsSync(uploadRoot)).toBe(true);
  });
});
