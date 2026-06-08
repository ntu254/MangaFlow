import { beforeEach, describe, expect, it, vi } from "vitest"
import * as repository from "./manuscript.repository.js"
import {
  forwardManuscriptToBoardService,
  rejectManuscriptService,
  requestManuscriptRevisionService,
} from "./manuscript.service.js"

vi.mock("./manuscript.repository.js")

describe("manuscript review service", () => {
  const manuscript = {
    _id: "manuscript1",
    seriesId: "series1",
    status: "EDITOR_REVIEW",
  }
  const series = {
    _id: "series1",
    status: "EDITOR_REVIEW",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(repository.getManuscriptById).mockResolvedValue(manuscript as any)
    vi.mocked(repository.getSeriesForManuscript).mockResolvedValue(series as any)
  })

  it("requests revision and returns Series to REVISION_REQUESTED", async () => {
    vi.mocked(repository.updateManuscriptReviewStatus).mockResolvedValue({
      id: "manuscript1",
      status: "REVISION_REQUESTED",
    } as any)

    const result = await requestManuscriptRevisionService({
      manuscriptId: "manuscript1",
      actor: { userId: "editor1", role: "EDITOR" },
      reviewNote: "Please revise",
    })

    expect(result).toMatchObject({ status: "REVISION_REQUESTED" })
    expect(repository.updateManuscriptReviewStatus).toHaveBeenCalledWith(
      "manuscript1",
      "REVISION_REQUESTED",
      "Please revise",
    )
    expect(repository.updateSeriesReviewStatus).toHaveBeenCalledWith(
      "series1",
      "REVISION_REQUESTED",
    )
  })

  it("forwards manuscript to Board and sets Series BOARD_REVIEW", async () => {
    vi.mocked(repository.updateManuscriptReviewStatus).mockResolvedValue({
      id: "manuscript1",
      status: "APPROVED_TO_BOARD",
    } as any)

    await forwardManuscriptToBoardService({
      manuscriptId: "manuscript1",
      actor: { userId: "editor1", role: "EDITOR" },
    })

    expect(repository.updateManuscriptReviewStatus).toHaveBeenCalledWith(
      "manuscript1",
      "APPROVED_TO_BOARD",
      undefined,
    )
    expect(repository.updateSeriesReviewStatus).toHaveBeenCalledWith(
      "series1",
      "BOARD_REVIEW",
    )
  })

  it("rejects manuscript and sets Series REJECTED", async () => {
    vi.mocked(repository.updateManuscriptReviewStatus).mockResolvedValue({
      id: "manuscript1",
      status: "REJECTED",
    } as any)

    await rejectManuscriptService({
      manuscriptId: "manuscript1",
      actor: { userId: "editor1", role: "EDITOR" },
    })

    expect(repository.updateSeriesReviewStatus).toHaveBeenCalledWith(
      "series1",
      "REJECTED",
    )
  })

  it("blocks non-Editor review actions", async () => {
    await expect(
      forwardManuscriptToBoardService({
        manuscriptId: "manuscript1",
        actor: { userId: "mangaka1", role: "MANGAKA" },
      }),
    ).rejects.toThrow("Only Editor can review manuscripts")
  })

  it("blocks review when Series is not in EDITOR_REVIEW", async () => {
    vi.mocked(repository.getSeriesForManuscript).mockResolvedValue({
      ...series,
      status: "DRAFT",
    } as any)

    await expect(
      forwardManuscriptToBoardService({
        manuscriptId: "manuscript1",
        actor: { userId: "editor1", role: "EDITOR" },
      }),
    ).rejects.toThrow("Series must be in EDITOR_REVIEW")
  })

  it("blocks review when Manuscript is not in EDITOR_REVIEW", async () => {
    vi.mocked(repository.getManuscriptById).mockResolvedValue({
      ...manuscript,
      status: "REVISION_REQUESTED",
    } as any)

    await expect(
      forwardManuscriptToBoardService({
        manuscriptId: "manuscript1",
        actor: { userId: "editor1", role: "EDITOR" },
      }),
    ).rejects.toThrow("Manuscript must be in EDITOR_REVIEW")
  })
})
