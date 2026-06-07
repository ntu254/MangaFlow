import { beforeEach, describe, expect, it, vi } from "vitest"

const seriesCreate = vi.fn()
const seriesFindById = vi.fn()
const seriesFindOne = vi.fn()
const seriesMemberCreate = vi.fn()
const manuscriptExists = vi.fn()

vi.mock("./series.model.js", () => ({
  Series: {
    create: seriesCreate,
    findById: seriesFindById,
    findOne: seriesFindOne,
  },
  SeriesMember: {
    create: seriesMemberCreate,
  },
  Manuscript: {
    exists: manuscriptExists,
  },
}))

const { createSeriesProposal, submitSeriesProposal } = await import("./series.service.js")

describe("series service", () => {
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
      ownerId: "user-1",
      status: "DRAFT",
    }
    seriesCreate.mockResolvedValue(createdSeries)

    const result = await createSeriesProposal(
      { title: "Moon Ink", synopsis: "A studio drama.", genres: ["Drama"] },
      "user-1",
    )

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
    expect(result).toBe(createdSeries)
  })

  it("blocks submit when the series has no manuscript", async () => {
    seriesFindById.mockResolvedValue({
      id: "series-1",
      ownerId: "user-1",
      status: "DRAFT",
      title: "Moon Ink",
      synopsis: "A studio drama.",
    })
    manuscriptExists.mockResolvedValue(null)

    await expect(submitSeriesProposal("series-1", "user-1")).rejects.toMatchObject({
      message: "Initial manuscript is required before submit",
      statusCode: 400,
    })
  })

  it("moves a valid draft series to editor review", async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const series = {
      id: "series-1",
      ownerId: "user-1",
      status: "DRAFT",
      title: "Moon Ink",
      synopsis: "A studio drama.",
      save,
    }
    seriesFindById.mockResolvedValue(series)
    manuscriptExists.mockResolvedValue({ _id: "manuscript-1" })

    const result = await submitSeriesProposal("series-1", "user-1")

    expect(series.status).toBe("EDITOR_REVIEW")
    expect(save).toHaveBeenCalled()
    expect(result).toBe(series)
  })
})
