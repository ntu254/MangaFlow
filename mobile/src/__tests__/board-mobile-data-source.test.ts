import { getBoardSessionDetail } from "@/services/board-mobile-data-source"
import { mobileApi } from "@/services/mobile-api-client"

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), { status: 200 })
}

const validDetailPayload = {
  session: {
    id: "vs-1",
    title: "Weekly slate",
    status: "OPEN",
    version: 3,
    proposalId: "p-004",
    proposalVersionId: null,
    reVoteOfSessionId: null,
    isReVote: false,
    votingRound: 1,
    tiePolicy: "CHAIR_DECIDES",
    tieResolution: "PENDING",
    scheduledFor: null,
    closesAt: null,
  },
  proposal: {
    id: "p-004",
    title: "Neon District",
    status: "BOARD_REVIEW",
    version: 2,
    editorRecommendation: null,
    requestedPublicationType: "WEEKLY",
  },
  tally: { approve: 2, reject: 0, total: 2, quorum: 3, eligible: 5, canFinalize: false },
  myVote: null,
  currentUserVote: null,
  previousRound: null,
  notes: [],
  actions: [
    { action: "VOTE", enabled: true, disabledReason: null, requiresConfirmation: true, requiresReason: false },
  ],
}

const validRawSession = { id: "vs-1", title: "Weekly slate", status: "OPEN" }

function mockFetchFor(detailPayload: unknown) {
  return jest.fn().mockImplementation((url: string) =>
    Promise.resolve(
      String(url).includes("/detail") ? jsonResponse(detailPayload) : jsonResponse(validRawSession),
    ),
  ) as unknown as typeof fetch
}

describe("getBoardSessionDetail contract validation", () => {
  afterEach(() => {
    mobileApi.setAccessToken(null)
    jest.restoreAllMocks()
  })

  it("resolves a well-formed session detail response", async () => {
    mobileApi.setAccessToken("access-123")
    globalThis.fetch = mockFetchFor(validDetailPayload)

    const detail = await getBoardSessionDetail("vs-1")

    expect(detail.session.version).toBe(3)
    expect(detail.tally.quorum).toBe(3)
  })

  it("rejects instead of silently returning session.version as undefined when the field is missing", async () => {
    mobileApi.setAccessToken("access-123")
    const { version, ...sessionWithoutVersion } = validDetailPayload.session
    globalThis.fetch = mockFetchFor({ ...validDetailPayload, session: sessionWithoutVersion })

    await expect(getBoardSessionDetail("vs-1")).rejects.toThrow()
  })

  it("rejects a tally with a non-numeric field instead of letting a bad Chair finalize decision through", async () => {
    mobileApi.setAccessToken("access-123")
    globalThis.fetch = mockFetchFor({
      ...validDetailPayload,
      tally: { ...validDetailPayload.tally, quorum: "three" },
    })

    await expect(getBoardSessionDetail("vs-1")).rejects.toThrow()
  })

  it("rejects an action descriptor missing enabled instead of defaulting it silently", async () => {
    mobileApi.setAccessToken("access-123")
    globalThis.fetch = mockFetchFor({
      ...validDetailPayload,
      actions: [{ action: "VOTE", disabledReason: null, requiresConfirmation: true, requiresReason: false }],
    })

    await expect(getBoardSessionDetail("vs-1")).rejects.toThrow()
  })
})
