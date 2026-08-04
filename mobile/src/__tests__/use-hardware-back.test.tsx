import { render } from "@testing-library/react-native"
import { BackHandler } from "react-native"
import { useHardwareBackToClose } from "@/hooks/use-hardware-back"

function Host({ isOpen, onBack }: { isOpen: boolean; onBack: () => void }) {
  useHardwareBackToClose(isOpen, onBack)
  return null
}

describe("useHardwareBackToClose", () => {
  afterEach(() => jest.restoreAllMocks())

  it("consumes the back press and closes the open detail", () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, "addEventListener")
    const onBack = jest.fn()
    render(<Host isOpen onBack={onBack} />)

    const handler = addEventListenerSpy.mock.calls.at(-1)?.[1]
    const handled = handler?.()

    expect(handled).toBe(true)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("lets the press fall through to the OS default when nothing is open", () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, "addEventListener")
    const onBack = jest.fn()
    render(<Host isOpen={false} onBack={onBack} />)

    const handler = addEventListenerSpy.mock.calls.at(-1)?.[1]
    const handled = handler?.()

    expect(handled).toBe(false)
    expect(onBack).not.toHaveBeenCalled()
  })

  it("re-registers when isOpen flips, so a stale closure never fires onBack after closing", () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, "addEventListener")
    const onBack = jest.fn()
    const { rerender } = render(<Host isOpen onBack={onBack} />)
    rerender(<Host isOpen={false} onBack={onBack} />)

    const latestHandler = addEventListenerSpy.mock.calls.at(-1)?.[1]
    const handled = latestHandler?.()

    expect(handled).toBe(false)
    expect(onBack).not.toHaveBeenCalled()
  })

  it("removes its subscription on unmount", () => {
    const removeSpy = jest.fn()
    jest.spyOn(BackHandler, "addEventListener").mockReturnValue({ remove: removeSpy })
    const { unmount } = render(<Host isOpen onBack={jest.fn()} />)

    unmount()

    expect(removeSpy).toHaveBeenCalledTimes(1)
  })
})
