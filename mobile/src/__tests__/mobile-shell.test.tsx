import { render, screen } from "@testing-library/react-native"
import { editorTabs, MangaFlowMobileApp } from "@/MangaFlowMobileApp"
import type { MobileAuthSession } from "@/services/mobile-auth"

jest.mock("@/services/mobile-auth", () => {
  const actual = jest.requireActual("@/services/mobile-auth")
  return { ...actual, restoreMobileSession: jest.fn().mockResolvedValue(null) }
})

const editorSessionFixture: MobileAuthSession = {
  user: { id: "u-editor", name: "Tanaka Akira", email: "editor@mangaflow.local", role: "EDITOR" },
  accessToken: "access",
  refreshToken: "refresh",
  role: "editor",
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
  it("uses the authenticated role and never renders a role switch", async () => {
    render(<MangaFlowMobileApp initialSession={editorSessionFixture} />)
    expect(await screen.findByText("Priority")).toBeVisible()
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
    for (const tab of ["Priority", "Reviews", "Publish", "History", "Notifications"]) {
      expect(await screen.findByText(tab)).toBeVisible()
    }
    expect(editorTabs.map(({ id }) => id)).toEqual(["priority", "reviews", "publish", "history", "notifications"])
  })
})
