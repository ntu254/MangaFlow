import { fireEvent, render, screen } from "@testing-library/react-native"
import { AtRiskDecisionSheet } from "@/components/at-risk-decision-sheet"
import { decideAtRisk } from "@/services/board-mobile-data-source"
import { mobileApi } from "@/services/mobile-api-client"

jest.mock("@/services/mobile-api-client", () => ({
  mobileApi: { request: jest.fn() },
}))

const mockedMobileApi = mobileApi as jest.Mocked<typeof mobileApi>

function renderAtRiskDecision(isBoardChair = true, onConfirm = jest.fn()) {
  return render(
    <AtRiskDecisionSheet
      visible
      isBoardChair={isBoardChair}
      seriesTitle="Vinland Saga"
      evidence="Rank #19, down 7 places; reader score 2.8."
      reason="The backend marked this title at risk after the latest ranking review."
      onCancel={jest.fn()}
      onConfirm={onConfirm}
    />,
  )
}

describe("AtRiskDecisionSheet", () => {
  afterEach(() => jest.clearAllMocks())

  it("shows backend evidence and reason with the exact supported decision labels", () => {
    renderAtRiskDecision()
    expect(screen.getByText("Rank #19, down 7 places; reader score 2.8.")).toBeVisible()
    expect(screen.getByText("The backend marked this title at risk after the latest ranking review.")).toBeVisible()
    expect(screen.getByRole("button", { name: "Continue" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Warning" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Request improvement plan" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Cancel series" })).toBeVisible()
    expect(screen.queryByRole("button", { name: "Complete" })).toBeNull()
  })

  it("requires a reason before manual cancellation", () => {
    const onConfirm = jest.fn()
    renderAtRiskDecision(true, onConfirm)
    fireEvent.press(screen.getByRole("button", { name: "Cancel series" }))
    fireEvent.press(screen.getByRole("button", { name: "Confirm cancellation" }))
    expect(screen.getByText("Reason is required.")).toBeVisible()
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText("Cancellation is a manual Chair decision; it is never automatic.")).toBeVisible()
  })

  it("submits a supported non-cancellation decision without a reason", () => {
    const onConfirm = jest.fn()
    renderAtRiskDecision(true, onConfirm)
    fireEvent.press(screen.getByRole("button", { name: "Request improvement plan" }))
    fireEvent.press(screen.getByRole("button", { name: "Confirm decision" }))
    expect(onConfirm).toHaveBeenCalledWith({ decision: "REQUEST_IMPROVEMENT_PLAN", note: undefined })
  })

  it("does not show decision actions to a non-Chair", () => {
    renderAtRiskDecision(false)
    expect(screen.getByText("Only the Board Chair can record an at-risk decision.")).toBeVisible()
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Confirm decision" })).toBeNull()
  })

  it("sends the exact validated decision payload and uses 44px action targets", async () => {
    mockedMobileApi.request.mockResolvedValue(undefined)
    await decideAtRisk("series-1", {
      rankingId: "ranking-1",
      decision: "WARNING",
      note: "Board review completed.",
    })
    expect(mockedMobileApi.request).toHaveBeenCalledWith("/board/series/series-1/at-risk-decisions", {
      method: "POST",
      body: JSON.stringify({ rankingId: "ranking-1", decision: "WARNING", note: "Board review completed." }),
    })

    renderAtRiskDecision()
    expect(screen.getByRole("button", { name: "Continue" })).toHaveStyle({ minHeight: 44 })
    expect(screen.getByRole("button", { name: "Confirm decision" })).toHaveStyle({ minHeight: 44 })
  })
})
