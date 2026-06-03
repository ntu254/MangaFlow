import { describe, expect, it } from "vitest";
import { createPageService, type CreatePageInput, type Page, type UpdatePageInput } from "./page.service.js";
import type { PageRepository } from "./page.repository.js";

const now = "2026-06-03T00:00:00.000Z";

function createPage(overrides: Partial<Page> = {}): Page {
  return {
    id: overrides.id ?? "page_1",
    chapterId: overrides.chapterId ?? "chapter_1",
    pageNumber: overrides.pageNumber ?? 1,
    originalFileUrl: overrides.originalFileUrl ?? "storage://page-original.png",
    previewUrl: overrides.previewUrl,
    thumbnailUrl: overrides.thumbnailUrl,
    processedFileUrl: overrides.processedFileUrl,
    width: overrides.width ?? 1200,
    height: overrides.height ?? 1600,
    currentVersion: overrides.currentVersion ?? 1,
    status: overrides.status ?? "UPLOADED",
    createdAt: now,
    updatedAt: now
  };
}

function createRepository(seed: Page[] = []) {
  const pages = new Map(seed.map((page) => [page.id, page]));

  const repository: PageRepository = {
    async createPage(data: CreatePageInput) {
      if ([...pages.values()].some((page) => page.chapterId === data.chapterId && page.pageNumber === data.pageNumber)) {
        throw { code: 11000 };
      }
      const page = createPage({
        id: `page_${pages.size + 1}`,
        chapterId: data.chapterId,
        pageNumber: data.pageNumber,
        originalFileUrl: data.originalFileUrl,
        previewUrl: data.previewUrl,
        thumbnailUrl: data.thumbnailUrl,
        processedFileUrl: data.processedFileUrl,
        width: data.width,
        height: data.height
      });
      pages.set(page.id, page);
      return page;
    },
    async findPagesByChapter(chapterId) {
      return [...pages.values()].filter((page) => page.chapterId === chapterId);
    },
    async findById(pageId) {
      return pages.get(pageId) ?? null;
    },
    async updatePage(pageId, data: UpdatePageInput) {
      const existing = pages.get(pageId);
      if (!existing) return null;
      if (
        data.pageNumber !== undefined &&
        [...pages.values()].some(
          (page) => page.id !== pageId && page.chapterId === existing.chapterId && page.pageNumber === data.pageNumber
        )
      ) {
        throw { code: 11000 };
      }
      const cleanData = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as UpdatePageInput;
      const updated = { ...existing, ...cleanData, updatedAt: now };
      pages.set(pageId, updated);
      return updated;
    },
    async deletePage(pageId) {
      return pages.delete(pageId);
    }
  };

  return { repository, pages };
}

describe("page service", () => {
  it("creates pages and rejects invalid file/page inputs", async () => {
    const { repository } = createRepository();
    const service = createPageService(repository);

    await expect(
      service.createPage({
        chapterId: "chapter_1",
        pageNumber: 1,
        originalFileUrl: "storage://page.png"
      })
    ).resolves.toMatchObject({
      status: "UPLOADED",
      currentVersion: 1
    });

    await expect(
      service.createPage({
        chapterId: "chapter_1",
        pageNumber: 0,
        originalFileUrl: "storage://bad.png"
      })
    ).rejects.toMatchObject({ code: "INVALID_PAGE_NUMBER" });

    await expect(
      service.createPage({
        chapterId: "chapter_1",
        pageNumber: 2,
        originalFileUrl: " "
      })
    ).rejects.toMatchObject({ code: "INVALID_FILE_URL" });
  });

  it("maps duplicate page numbers to service errors", async () => {
    const { repository } = createRepository([createPage({ id: "page_existing", pageNumber: 1 })]);
    const service = createPageService(repository);

    await expect(
      service.createPage({
        chapterId: "chapter_1",
        pageNumber: 1,
        originalFileUrl: "storage://duplicate.png"
      })
    ).rejects.toMatchObject({
      code: "DUPLICATE_PAGE_NUMBER",
      statusCode: 400
    });
  });

  it("validates page status transitions and deletes existing pages", async () => {
    const { repository, pages } = createRepository([createPage({ id: "page_flow", status: "UPLOADED" })]);
    const service = createPageService(repository);

    await expect(service.updatePage("page_flow", { status: "AI_PROCESSED" })).resolves.toMatchObject({
      status: "AI_PROCESSED"
    });
    await expect(service.updatePage("page_flow", { status: "READY_TO_PUBLISH" })).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION"
    });
    await expect(service.deletePage("page_flow")).resolves.toBe(true);
    expect(pages.has("page_flow")).toBe(false);
  });
});
