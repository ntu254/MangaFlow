import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { BoardSessionsScreen } from "@/screens/board-sessions-screen"
import { BoardSessionFormScreen } from "@/screens/board-session-form-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
import * as dataSource from "@/services/board-mobile-data-source"

jest.mock("@/services/board-mobile-data-source", () => ({
  getBoardSessions: jest.fn(),
  getBoardPendingProposals: jest.fn(),
  createBoardSession: jest.fn(),
}))

const mocked = dataSource as jest.Mocked<typeof dataSource>

describe("Board session list and creation", () => {
  afterEach(() => jest.clearAllMocks())

  it("renders backend sessions once and opens the selected session", async () => {
    const onSelect = jest.fn()
    mocked.getBoardSessions.mockResolvedValue([
      {
        id: "vs-1",
        title: "Board meeting",
        status: "OPEN",
        version: 4,
        proposalId: "p-1",
      },
      {
        id: "vs-2",
        title: "Second round",
        status: "FINALIZED",
        version: 2,
        proposalId: "p-2",
      },
    ])

    render(
      <TestQueryProvider>
        <BoardSessionsScreen isChair onSelect={onSelect} onCreate={jest.fn()} />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("Board meeting")).toBeVisible()
    expect(screen.getByText("Second round")).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Open session Board meeting" }))
    expect(onSelect).toHaveBeenCalledWith("vs-1")
  })

  it("creates a session from a backend-eligible proposal instead of a raw id", async () => {
    mocked.getBoardPendingProposals.mockResolvedValue([
      {
        id: "p-004",
        title: "Neon District",
        authorName: "Aiko",
        requestedPublicationType: "WEEKLY",
        currentVersion: "7",
      },
    ])
    mocked.createBoardSession.mockResolvedValue({ id: "vs-new" })

    render(
      <TestQueryProvider>
        <BoardSessionFormScreen />
      </TestQueryProvider>,
    )

    fireEvent.press(await screen.findByRole("radio", { name: "Select Neon District" }))
    fireEvent.press(screen.getByRole("button", { name: "Create session" }))

    await waitFor(() =>
      expect(mocked.createBoardSession).toHaveBeenCalledWith({
        proposalId: "p-004",
        title: "Board meeting",
      }),
    )
  })
})
