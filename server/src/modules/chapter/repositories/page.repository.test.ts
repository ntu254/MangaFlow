import { beforeEach, describe, expect, it, vi } from "vitest"
import { Chapter, FileAsset, Page } from "../chapter.model.js"
import { Series } from "../../series/series.model.js"
import { confirmPageUploadRepository } from "./page.repository.js"

vi.mock("../chapter.model.js", () => ({
  Chapter: {
    findById: vi.fn(),
  },
  Page: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
  FileAsset: {
    findByIdAndUpdate: vi.fn(),
  },
}))

vi.mock("../../series/series.model.js", () => ({
  Series: {
    updateOne: vi.fn(),
  },
}))

describe("confirmPageUploadRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Series.updateOne).mockResolvedValue({ acknowledged: true } as any)
  })

  it("confirms upload when original, working, and thumbnail reuse the same uploaded asset", async () => {
    const upload = {
      fileAssetId: "asset-1",
      r2Key: "uploads/asset-1.jpg",
      originalName: "page.jpg",
      mimeType: "image/jpeg",
      size: 120_000,
    }
    const fileAsset = { _id: "asset-1", slot: "ORIGINAL" }
    const page = {
      _id: "page-1",
      status: "UPLOADED",
      originalFileAssetId: "asset-1",
      workingFileAssetId: "asset-1",
      thumbnailFileAssetId: "asset-1",
    }

    vi.mocked(Page.findById).mockResolvedValue({ _id: "page-1" } as any)
    vi.mocked(FileAsset.findByIdAndUpdate).mockResolvedValue(fileAsset as any)
    vi.mocked(Page.findByIdAndUpdate).mockResolvedValue(page as any)

    const result = await confirmPageUploadRepository({
      pageId: "page-1",
      uploadedBy: "user-1",
      original: upload,
      working: upload,
      thumbnail: upload,
    })

    expect(FileAsset.findByIdAndUpdate).toHaveBeenCalledTimes(1)
    expect(Page.findByIdAndUpdate).toHaveBeenCalledWith(
      "page-1",
      {
        status: "UPLOADED",
        originalFileAssetId: "asset-1",
        workingFileAssetId: "asset-1",
        thumbnailFileAssetId: "asset-1",
      },
      { new: true },
    )
    expect(result).toEqual({
      page,
      originalAsset: fileAsset,
      workingAsset: fileAsset,
      thumbnailAsset: fileAsset,
    })
  })

  it("moves an approved series to ongoing after the first production page upload", async () => {
    const upload = {
      fileAssetId: "asset-1",
      r2Key: "uploads/asset-1.jpg",
      originalName: "page.jpg",
      mimeType: "image/jpeg",
      size: 120_000,
    }
    const page = {
      _id: "page-1",
      status: "UPLOADED",
      originalFileAssetId: "asset-1",
      workingFileAssetId: "asset-1",
      thumbnailFileAssetId: "asset-1",
    }

    vi.mocked(Page.findById).mockResolvedValue({ _id: "page-1", chapterId: "chapter-1" } as any)
    vi.mocked(Chapter.findById).mockResolvedValue({ _id: "chapter-1", seriesId: "series-1" } as any)
    vi.mocked(FileAsset.findByIdAndUpdate).mockResolvedValue({ _id: "asset-1" } as any)
    vi.mocked(Page.findByIdAndUpdate).mockResolvedValue(page as any)

    await confirmPageUploadRepository({
      pageId: "page-1",
      uploadedBy: "user-1",
      original: upload,
      working: upload,
      thumbnail: upload,
    })

    expect(Series.updateOne).toHaveBeenCalledWith(
      { _id: "series-1", status: "APPROVED" },
      { $set: { status: "ONGOING" } },
    )
  })

  it("keeps page upload confirmed if series lifecycle sync fails", async () => {
    const upload = {
      fileAssetId: "asset-1",
      r2Key: "uploads/asset-1.jpg",
      originalName: "page.jpg",
      mimeType: "image/jpeg",
      size: 120_000,
    }
    const page = {
      _id: "page-1",
      status: "UPLOADED",
      originalFileAssetId: "asset-1",
      workingFileAssetId: "asset-1",
      thumbnailFileAssetId: "asset-1",
    }

    vi.mocked(Page.findById).mockResolvedValue({ _id: "page-1", chapterId: "chapter-1" } as any)
    vi.mocked(Chapter.findById).mockResolvedValue({ _id: "chapter-1", seriesId: "series-1" } as any)
    vi.mocked(FileAsset.findByIdAndUpdate).mockResolvedValue({ _id: "asset-1" } as any)
    vi.mocked(Page.findByIdAndUpdate).mockResolvedValue(page as any)
    vi.mocked(Series.updateOne).mockRejectedValue(new Error("series sync failed"))

    const result = await confirmPageUploadRepository({
      pageId: "page-1",
      uploadedBy: "user-1",
      original: upload,
      working: upload,
      thumbnail: upload,
    })

    expect(result.page).toBe(page)
  })
})
