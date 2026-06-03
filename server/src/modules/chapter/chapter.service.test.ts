import { describe, expect, it } from "vitest";
import { createChapterService, type Chapter, type CreateChapterInput, type UpdateChapterInput } from "./chapter.service.js";
import type { ChapterRepository } from "./chapter.repository.js";

const now = "2026-06-03T00:00:00.000Z";

function createChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: overrides.id ?? "chapter_1",
    seriesId: overrides.seriesId ?? "series_1",
    title: overrides.title ?? "Chapter One",
    chapterNumber: overrides.chapterNumber ?? 1,
    status: overrides.status ?? "DRAFT",
    deadline: overrides.deadline,
    createdAt: now,
    updatedAt: now
  };
}

function createRepository(seed: Chapter[] = []) {
  const chapters = new Map(seed.map((chapter) => [chapter.id, chapter]));

  const repository: ChapterRepository = {
    async createChapter(data: CreateChapterInput) {
      if ([...chapters.values()].some((chapter) => chapter.seriesId === data.seriesId && chapter.chapterNumber === data.chapterNumber)) {
        throw { code: 11000 };
      }
      const chapter = createChapter({
        id: `chapter_${chapters.size + 1}`,
        seriesId: data.seriesId,
        title: data.title,
        chapterNumber: data.chapterNumber,
        deadline: data.deadline,
        status: "DRAFT"
      });
      chapters.set(chapter.id, chapter);
      return chapter;
    },
    async findChaptersBySeries(seriesId) {
      return [...chapters.values()].filter((chapter) => chapter.seriesId === seriesId);
    },
    async findById(chapterId) {
      return chapters.get(chapterId) ?? null;
    },
    async updateChapter(chapterId, data: UpdateChapterInput) {
      const existing = chapters.get(chapterId);
      if (!existing) return null;
      if (
        data.chapterNumber !== undefined &&
        [...chapters.values()].some(
          (chapter) =>
            chapter.id !== chapterId &&
            chapter.seriesId === existing.seriesId &&
            chapter.chapterNumber === data.chapterNumber
        )
      ) {
        throw { code: 11000 };
      }
      const cleanData = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as UpdateChapterInput;
      const updated = {
        ...existing,
        ...cleanData,
        deadline: cleanData.deadline === null ? undefined : cleanData.deadline ?? existing.deadline,
        updatedAt: now
      };
      chapters.set(chapterId, updated);
      return updated;
    },
    async deleteChapter(chapterId) {
      return chapters.delete(chapterId);
    }
  };

  return { repository, chapters };
}

describe("chapter service", () => {
  it("creates draft chapters and rejects invalid inputs", async () => {
    const { repository } = createRepository();
    const service = createChapterService(repository);

    await expect(
      service.createChapter({
        seriesId: "series_1",
        title: "Chapter One",
        chapterNumber: 1
      })
    ).resolves.toMatchObject({
      status: "DRAFT",
      chapterNumber: 1
    });

    await expect(
      service.createChapter({
        seriesId: "series_1",
        title: " ",
        chapterNumber: 2
      })
    ).rejects.toMatchObject({ code: "INVALID_TITLE" });

    await expect(
      service.createChapter({
        seriesId: "series_1",
        title: "Bad Number",
        chapterNumber: 0
      })
    ).rejects.toMatchObject({ code: "INVALID_CHAPTER_NUMBER" });
  });

  it("maps duplicate chapter numbers to service errors", async () => {
    const { repository } = createRepository([createChapter({ id: "chapter_existing", chapterNumber: 1 })]);
    const service = createChapterService(repository);

    await expect(
      service.createChapter({
        seriesId: "series_1",
        title: "Duplicate",
        chapterNumber: 1
      })
    ).rejects.toMatchObject({
      code: "DUPLICATE_CHAPTER_NUMBER",
      statusCode: 400
    });
  });

  it("validates chapter status transitions and draft-only deletion", async () => {
    const { repository } = createRepository([
      createChapter({ id: "chapter_flow", status: "DRAFT" }),
      createChapter({ id: "chapter_published", status: "PUBLISHED" })
    ]);
    const service = createChapterService(repository);

    await expect(service.updateChapter("chapter_flow", { status: "IN_PROGRESS" })).resolves.toMatchObject({
      status: "IN_PROGRESS"
    });
    await expect(service.updateChapter("chapter_flow", { status: "PUBLISHED" })).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION"
    });
    await expect(service.deleteChapter("chapter_published")).rejects.toMatchObject({
      code: "INVALID_STATE"
    });
  });
});
