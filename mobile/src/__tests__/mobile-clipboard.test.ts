import { canCopyToClipboard, copyToClipboard } from "@/services/mobile-clipboard"

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator")

function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, "navigator", { value, configurable: true, writable: true })
}

describe("mobile clipboard adapter", () => {
  afterEach(() => {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator)
    else setNavigator(undefined)
  })

  it("copies through the platform clipboard when one exists", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    setNavigator({ clipboard: { writeText } })

    expect(canCopyToClipboard()).toBe(true)
    await expect(copyToClipboard("Request ID: req-9")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("Request ID: req-9")
  })

  it("reports no clipboard rather than throwing where the platform has none", async () => {
    setNavigator({})

    expect(canCopyToClipboard()).toBe(false)
    await expect(copyToClipboard("Request ID: req-9")).resolves.toBe(false)
  })

  it("treats a rejected write as a failed copy", async () => {
    setNavigator({ clipboard: { writeText: jest.fn().mockRejectedValue(new Error("denied")) } })

    await expect(copyToClipboard("anything")).resolves.toBe(false)
  })
})
