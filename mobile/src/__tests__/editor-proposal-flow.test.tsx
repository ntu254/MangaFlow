import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { EditorProposalDetailScreen } from "@/screens/editor-proposal-detail-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
import { MobileApiError } from "@/services/mobile-api-error"
import * as dataSource from "@/services/editor-mobile-data-source"
import type { EditorialChecklist, EditorProposalDetail } from "@/services/editor-mobile-data-source"

jest.mock("@/services/editor-mobile-data-source", () => ({
  getEditorProposalDetail: jest.fn(),
  claimEditorProposal: jest.fn(),
  releaseEditorProposalClaim: jest.fn(),
  requestEditorProposalChanges: jest.fn(),
  rejectEditorProposal: jest.fn(),
  forwardEditorProposal: jest.fn(),
  updateEditorProposalChecklist: jest.fn(),
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
  currentManuscript: { id: "m1", version: 2 },
  version: 2,
  history: [],
  editorialChecklist: {
    hook: true,
    characterMotivation: false,
    audienceFit: true,
    storyboardFlow: false,
    manuscriptQuality: true,
    serializePotential: false,
  },
  actions: [
    { action: "CLAIM", enabled: false, disabledReason: "You already claimed this proposal.", requiresConfirmation: true, requiresReason: false },
    { action: "RELEASE_CLAIM", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
    { action: "REQUEST_CHANGES", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: true },
    { action: "REJECT", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: true },
    { action: "FORWARD", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
  ],
}

const completeChecklist: EditorialChecklist = {
  hook: true,
  characterMotivation: true,
  audienceFit: true,
  storyboardFlow: true,
  manuscriptQuality: true,
  serializePotential: true,
}

const forwardReadyFixture: EditorProposalDetail = {
  ...detailFixture,
  editorialChecklist: completeChecklist,
}

function renderScreen(detail: EditorProposalDetail = forwardReadyFixture) {
  mocked.getEditorProposalDetail.mockResolvedValue(detail)
  return render(
    <TestQueryProvider>
      <EditorProposalDetailScreen proposalId="p-002" />
    </TestQueryProvider>,
  )
}

describe("EditorProposalDetailScreen", () => {
  afterEach(() => jest.clearAllMocks())

  it("shows Board-awaiting state instead of stale editor actions", async () => {
    renderScreen({
      ...forwardReadyFixture,
      proposal: { ...forwardReadyFixture.proposal, status: "PENDING_BOARD" },
    })

    expect(await screen.findByText("Awaiting Board session")).toBeVisible()
    expect(screen.queryByRole("button", { name: "Forward to Board" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Request changes" })).toBeNull()
  })

  it("requires a reason before requesting changes", async () => {
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Request changes" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm request changes" }))
    expect(await screen.findByText("Reason is required.")).toBeVisible()
    expect(mocked.requestEditorProposalChanges).not.toHaveBeenCalled()
  })

  it("allows the claiming editor to release the claim", async () => {
    mocked.releaseEditorProposalClaim.mockResolvedValue(undefined)
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Release claim" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm release claim" }))
    await waitFor(() => expect(mocked.releaseEditorProposalClaim).toHaveBeenCalledWith("p-002"))
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

  it("forwards with an editor recommendation and feasibility note without a cadence selector", async () => {
    mocked.forwardEditorProposal.mockResolvedValue(undefined)
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Forward to Board" }))
    fireEvent.changeText(
      await screen.findByLabelText("Editor recommendation"),
      "Ready for Board review.",
    )
    fireEvent.changeText(await screen.findByLabelText("Feasibility note"), "Ready for production.")
    expect(screen.queryByRole("button", { name: "Cadence WEEKLY" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Cadence MONTHLY" })).toBeNull()
    fireEvent.press(screen.getByRole("button", { name: "Confirm forward" }))
    await waitFor(() =>
      expect(mocked.forwardEditorProposal).toHaveBeenCalledWith(
        "p-002",
        {
          editorRecommendation: "Ready for Board review.",
          feasibilityNote: "Ready for production.",
        },
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

  it("displays the saved checklist and submits all six draft values", async () => {
    mocked.updateEditorProposalChecklist.mockResolvedValue(undefined)
    renderScreen(detailFixture)

    expect(await screen.findByText("Editorial checklist")).toBeVisible()
    expect(screen.getByText("3/6 complete")).toBeVisible()
    fireEvent.press(screen.getByRole("checkbox", { name: "Character motivation" }))
    fireEvent.press(screen.getByRole("button", { name: "Save checklist" }))

    await waitFor(() =>
      expect(mocked.updateEditorProposalChecklist).toHaveBeenCalledWith("p-002", {
        hook: true,
        characterMotivation: true,
        audienceFit: true,
        storyboardFlow: false,
        manuscriptQuality: true,
        serializePotential: false,
      }),
    )
  })

  it("shows a claimed-by-another-editor checklist without editable controls", async () => {
    mocked.getEditorProposalDetail.mockResolvedValue({
      ...detailFixture,
      claim: {
        claimedByEditorId: "u-other-editor",
        claimedByEditorName: "Other Editor",
        claimedByMe: false,
      },
    })
    render(
      <TestQueryProvider>
        <EditorProposalDetailScreen proposalId="p-002" />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("Editorial checklist")).toBeVisible()
    expect(screen.getByText("3/6 complete")).toBeVisible()
    expect(screen.queryByRole("checkbox", { name: "Hook" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Save checklist" })).toBeNull()
  })
})

describe("Forward gating on the saved editorial checklist", () => {
  afterEach(() => jest.clearAllMocks())

  it("keeps Forward visible but disabled while the saved checklist is incomplete", async () => {
    renderScreen(detailFixture)

    const forward = await screen.findByRole("button", { name: "Forward to Board" })
    expect(forward).toBeVisible()
    expect(forward.props.accessibilityState.disabled).toBe(true)
    expect(screen.getByText("Complete the checklist first: 3/6.")).toBeVisible()
  })

  it("does not treat unsaved ticks as a complete checklist", async () => {
    renderScreen(detailFixture)

    fireEvent.press(await screen.findByRole("checkbox", { name: "Character motivation" }))
    fireEvent.press(screen.getByRole("checkbox", { name: "Storyboard flow" }))
    fireEvent.press(screen.getByRole("checkbox", { name: "Serialize potential" }))

    expect(screen.getByText("6/6 complete")).toBeVisible()
    expect(screen.getByText("Unsaved changes. Saved checklist is 3/6.")).toBeVisible()
    expect(screen.getByText("Complete the checklist first: 3/6.")).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Forward to Board" }).props.accessibilityState.disabled,
    ).toBe(true)

    fireEvent.press(screen.getByRole("button", { name: "Forward to Board" }))
    expect(screen.queryByRole("button", { name: "Confirm forward" })).toBeNull()
  })

  it("enables Forward once a 6/6 checklist saves successfully", async () => {
    mocked.updateEditorProposalChecklist.mockResolvedValue(undefined)
    mocked.getEditorProposalDetail
      .mockResolvedValueOnce(detailFixture)
      .mockResolvedValue(forwardReadyFixture)
    render(
      <TestQueryProvider>
        <EditorProposalDetailScreen proposalId="p-002" />
      </TestQueryProvider>,
    )

    fireEvent.press(await screen.findByRole("checkbox", { name: "Character motivation" }))
    fireEvent.press(screen.getByRole("checkbox", { name: "Storyboard flow" }))
    fireEvent.press(screen.getByRole("checkbox", { name: "Serialize potential" }))
    fireEvent.press(screen.getByRole("button", { name: "Save checklist" }))

    await waitFor(() =>
      expect(mocked.updateEditorProposalChecklist).toHaveBeenCalledWith("p-002", completeChecklist),
    )
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Forward to Board" }).props.accessibilityState.disabled,
      ).toBe(false),
    )
    expect(screen.queryByText(/Complete the checklist first/)).toBeNull()
  })

  it("keeps the draft and explains the failure when a save fails", async () => {
    mocked.updateEditorProposalChecklist.mockRejectedValue(
      new MobileApiError("This proposal changed. Reload before saving.", 409, "CONFLICT", "req-3"),
    )
    renderScreen(detailFixture)

    fireEvent.press(await screen.findByRole("checkbox", { name: "Character motivation" }))
    fireEvent.press(screen.getByRole("button", { name: "Save checklist" }))

    expect(
      await screen.findByText("This proposal changed. Reload before saving."),
    ).toBeVisible()
    // The draft tick survives the failed save, and Forward stays gated on the
    // last successfully saved checklist.
    expect(screen.getByRole("checkbox", { name: "Character motivation" }).props.accessibilityState.checked).toBe(true)
    expect(screen.getByText("4/6 complete")).toBeVisible()
    expect(screen.getByText("Complete the checklist first: 3/6.")).toBeVisible()
  })

  it("surfaces the backend rejection when a stale client forwards", async () => {
    mocked.forwardEditorProposal.mockRejectedValue(
      new MobileApiError(
        "Complete all six editorial criteria before sending this proposal to the Board.",
        409,
        "EDITORIAL_CHECKLIST_INCOMPLETE",
        "req-8",
      ),
    )
    renderScreen(forwardReadyFixture)

    fireEvent.press(await screen.findByRole("button", { name: "Forward to Board" }))
    fireEvent.changeText(
      await screen.findByLabelText("Editor recommendation"),
      "Ready for Board review.",
    )
    fireEvent.press(screen.getByRole("button", { name: "Confirm forward" }))

    expect(
      await screen.findByText(
        "Complete all six editorial criteria before sending this proposal to the Board.",
      ),
    ).toBeVisible()
  })
})
