import { act, render, screen, waitFor } from "@testing-library/react-native"
import { MangaFlowMobileApp } from "@/MangaFlowMobileApp"
import { mobileApi } from "@/services/mobile-api-client"
import type { MobileAuthSession } from "@/services/mobile-auth"

jest.mock("@/services/mobile-auth", () => {
  const actual = jest.requireActual("@/services/mobile-auth")
  return { ...actual, restoreMobileSession: jest.fn() }
})

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { restoreMobileSession } = jest.requireMock("@/services/mobile-auth") as {
  restoreMobileSession: jest.Mock
}

const LOGIN_SCREEN_MARKER = "Sign in to review manga work on the move."

const boardSessionFixture: MobileAuthSession = {
  user: { id: "u-board", name: "Board Chair", email: "board@beachread.jp", role: "BOARD", isChair: true },
  accessToken: "restored-access",
  refreshToken: "restored-refresh",
  role: "board",
}

describe("MangaFlowMobileApp cold start", () => {
  afterEach(() => {
    jest.clearAllMocks()
    mobileApi.setSessionExpiredHandler(null)
  })

  it("resumes a valid stored session without ever showing the login screen", async () => {
    restoreMobileSession.mockResolvedValue(boardSessionFixture)

    render(<MangaFlowMobileApp />)

    expect(await screen.findByText("Today")).toBeVisible()
    expect(screen.queryByText(LOGIN_SCREEN_MARKER)).toBeNull()
  })

  it("falls through to the login screen when there is no valid stored session", async () => {
    restoreMobileSession.mockResolvedValue(null)

    render(<MangaFlowMobileApp />)

    expect(await screen.findByText(LOGIN_SCREEN_MARKER)).toBeVisible()
  })

  it("never calls restoreMobileSession when a session is already provided", () => {
    render(<MangaFlowMobileApp initialSession={boardSessionFixture} />)

    expect(restoreMobileSession).not.toHaveBeenCalled()
  })
})

describe("MangaFlowMobileApp session expiry", () => {
  afterEach(() => {
    jest.clearAllMocks()
    mobileApi.setSessionExpiredHandler(null)
  })

  it("signs the user out to the login screen when a live request's refresh cannot renew the session", async () => {
    render(<MangaFlowMobileApp initialSession={boardSessionFixture} />)
    expect(await screen.findByText("Today")).toBeVisible()

    // Simulate a background 401 whose refresh attempt failed, exactly as
    // mobile-api-client's refreshOnce() reports it.
    const handler = mobileApi.getSessionExpiredHandler()
    expect(handler).not.toBeNull()
    act(() => handler?.())

    await waitFor(() => expect(screen.getByText(LOGIN_SCREEN_MARKER)).toBeVisible())
  })
})
