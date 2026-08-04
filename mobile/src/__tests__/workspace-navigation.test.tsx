import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import type { UseQueryResult } from "@tanstack/react-query"
import { BackHandler } from "react-native"
import { EditorWorkspace } from "@/screens/editor-workspace"
import { BoardWorkspace } from "@/screens/board-workspace"
import { TestQueryProvider } from "@/test/test-query-provider"
import * as editorDataSource from "@/services/editor-mobile-data-source"
import * as boardDataSource from "@/services/board-mobile-data-source"
import type { EditorProposalDetail } from "@/services/editor-mobile-data-source"
import type { BoardSessionDetail } from "@/services/board-mobile-data-source"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"

jest.mock("@/services/editor-mobile-data-source", () => ({
  getEditorProposalDetail: jest.fn(),
  claimEditorProposal: jest.fn(),
  releaseEditorProposalClaim: jest.fn(),
  requestEditorProposalChanges: jest.fn(),
  rejectEditorProposal: jest.fn(),
  forwardEditorProposal: jest.fn(),
  updateEditorProposalChecklist: jest.fn(),
}))

jest.mock("@/services/board-mobile-data-source", () => ({
  getBoardSessionDetail: jest.fn(),
  castBoardVote: jest.fn(),
  closeBoardSession: jest.fn(),
  cancelBoardSession: jest.fn(),
  createBoardSession: jest.fn(),
  updateBoardSession: jest.fn(),
  getBoardRankings: jest.fn(),
  getBoardDecisionHistory: jest.fn(),
}))

const mockedEditorDataSource = editorDataSource as jest.Mocked<typeof editorDataSource>
const mockedBoardDataSource = boardDataSource as jest.Mocked<typeof boardDataSource>

function inboxQuery(data: MobileInbox): UseQueryResult<MobileInbox, Error> {
  return {
    data,
    error: null,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as UseQueryResult<MobileInbox, Error>
}

function proposalWorkItem(): MobileWorkItem {
  return {
    id: "PROPOSAL_REVIEW:p-001",
    kind: "PROPOSAL_REVIEW",
    entityType: "PROPOSAL",
    entityId: "p-001",
    status: "EDITOR_REVIEW",
    version: 1,
    title: "Neon District",
    subtitle: "Manuscript v2",
    priority: { level: "HIGH", reason: "Revision received", dueAt: null },
    blockers: [],
    actions: [],
    summary: {},
  }
}

const proposalDetailFixture: EditorProposalDetail = {
  proposal: {
    id: "p-001",
    title: "Neon District",
    status: "EDITOR_REVIEWING",
    synopsis: "",
    logline: "",
    targetAudience: "SEINEN",
    genres: [],
    requestedPublicationType: "MONTHLY",
  },
  claim: { claimedByEditorId: null, claimedByEditorName: null, claimedByMe: false },
  currentManuscript: null,
  version: 1,
  history: [],
  editorialChecklist: {
    hook: false,
    characterMotivation: false,
    audienceFit: false,
    storyboardFlow: false,
    manuscriptQuality: false,
    serializePotential: false,
  },
  actions: [],
}

describe("EditorWorkspace hardware back", () => {
  afterEach(() => jest.restoreAllMocks())

  it("pops the open proposal detail on hardware back instead of exiting the app", async () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, "addEventListener")
    mockedEditorDataSource.getEditorProposalDetail.mockResolvedValue(proposalDetailFixture)
    const inbox: MobileInbox = { role: "EDITOR", generatedAt: new Date().toISOString(), items: [proposalWorkItem()] }

    render(
      <TestQueryProvider>
        <EditorWorkspace tab="reviews" inbox={inboxQuery(inbox)} />
      </TestQueryProvider>,
    )
    fireEvent.press(await screen.findByRole("button", { name: /open Neon District/i }))
    expect(await screen.findByText("‹ Back")).toBeVisible()

    let handled: boolean | null | undefined
    act(() => {
      handled = addEventListenerSpy.mock.calls.at(-1)?.[1]?.()
    })

    expect(handled).toBe(true)
    await waitFor(() => expect(screen.queryByText("‹ Back")).toBeNull())
  })

  it("lets hardware back fall through to the OS default at the list root", async () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, "addEventListener")
    const inbox: MobileInbox = { role: "EDITOR", generatedAt: new Date().toISOString(), items: [proposalWorkItem()] }
    render(
      <TestQueryProvider>
        <EditorWorkspace tab="reviews" inbox={inboxQuery(inbox)} />
      </TestQueryProvider>,
    )
    await screen.findByRole("button", { name: /open Neon District/i })

    expect(addEventListenerSpy.mock.calls.at(-1)?.[1]?.()).toBe(false)
  })
})

