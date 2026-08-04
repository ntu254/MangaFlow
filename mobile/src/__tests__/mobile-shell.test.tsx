import { render, screen } from "@testing-library/react-native"
import { editorTabs, MangaFlowMobileApp } from "@/MangaFlowMobileApp"
import type { MobileAuthSession } from "@/services/mobile-auth"

const editorSessionFixture: MobileAuthSession = {
  user: { id: "u-editor", name: "Tanaka Akira", email: "editor@mangaflow.local", role: "EDITOR" },
  accessToken: "access",
  refreshToken: "refresh",
  role: "editor",
}

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
