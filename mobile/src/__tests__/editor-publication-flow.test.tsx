import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { EditorPublishScreen } from "@/screens/editor-publish-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
import * as dataSource from "@/services/editor-mobile-data-source"
import type { EditorChapterDetail } from "@/services/editor-mobile-data-source"

jest.mock("@/services/editor-mobile-data-source", () => ({
  getEditorChapterDetail: jest.fn(),
  requestChapterRevision: jest.fn(),
  rejectChapter: jest.fn(),
  approveChapter: jest.fn(),
  scheduleChapterPublication: jest.fn(),
  postponeChapterPublication: jest.fn(),
  publishChapterNow: jest.fn(),
}))

const mocked = dataSource as jest.Mocked<typeof dataSource>

const readyDetail: EditorChapterDetail = {
  chapter: { id: "ch-4", seriesId: "s-1", title: "Echoes", number: 4, status: "READY_FOR_PUBLICATION", version: 4 },
  series: { id: "s-1", title: "Berserk", editorId: "u-editor" },
  pages: [],
  readiness: { ready: true, items: [] },
  blockers: [],
  evidence: { taskCount: 0, currentSubmissionCount: 0 },
  publication: { status: "DRAFT", scheduledAt: null },
  actions: [
    { action: "SCHEDULE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
    { action: "POSTPONE", enabled: false, disabledReason: "Nothing is scheduled to postpone.", requiresConfirmation: true, requiresReason: false },
    { action: "PUBLISH", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
  ],
}

function renderScreen() {
  mocked.getEditorChapterDetail.mockResolvedValue(readyDetail)
  return render(
    <TestQueryProvider>
      <EditorPublishScreen chapterId="ch-4" />
    </TestQueryProvider>,
  )
}

describe("EditorPublishScreen", () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(2026, 7, 12, 14, 34)))
  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it("disables a past schedule date client-side", async () => {
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Schedule publication" }))
    fireEvent.press(screen.getByRole("button", { name: "Hour 14" }))
    fireEvent.press(screen.getByRole("button", { name: "Minute 34" }))
    expect(screen.getByRole("button", { name: "Confirm schedule publication" })).toBeDisabled()
    expect(mocked.scheduleChapterPublication).not.toHaveBeenCalled()
  })

  it("schedules with a future date", async () => {
    mocked.scheduleChapterPublication.mockResolvedValue(undefined)
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Schedule publication" }))
    fireEvent.press(screen.getByRole("button", { name: "Hour 14" }))
    fireEvent.press(screen.getByRole("button", { name: "Minute 35" }))
    fireEvent.press(screen.getByRole("button", { name: "Confirm schedule publication" }))
    await waitFor(() =>
      expect(mocked.scheduleChapterPublication).toHaveBeenCalledWith(
        "ch-4",
        expect.objectContaining({ scheduledAt: expect.any(String) }),
      ),
    )
  })

  it("publishes now via a high-friction confirmation", async () => {
    mocked.publishChapterNow.mockResolvedValue(undefined)
    renderScreen()
    fireEvent.press(await screen.findByRole("button", { name: "Publish now" }))
    fireEvent.press(await screen.findByRole("button", { name: "Confirm publish now" }))
    await waitFor(() => expect(mocked.publishChapterNow).toHaveBeenCalledWith("ch-4"))
  })
})
