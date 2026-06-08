import { beforeEach, describe, expect, it, vi } from "vitest"

const seriesCreate = vi.fn()
const seriesFindById = vi.fn()
const seriesFindOne = vi.fn()
const seriesFind = vi.fn()
const seriesMemberCreate = vi.fn()
const manuscriptExists = vi.fn()
const manuscriptCreate = vi.fn()
const manuscriptFindOne = vi.fn()
const fileAssetCreate = vi.fn()
const createPresignedUploadUrl = vi.fn()

vi.mock("./series.model.js", () => ({
  Series: {
    create: seriesCreate,
    findById: seriesFindById,
    findOne: seriesFindOne,
    find: seriesFind,
  },
  SeriesMember: {
    create: seriesMemberCreate,
  },
  Manuscript: {
    exists: manuscriptExists,
    findOne: manuscriptFindOne,
    create: manuscriptCreate,
  },
}))

vi.mock("../chapter/chapter.model.js", () => ({
  FileAsset: {
    create: fileAssetCreate,
  },
}))

vi.mock("../chapter/file.service.js", () => ({
  createPresignedUploadUrl,
}))

const { createManuscriptUploadService, createSeriesService, getSeriesDetailService, listSeriesService, submitSeriesService } = await import("./series.service.js")

describe("createSeriesService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    seriesFindOne.mockResolvedValue(null)
  })

  it("creates a draft series and auto-adds the owner as a SeriesMember", async () => {
    const createdSeries = {
      id: "series-1",
      title: "Moon Ink",
      slug: "moon-ink",
      synopsis: "A studio drama.",
      genres: ["Drama"],
      ownerId: "user-1",
      status: "DRAFT",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    seriesCreate.mockResolvedValue(createdSeries)

    const result = await createSeriesService({
      title: "Moon Ink",
      synopsis: "A studio drama.",
      genres: ["Drama"],
      ownerId: "user-1",
    })

    expect(seriesCreate).toHaveBeenCalledWith({
      title: "Moon Ink",
      slug: "moon-ink",
      synopsis: "A studio drama.",
      genres: ["Drama"],
      ownerId: "user-1",
      status: "DRAFT",
    })
    expect(seriesMemberCreate).toHaveBeenCalledWith({
      seriesId: "series-1",
      userId: "user-1",
      role: "MANGAKA",
      isActive: true,
    })
    expect(result.id).toBe("series-1")
    expect(result.slug).toBe("moon-ink")
    expect(result.status).toBe("DRAFT")
  })
})


describe("series read access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    manuscriptFindOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(null) })
  })

  it("lists only owned Series for Mangaka", async () => {
    const sort = vi.fn().mockResolvedValue([])
    seriesFind.mockReturnValue({ sort })

    await listSeriesService("user-1", "MANGAKA")

    expect(seriesFind).toHaveBeenCalledWith({ ownerId: "user-1" })
    expect(sort).toHaveBeenCalledWith({ updatedAt: -1 })
  })

  it("limits Board Series list to Board-stage records", async () => {
    const sort = vi.fn().mockResolvedValue([])
    seriesFind.mockReturnValue({ sort })

    await listSeriesService("board-1", "BOARD")

    expect(seriesFind).toHaveBeenCalledWith({
      status: { $in: ["BOARD_REVIEW", "APPROVED", "ONGOING", "AT_RISK", "REJECTED", "CANCELLED", "COMPLETED"] },
    })
  })

  it("blocks Assistant Series list access", async () => {
    await expect(listSeriesService("assistant-1", "ASSISTANT")).rejects.toMatchObject({
      message: "Assistants cannot list Series; access is task-scoped only",
      statusCode: 403,
    })
  })

  it("blocks non-owner Mangaka from Series detail", async () => {
    seriesFindById.mockResolvedValue({ id: "series-1", ownerId: "owner-1" })

    await expect(getSeriesDetailService("series-1", "intruder", "MANGAKA")).rejects.toMatchObject({
      message: "Series access denied",
      statusCode: 403,
    })
  })
})


