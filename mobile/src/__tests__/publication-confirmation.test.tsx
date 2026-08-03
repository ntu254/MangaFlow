import { fireEvent, render, screen } from "@testing-library/react-native"
import { PublicationConfirmation } from "@/components/publication-confirmation"
import { toScheduledAt } from "@/domain/publication-schedule"

describe("toScheduledAt", () => {
  it("converts a future local date and time to an ISO timestamp", () => {
    expect(toScheduledAt(new Date(2026, 7, 12), 14, 35, new Date(2026, 7, 12, 14, 34))).toBe(
      "2026-08-12T07:35:00.000Z",
    )
  })

  it("rejects a time in the current minute", () => {
    expect(toScheduledAt(new Date(2026, 7, 12), 14, 34, new Date(2026, 7, 12, 14, 34))).toBeNull()
  })
})

describe("PublicationConfirmation", () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(2026, 7, 12, 14, 34)))
  afterEach(() => jest.useRealTimers())

  it("selects a calendar day and time with picker controls before scheduling", () => {
    const onConfirm = jest.fn()
    render(
      <PublicationConfirmation
        visible
        action="SCHEDULE"
        chapterTitle="Echoes"
        readinessReady
        onCancel={jest.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText("August 2026")).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "August 12, 2026" }))
    fireEvent.press(screen.getByRole("button", { name: "Hour 14" }))
    fireEvent.press(screen.getByRole("button", { name: "Minute 35" }))

    expect(screen.getByLabelText("Selected publication timestamp")).toHaveTextContent("2026-08-12T07:35:00.000Z")
    fireEvent.press(screen.getByRole("button", { name: "Confirm schedule publication" }))

    expect(onConfirm).toHaveBeenCalledWith({ scheduledAt: "2026-08-12T07:35:00.000Z" })
  })

  it("disables scheduling for the current minute", () => {
    render(
      <PublicationConfirmation
        visible
        action="SCHEDULE"
        chapterTitle="Echoes"
        readinessReady
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    )

    fireEvent.press(screen.getByRole("button", { name: "Hour 14" }))
    fireEvent.press(screen.getByRole("button", { name: "Minute 34" }))

    expect(screen.getByRole("button", { name: "Confirm schedule publication" })).toBeDisabled()
  })
})
