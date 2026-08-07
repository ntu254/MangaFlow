import { render, screen } from "@testing-library/react-native"
import { FlatList, ScrollView } from "react-native"
import { editorTabs, MangaFlowMobileApp } from "@/MangaFlowMobileApp"
import { BoardRankingScreen } from "@/screens/board-ranking-screen"
import type { MobileAuthSession } from "@/services/mobile-auth"
import { TestQueryProvider } from "@/test/test-query-provider"
import * as boardDataSource from "@/services/board-mobile-data-source"
import * as inboxDataSource from "@/services/mobile-inbox-data-source"

jest.mock("@/services/mobile-auth", () => {
  const actual = jest.requireActual("@/services/mobile-auth")
  return { ...actual, restoreMobileSession: jest.fn().mockResolvedValue(null) }
})

jest.mock("@/services/board-mobile-data-source", () => ({
  getBoardRankings: jest.fn(),
}))

jest.mock("@/services/mobile-inbox-data-source", () => {
  const actual = jest.requireActual("@/services/mobile-inbox-data-source")
  return { ...actual, getMobileInbox: jest.fn() }
})

const mockedBoardDataSource = boardDataSource as jest.Mocked<typeof boardDataSource>
const mockedInboxDataSource = inboxDataSource as jest.Mocked<typeof inboxDataSource>

const editorSessionFixture: MobileAuthSession = {
  user: { id: "u-editor", name: "Tanaka Akira", email: "editor@mangaflow.local", role: "EDITOR" },
  accessToken: "access",
  refreshToken: "refresh",
  role: "editor",
}

const boardSession: MobileAuthSession = {
  user: { id: "u-board", name: "Board Chair", email: "board@mangaflow.local", role: "BOARD", isChair: true },
  accessToken: "access",
  refreshToken: "refresh",
  role: "board",
}

const boardInbox = {
  role: "BOARD" as const,
  generatedAt: "2026-08-05T00:00:00.000Z",
  items: [{
    id: "vs-1",
    kind: "BOARD_VOTE" as const,
    entityType: "VOTING_SESSION" as const,
    entityId: "vs-1",
    status: "OPEN",
    version: 3,
    title: "Weekly slate",
    subtitle: "Round 1",
    priority: { level: "HIGH" as const, reason: "Open for your vote", dueAt: null },
    blockers: [],
    actions: [],
    summary: {},
  }],
}

describe("MangaFlowMobileApp login screen demo accounts", () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__

  afterEach(() => {
    ;(global as { __DEV__?: boolean }).__DEV__ = originalDev
  })

  it("offers one-tap demo accounts in a development build", async () => {
    ;(global as { __DEV__?: boolean }).__DEV__ = true
    render(<MangaFlowMobileApp />)
    expect(await screen.findByText("API demo accounts")).toBeVisible()
  })

  it("never ships a one-tap login into a live account in a production build", async () => {
    ;(global as { __DEV__?: boolean }).__DEV__ = false
    render(<MangaFlowMobileApp />)
    expect(await screen.findByText("Sign in to review manga work on the move.")).toBeVisible()
    expect(screen.queryByText("API demo accounts")).toBeNull()
    expect(screen.queryByText("Board Demo")).toBeNull()
  })
})

describe("MangaFlowMobileApp shell", () => {
  beforeEach(() => {
    mockedInboxDataSource.getMobileInbox.mockImplementation(async (role) => ({
      role: role === "board" ? "BOARD" : "EDITOR",
      generatedAt: "2026-08-05T00:00:00.000Z",
      items: [],
    }))
  })

  afterEach(() => jest.clearAllMocks())

  it("does not wrap TodayQueue in a vertical ScrollView", async () => {
    mockedInboxDataSource.getMobileInbox.mockResolvedValue(boardInbox)
    render(<MangaFlowMobileApp initialSession={boardSession} />)

    expect(await screen.findByRole("button", { name: /open weekly slate/i })).toBeVisible()
    expect(screen.UNSAFE_getAllByType(FlatList)).toHaveLength(1)
    // The one ScrollView is FlatList's own virtualized scroll implementation;
    // a second instance would be MFScreen wrapping TodayQueue.
    expect(screen.UNSAFE_getAllByType(ScrollView)).toHaveLength(1)
  })

  it("gives Board Ranking its own scroll surface", async () => {
    mockedBoardDataSource.getBoardRankings.mockResolvedValue({ generatedAt: "2026-08-05T00:00:00.000Z", items: [] })

    render(
      <TestQueryProvider>
        <BoardRankingScreen />
      </TestQueryProvider>,
    )

    expect(await screen.findByText("Ranking")).toBeVisible()
    expect(screen.UNSAFE_getAllByType(ScrollView)).toHaveLength(1)
  })

  it("uses the authenticated role and never renders a role switch", async () => {
    render(<MangaFlowMobileApp initialSession={editorSessionFixture} />)
    expect(await screen.findByText("Home")).toBeVisible()
    expect(screen.getByText("Tantou Editor")).toBeVisible()
    expect(screen.queryByText("Board Demo")).toBeNull()
    expect(screen.queryByRole("button", { name: /switch role/i })).toBeNull()
  })

  it("labels explicit demo mode", () => {
    render(<MangaFlowMobileApp initialSession={editorSessionFixture} forceDemoMode />)
    expect(screen.getByText("Demo data")).toBeVisible()
  })

  it("shows the canonical Editor tabs", async () => {
    render(<MangaFlowMobileApp initialSession={editorSessionFixture} />)
    for (const tab of ["Home", "Reviews", "Publish", "History", "Notifications"]) {
      expect((await screen.findAllByText(tab))[0]).toBeVisible()
    }
    expect(editorTabs.map(({ id }) => id)).toEqual(["priority", "reviews", "publish", "history", "notifications"])
  })
})
