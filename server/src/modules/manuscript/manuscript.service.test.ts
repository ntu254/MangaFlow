import { beforeEach, describe, expect, it, vi } from "vitest"

const getManuscriptWithSeries = vi.fn()
const updateProposalReview = vi.fn()

vi.mock("./manuscript.repository.js", () => ({
  getManuscriptWithSeries,
  updateProposalReview,
}))

const { reviewManuscriptProposalService } = await import("./manuscript.service.js")

describe("reviewManuscriptProposalService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards editor-reviewed manuscript to Board and moves Series to BOARD_REVIEW", async () => {
    getManuscriptWithSeries.mockResolvedValue({
      manuscript: { id: "manuscript-1", status: "EDITOR_REVIEW" },
      series: { id: "series-1", status: "EDITOR_REVIEW" },
    })
    updateProposalReview.mockResolvedValue({ manuscript: { status: "APPROVED_TO_BOARD" }, series: { status: "BOARD_REVIEW" } })

    await reviewManuscriptProposalService("manuscript-1", "FORWARD_TO_BOARD")

    expect(updateProposalReview).toHaveBeenCalledWith("manuscript-1", "APPROVED_TO_BOARD", "series-1", "BOARD_REVIEW")
  })

  it("requests revision and returns both records to revision state", async () => {
    getManuscriptWithSeries.mockResolvedValue({
      manuscript: { id: "manuscript-1", status: "EDITOR_REVIEW" },
      series: { id: "series-1", status: "EDITOR_REVIEW" },
    })

    await reviewManuscriptProposalService("manuscript-1", "REQUEST_REVISION")

    expect(updateProposalReview).toHaveBeenCalledWith("manuscript-1", "REVISION_REQUESTED", "series-1", "REVISION_REQUESTED")
  })

  it("rejects proposal and moves both records to rejected", async () => {
    getManuscriptWithSeries.mockResolvedValue({
      manuscript: { id: "manuscript-1", status: "EDITOR_REVIEW" },
      series: { id: "series-1", status: "EDITOR_REVIEW" },
    })

    await reviewManuscriptProposalService("manuscript-1", "REJECT")

    expect(updateProposalReview).toHaveBeenCalledWith("manuscript-1", "REJECTED", "series-1", "REJECTED")
  })

  it("blocks proposals outside editor review", async () => {
    getManuscriptWithSeries.mockResolvedValue({
      manuscript: { id: "manuscript-1", status: "DRAFT" },
      series: { id: "series-1", status: "DRAFT" },
    })

    await expect(reviewManuscriptProposalService("manuscript-1", "FORWARD_TO_BOARD")).rejects.toMatchObject({
      message: "Manuscript proposal is not in editor review",
      statusCode: 409,
    })

    expect(updateProposalReview).not.toHaveBeenCalled()
  })
})