describe("createManuscriptUploadService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a signed manuscript upload URL for the owning Mangaka", async () => {
    seriesFindById.mockResolvedValue({ id: "series-1", ownerId: "owner-1" })
    createPresignedUploadUrl.mockResolvedValue({
      uploadUrl: "https://signed.example/upload",
      fileAssetId: "ignored-external-id",
      r2Key: "uploads/file.pdf",
      expiresIn: 3600,
    })
    fileAssetCreate.mockResolvedValue({ id: "file-1" })
    manuscriptCreate.mockResolvedValue({ id: "manuscript-1" })

    const result = await createManuscriptUploadService({
      seriesId: "series-1",
      userId: "owner-1",
      originalName: "draft.pdf",
      contentType: "application/pdf",
      size: 1024,
    })

    expect(createPresignedUploadUrl).toHaveBeenCalledWith("draft.pdf", "application/pdf", undefined)
    expect(fileAssetCreate).toHaveBeenCalledWith(expect.objectContaining({
      originalName: "draft.pdf",
      mimeType: "application/pdf",
      r2Key: "uploads/file.pdf",
      uploadedBy: "owner-1",
    }))
    expect(manuscriptCreate).toHaveBeenCalledWith({
      seriesId: "series-1",
      uploadedBy: "owner-1",
      version: 1,
      status: "DRAFT",
      fileAssetId: "file-1",
    })
    expect(result).toMatchObject({ uploadUrl: "https://signed.example/upload", fileAssetId: "file-1", manuscriptId: "manuscript-1" })
  })

  it("blocks non-owner manuscript upload URL creation", async () => {
    seriesFindById.mockResolvedValue({ id: "series-1", ownerId: "owner-1" })

    await expect(createManuscriptUploadService({
      seriesId: "series-1",
      userId: "intruder",
      originalName: "draft.pdf",
      contentType: "application/pdf",
      size: 1024,
    })).rejects.toMatchObject({
      message: "Only the series owner can upload manuscripts",
      statusCode: 403,
    })

    expect(createPresignedUploadUrl).not.toHaveBeenCalled()
  })
})

describe("submitSeriesService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("blocks submit when the series has no manuscript", async () => {
    seriesFindById.mockResolvedValue({
      id: "series-1",
      ownerId: "user-1",
      status: "DRAFT",
      title: "Moon Ink",
      synopsis: "A studio drama.",
    })
    manuscriptFindOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(null) })

    await expect(submitSeriesService("series-1", "user-1")).rejects.toMatchObject({
      message: "Initial manuscript is required before submit",
      statusCode: 400,
    })
  })

  it("moves a valid draft series to editor review", async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const manuscriptSave = vi.fn().mockResolvedValue(undefined)
    const manuscript = {
      _id: "manuscript-1",
      status: "DRAFT",
      version: 1,
      save: manuscriptSave,
    }
    const series = {
      id: "series-1",
      ownerId: "user-1",
      status: "DRAFT",
      title: "Moon Ink",
      synopsis: "A studio drama.",
      save,
    }
    seriesFindById.mockResolvedValue(series)
    manuscriptFindOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(manuscript) })

    const result = await submitSeriesService("series-1", "user-1")

    expect(series.status).toBe("EDITOR_REVIEW")
    expect(manuscript.status).toBe("EDITOR_REVIEW")
    expect(save).toHaveBeenCalled()
    expect(manuscriptSave).toHaveBeenCalled()
    expect(result).toBe(series)
  })

  it("blocks non-owner from submitting", async () => {
    seriesFindById.mockResolvedValue({
      id: "series-1",
      ownerId: "owner-user",
      status: "DRAFT",
      title: "Moon Ink",
      synopsis: "A studio drama.",
    })
    manuscriptExists.mockResolvedValue({ _id: "manuscript-1" })

    await expect(submitSeriesService("series-1", "intruder")).rejects.toMatchObject({
      message: "Only the owner Mangaka can submit this series",
      statusCode: 403,
    })
  })

  it("blocks submitting a series that is not in DRAFT", async () => {
    seriesFindById.mockResolvedValue({
      id: "series-1",
      ownerId: "user-1",
      status: "EDITOR_REVIEW",
      title: "Moon Ink",
      synopsis: "A studio drama.",
    })
    manuscriptExists.mockResolvedValue({ _id: "manuscript-1" })

    await expect(submitSeriesService("series-1", "user-1")).rejects.toMatchObject({
      message: "Only draft series can be submitted",
      statusCode: 409,
    })
  })
})
