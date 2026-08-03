import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"
import { mobileAuthStorage } from "@/services/mobile-auth-storage"

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

const originalOS = Platform.OS

describe("mobile auth storage", () => {
  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true })
    jest.clearAllMocks()
  })

  it("uses SecureStore on native", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true })
    await mobileAuthStorage.setRefreshToken("refresh-abc")
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("mangaflow.refreshToken", "refresh-abc")

    await mobileAuthStorage.clearRefreshToken()
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("mangaflow.refreshToken")
  })

  it("uses sessionStorage (not localStorage) on web", async () => {
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true })
    const store = new Map<string, string>()
    const sessionMock = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    }
    Object.defineProperty(globalThis, "sessionStorage", { value: sessionMock, configurable: true })

    await mobileAuthStorage.setRefreshToken("web-token")
    expect(await mobileAuthStorage.getRefreshToken()).toBe("web-token")
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled()

    await mobileAuthStorage.clearRefreshToken()
    expect(await mobileAuthStorage.getRefreshToken()).toBeNull()
  })
})
