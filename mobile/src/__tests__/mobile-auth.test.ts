import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"
import { logoutMobile, type MobileAuthSession } from "@/services/mobile-auth"
import { mobileApi } from "@/services/mobile-api-client"
import { mobileAuthStorage } from "@/services/mobile-auth-storage"

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

const originalOS = Platform.OS

const sessionFixture: MobileAuthSession = {
  user: { id: "u-editor", name: "Tanaka Akira", email: "editor@mangaflow.local", role: "EDITOR" },
  accessToken: "access-at-login",
  refreshToken: "refresh-at-login",
  role: "editor",
}

describe("logoutMobile", () => {
  beforeEach(() => {
    // Web's sessionStorage branch is simplest to back with a real Map in tests.
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true })
    const store = new Map<string, string>()
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true })
    mobileApi.setAccessToken(null)
    mobileApi.setRefreshHandler(null)
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it("revokes the current stored refresh token, not the one captured at login", async () => {
    // Simulate a refresh having rotated the token after login, before logout.
    await mobileAuthStorage.setRefreshToken("refresh-after-rotation")
    const fetchMock = jest.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await logoutMobile(sessionFixture)

    const [, options] = fetchMock.mock.calls[0]
    expect(JSON.parse(options.body as string)).toMatchObject({ refreshToken: "refresh-after-rotation" })
  })

  it("clears the in-memory access token and the stored refresh token after logging out", async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    mobileApi.setAccessToken("access-at-login")

    await logoutMobile(sessionFixture)

    expect(mobileApi.getAccessToken()).toBeNull()
    expect(await mobileAuthStorage.getRefreshToken()).toBeNull()
  })

  it("does not throw when the server logout call fails, and still clears local state", async () => {
    await mobileAuthStorage.setRefreshToken("refresh-after-rotation")
    mobileApi.setAccessToken("access-at-login")
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network request failed")) as unknown as typeof fetch

    await expect(logoutMobile(sessionFixture)).resolves.toBeUndefined()

    expect(mobileApi.getAccessToken()).toBeNull()
    expect(await mobileAuthStorage.getRefreshToken()).toBeNull()
  })

  it("does nothing when there is no session to log out of", async () => {
    const fetchMock = jest.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await logoutMobile(null)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
