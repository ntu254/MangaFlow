import { beforeEach, describe, expect, it, vi } from "vitest"

const findSeriesById = vi.fn()
const findExistingChapter = vi.fn()
const createChapter = vi.fn()

vi.mock("../../series/series.model.js", () => ({
  Series: {
    findById: findSeriesById,
  },
}))

vi.mock("../chapter.model.js", () => ({
  Chapter: {
    findOne: findExistingChapter,
    create: createChapter,
  },
}))

const { createChapterRepository } = await import("./chapter.repository.js")

describe("createChapterRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a draft chapter for a Board-approved series with publication type", async () => {
    findSeriesById.mockResolvedValue({ status: "APPROVED", publicationType: "WEEKLY" })
    findExistingChapter.mockResolvedValue(null)
    createChapter.mockResolvedValue({
      id: "chapter-1",
      seriesId: "series-1",
      chapterNumber: 1,
      title: "Chapter 1",
      status: "DRAFT",
      publicationTypeSnapshot: "WEEKLY",
      createdAt: new Date("2026-06-21T00:00:00.000Z"),
      updatedAt: new Date("2026-06-21T00:00:00.000Z"),
    })

    const result = await createChapterRepository({
      seriesId: "series-1",
      chapterNumber: 1,
      title: "Chapter 1",
    })

    expect(createChapter).toHaveBeenCalledWith({
      seriesId: "series-1",
      chapterNumber: 1,
      title: "Chapter 1",
      status: "DRAFT",
      publicationTypeSnapshot: "WEEKLY",
    })
    expect(result).toMatchObject({
      id: "chapter-1",
      seriesId: "series-1",
      chapterNumber: 1,
      title: "Chapter 1",
      status: "DRAFT",
      publicationTypeSnapshot: "WEEKLY",
    })
  })

  it("blocks chapter creation before Board approval", async () => {
    findSeriesById.mockResolvedValue({ status: "BOARD_REVIEW", publicationType: "WEEKLY" })

    await expect(createChapterRepository({
      seriesId: "series-1",
      chapterNumber: 1,
      title: "Chapter 1",
    })).rejects.toThrow("Must be APPROVED, ONGOING, or AT_RISK")
  })

  it("blocks approved series without an official publication type", async () => {
    findSeriesById.mockResolvedValue({ status: "APPROVED" })

    await expect(createChapterRepository({
      seriesId: "series-1",
      chapterNumber: 1,
      title: "Chapter 1",
    })).rejects.toThrow("official publication type")
  })
})
