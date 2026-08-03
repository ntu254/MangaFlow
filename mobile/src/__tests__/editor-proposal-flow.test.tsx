import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { EditorProposalDetailScreen } from "@/screens/editor-proposal-detail-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
import * as dataSource from "@/services/editor-mobile-data-source"
import type { EditorProposalDetail } from "@/services/editor-mobile-data-source"

jest.mock("@/services/editor-mobile-data-source", () => ({
  getEditorProposalDetail: jest.fn(),
  claimEditorProposal: jest.fn(),
  requestEditorProposalChanges: jest.fn(),
  rejectEditorProposal: jest.fn(),
  forwardEditorProposal: jest.fn(),
}))

const mocked = dataSource as jest.Mocked<typeof dataSource>

const detailFixture: EditorProposalDetail = {
  proposal: {
    id: "p-002",
    title: "Neon District",
    status: "EDITOR_REVIEWING",
    synopsis: "A synopsis.",
    logline: "A logline.",
    targetAudience: "SEINEN",
    genres: ["action"],
    requestedPublicationType: "MONTHLY",
  },
  claim: { claimedByEditorId: "u-editor", claimedByEditorName: "Tanaka Akira", claimedByMe: true },
  currentManuscript: { id: "m1", version: 2, status: "SUBMITTED" },
  version: 2,
  history: [],
  actions: [
    { action: "CLAIM", enabled: false, disabledReason: "You already claimed this proposal.", requiresConfirmation: true, requiresReason: false },
    { action: "REQUEST_CHANGES", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: true },
    { action: "REJECT", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: true },
    { action: "FORWARD", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
  ],
}

function renderScreen() {
  mocked.getEditorProposalDetail.mockResolvedValue(detailFixture)
  return render(
    <TestQueryProvider>
      <EditorProposalDetailScreen proposalId="p-002" />
    </TestQueryProvider>,
  )
}

describe("EditorProposalDetailScreen", () => {
  afterEach(() => jest.clearAllMocks())

  it("requires a reason before requesting changes", async () => {
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Request changes" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm request changes" }))
    expect(await screen.findByText("Reason is required.")).toBeVisible()
    expect(mocked.requestEditorProposalChanges).not.toHaveBeenCalled()
  })

  it("submits a reason for request changes", async () => {
    mocked.requestEditorProposalChanges.mockResolvedValue(undefined)
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Request changes" }))
    fireEvent.changeText(await screen.findByLabelText("Reason"), "Expand the cast.")
    fireEvent.press(screen.getByRole("button", { name: "Confirm request changes" }))
    await waitFor(() =>
      expect(mocked.requestEditorProposalChanges).toHaveBeenCalledWith("p-002", {
        comment: "Expand the cast.",
      }),
    )
  })

  it("forwards with an editor recommendation and cadence", async () => {
    mocked.forwardEditorProposal.mockResolvedValue(undefined)
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Forward to Board" }))
    fireEvent.changeText(
      await screen.findByLabelText("Editor recommendation"),
      "Ready for Board review.",
    )
    fireEvent.press(screen.getByRole("button", { name: "Confirm forward" }))
    await waitFor(() =>
      expect(mocked.forwardEditorProposal).toHaveBeenCalledWith(
        "p-002",
        expect.objectContaining({
          editorRecommendation: "Ready for Board review.",
          suggestedPublicationType: "MONTHLY",
        }),
      ),
    )
  })

  it("blocks forwarding without a recommendation", async () => {
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Forward to Board" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm forward" }))
    expect(await screen.findByText("Editor recommendation is required.")).toBeVisible()
    expect(mocked.forwardEditorProposal).not.toHaveBeenCalled()
  })
})