const boardSessionWorkItem: MobileWorkItem = {
  id: "BOARD_VOTE:vs-1",
  kind: "BOARD_VOTE",
  entityType: "VOTING_SESSION",
  entityId: "vs-1",
  status: "OPEN",
  version: 3,
  title: "Weekly slate",
  subtitle: "Round 1",
  priority: { level: "HIGH", reason: "Open for your vote", dueAt: null },
  blockers: [],
  actions: [],
  summary: {},
}

const atRiskWorkItemMissingSeriesId: MobileWorkItem = {
  id: "AT_RISK:rk-1",
  kind: "AT_RISK",
  entityType: "RANKING",
  entityId: "rk-1",
  status: "AT_RISK",
  version: null,
  title: "Neon District",
  subtitle: "Rank 8 · reader score 41",
  priority: { level: "HIGH", reason: "Ranking flagged this series", dueAt: null },
  blockers: [],
  actions: [],
  summary: {},
}

const boardSessionDetailFixture: BoardSessionDetail = {
  session: {
    id: "vs-1",
    title: "Weekly slate",
    status: "OPEN",
    version: 3,
    proposalId: "p-004",
    reVoteOfSessionId: null,
    isReVote: false,
    votingRound: 1,
    tiePolicy: "CHAIR_DECIDES",
    tieResolution: "PENDING",
  },
  proposal: { id: "p-004", title: "Neon District", status: "BOARD_REVIEW" },
  tally: { approve: 2, reject: 0, total: 2, quorum: 3, eligible: 5, canFinalize: false },
  myVote: null,
  actions: [
    { action: "VOTE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
  ],
}

describe("BoardWorkspace hardware back", () => {
  afterEach(() => jest.restoreAllMocks())

  it("pops the open session detail on hardware back instead of exiting the app", async () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, "addEventListener")
    mockedBoardDataSource.getBoardSessionDetail.mockResolvedValue(boardSessionDetailFixture)
    const inbox: MobileInbox = { role: "BOARD", generatedAt: new Date().toISOString(), items: [boardSessionWorkItem] }

    render(
      <TestQueryProvider>
        <BoardWorkspace tab="today" inbox={inboxQuery(inbox)} isChair={false} />
      </TestQueryProvider>,
    )
    fireEvent.press(await screen.findByRole("button", { name: /open Weekly slate/i }))
    expect(await screen.findByText("‹ Back")).toBeVisible()

    let handled: boolean | null | undefined
    act(() => {
      handled = addEventListenerSpy.mock.calls.at(-1)?.[1]?.()
    })

    expect(handled).toBe(true)
    await waitFor(() => expect(screen.queryByText("‹ Back")).toBeNull())
  })
})

describe("BoardWorkspace dead-tap feedback", () => {
  afterEach(() => jest.restoreAllMocks())

  it("does not render at-risk inbox work on the Board today queue", async () => {
    const inbox: MobileInbox = {
      role: "BOARD",
      generatedAt: new Date().toISOString(),
      items: [atRiskWorkItemMissingSeriesId],
    }
    render(
      <TestQueryProvider>
        <BoardWorkspace tab="today" inbox={inboxQuery(inbox)} isChair />
      </TestQueryProvider>,
    )
    expect(await screen.findByText("No Board decisions need your attention.")).toBeVisible()
    expect(screen.queryByText("At Risk")).toBeNull()
    expect(screen.queryByRole("button", { name: /review at-risk/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /open Neon District/i })).toBeNull()
  })
})
