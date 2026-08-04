import * as Clipboard from "expo-clipboard"
import { Platform } from "react-native"
import { canCopyToClipboard, copyToClipboard } from "@/services/mobile-clipboard"

jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }))

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator")
const originalOS = Platform.OS

function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, "navigator", { value, configurable: true, writable: true })
}

describe("mobile clipboard adapter", () => {
  beforeEach(() => {
    jest.mocked(Clipboard.setStringAsync).mockReset().mockResolvedValue(true)
  })

  afterEach(() => {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator)
    else setNavigator(undefined)
    Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true })
  })

  it("offers native copy without a browser navigator", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true })
    setNavigator(undefined)

    expect(canCopyToClipboard()).toBe(true)
    await expect(copyToClipboard("Request ID: req-9")).resolves.toBe(true)
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith("Request ID: req-9")
  })

  it("copies through the browser clipboard on web", async () => {
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true })
    const writeText = jest.fn().mockResolvedValue(undefined)
    setNavigator({ clipboard: { writeText } })

    expect(canCopyToClipboard()).toBe(true)
    await expect(copyToClipboard("Request ID: req-9")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("Request ID: req-9")
  })

  it("reports no clipboard rather than throwing where the platform has none", async () => {
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true })
    setNavigator({})

    expect(canCopyToClipboard()).toBe(false)
    await expect(copyToClipboard("Request ID: req-9")).resolves.toBe(false)
  })

  it("treats a rejected native write as a failed copy", async () => {
    Object.defineProperty(Platform, "OS", { value: "android", configurable: true })
    jest.mocked(Clipboard.setStringAsync).mockRejectedValue(new Error("denied"))

    await expect(copyToClipboard("anything")).resolves.toBe(false)
  })
})
