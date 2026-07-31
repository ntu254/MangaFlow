import { render, screen } from "@testing-library/react-native"
import { EditorHistoryScreen } from "@/screens/editor-history-screen"
import { TestQueryProvider } from "@/test/test-query-provider"
import * as dataSource from "@/services/editor-mobile-data-source"

jest.mock("@/services/editor-mobile-data-source", () => ({
  getEditorHistory: jest.fn(),
}))

const mocked = dataSource as jest.Mocked<typeof dataSource>

describe("EditorHistoryScreen", () => {
  afterEach(() => jest.clearAllMocks())

  it("renders read-only backend activity", async () => {
    mocked.getEditorHistory.mockResolvedValue([
      {
        id: "p-1",
        label: "Neon District: PENDING_BOARD",
        createdAt: "2026-07-30T09:00:00.000Z",
      },
    ])

    render(
      <TestQueryProvider>
        <EditorHistoryScreen />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("Neon District: PENDING_BOARD")).toBeVisible()
    expect(screen.getByText("Backend")).toBeVisible()
    expect(screen.getByText("Read only")).toBeVisible()
  })
})
