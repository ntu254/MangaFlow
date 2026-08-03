import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { EditorChapterDetailScreen } from "@/screens/editor-chapter-detail-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
import * as dataSource from "@/services/editor-mobile-data-source"
import type { EditorChapterDetail } from "@/services/editor-mobile-data-source"

jest.mock("@/services/editor-mobile-data-source", () => ({
  getEditorChapterDetail: jest.fn(),
  requestChapterRevision: jest.fn(),
  rejectChapter: jest.fn(),
  approveChapter: jest.fn(),
}))

const mocked = dataSource as jest.Mocked<typeof dataSource>

const blockedDetail: EditorChapterDetail = {
  chapter: { id: "ch-1", seriesId: "s-1", title: "Old Wound", number: 5, status: "TANTOU_REVIEW", version: 5 },
  series: { id: "s-1", title: "Berserk", editorId: "u-editor" },
  pages: [{ id: "pg-1", pageNumber: 1, status: "APPROVED" }],
  readiness: {
    ready: false,
    items: [{ key: "allCommentsResolved", passed: false, reason: "Every blocking comment must be verified as RESOLVED." }],
  },
  blockers: [{ id: "c-1", status: "ADDRESSED", body: "Fix the balloon.", targetType: "PAGE", targetId: "pg-1" }],
  evidence: { taskCount: 3, currentSubmissionCount: 2 },
  publication: null,
  actions: [
    { action: "REQUEST_REVISION", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: true },
    { action: "REJECT", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: true },
    { action: "EDITOR_APPROVE", enabled: false, disabledReason: "Every blocking comment must be verified as RESOLVED.", requiresConfirmation: true, requiresReason: false },
  ],
}

function renderScreen(detail: EditorChapterDetail = blockedDetail) {
  mocked.getEditorChapterDetail.mockResolvedValue(detail)
  return render(
    <TestQueryProvider>
      <EditorChapterDetailScreen chapterId="ch-1" />
    </TestQueryProvider>,
  )
}

describe("EditorChapterDetailScreen", () => {
  afterEach(() => jest.clearAllMocks())

  it("shows backend readiness evidence without recomputing", async () => {
    renderScreen()
    expect(await screen.findByText("Readiness · Blocked")).toBeVisible()
    expect(
      screen.getAllByText("Every blocking comment must be verified as RESOLVED.").length,
    ).toBeGreaterThanOrEqual(1)
  })

  it("keeps EDITOR_APPROVE disabled with the backend reason", async () => {
    renderScreen()
    const approve = await screen.findByRole("button", { name: "Approve chapter" })
    expect(approve).toBeDisabled()
    // Reason is shown beside the disabled action.
    expect(
      screen.getAllByText("Every blocking comment must be verified as RESOLVED.").length,
    ).toBeGreaterThanOrEqual(1)
  })

  it("requires a reason before requesting revision", async () => {
    mocked.requestChapterRevision.mockResolvedValue(undefined)
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Request revision" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm request revision" }))
    expect(await screen.findByText("Reason is required.")).toBeVisible()
    expect(mocked.requestChapterRevision).not.toHaveBeenCalled()

    fireEvent.changeText(screen.getByLabelText("Reason"), "Redraw page 3.")
    fireEvent.press(screen.getByRole("button", { name: "Confirm request revision" }))
    await waitFor(() =>
      expect(mocked.requestChapterRevision).toHaveBeenCalledWith("ch-1", { comment: "Redraw page 3." }),
    )
  })
})
