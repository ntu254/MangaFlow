import { fireEvent, render, screen } from "@testing-library/react-native"
import { PublicationConfirmation } from "@/components/publication-confirmation"
import { formatSelectedSchedule, monthCalendarDates, toScheduledAt } from "@/domain/publication-schedule"
import { colors } from "@/design/tokens"

describe("toScheduledAt", () => {
  it("converts a future local date and time to an ISO timestamp", () => {
    expect(toScheduledAt(new Date(2026, 7, 12), 14, 35, new Date(2026, 7, 12, 14, 34))).toBe(
      new Date(2026, 7, 12, 14, 35).toISOString(),
    )
  })

  it("formats the selected local minute without exposing the UTC payload", () => {
    expect(formatSelectedSchedule(new Date(2026, 7, 12), 14, 35)).toBe("Wed, Aug 12 · 14:35")
  })

  it("aligns month dates beneath Sunday-first weekday headers", () => {
    const cells = monthCalendarDates(new Date(2026, 7, 1))

    expect(cells.slice(0, 6)).toEqual([null, null, null, null, null, null])
    expect(cells[6]?.getDate()).toBe(1)
    expect(cells[6]?.getDay()).toBe(6)
  })

  it("rejects a time in the current minute", () => {
    expect(toScheduledAt(new Date(2026, 7, 12), 14, 34, new Date(2026, 7, 12, 14, 34))).toBeNull()
  })

  it.each([
    [24, 0],
    [-1, 0],
    [14, 60],
    [14, -1],
    [14.5, 0],
    [14, Number.NaN],
  ])("rejects an out-of-range or non-integer time of %s:%s", (hour, minute) => {
    expect(toScheduledAt(new Date(2026, 7, 12), hour, minute, new Date(2026, 7, 12, 0, 0))).toBeNull()
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
    for (const weekday of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
      expect(screen.getByText(weekday)).toBeVisible()
    }
    expect(screen.getByTestId("publication-schedule-scroll")).toBeVisible()
    expect(screen.getByTestId("publication-hour-picker")).toBeVisible()
    expect(screen.getByTestId("publication-minute-picker")).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "August 12, 2026" }))
    fireEvent.press(screen.getByRole("button", { name: "Hour 14" }))
    fireEvent.press(screen.getByRole("button", { name: "Minute 35" }))

    expect(screen.getByLabelText("Selected publication time")).toHaveTextContent("Wed, Aug 12 · 14:35")
    expect(screen.queryByText(new Date(2026, 7, 12, 14, 35).toISOString())).toBeNull()
    fireEvent.press(screen.getByRole("button", { name: "Confirm schedule publication" }))

    expect(onConfirm).toHaveBeenCalledWith({ scheduledAt: new Date(2026, 7, 12, 14, 35).toISOString() })
  })

  it("uses at least 44-pixel targets for calendar and picker controls", () => {
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

    expect(screen.getByRole("button", { name: "Next month" })).toHaveStyle({ minWidth: 44, minHeight: 44 })
    expect(screen.getByRole("button", { name: "August 12, 2026" })).toHaveStyle({ minWidth: 44, minHeight: 44 })
    expect(screen.getByRole("button", { name: "Hour 14" })).toHaveStyle({ minWidth: 44, minHeight: 44 })
    expect(screen.getByRole("button", { name: "Minute 35" })).toHaveStyle({ minWidth: 44, minHeight: 44 })
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

  it("makes immediate public visibility explicit before publishing", () => {
    render(
      <PublicationConfirmation
        visible
        action="PUBLISH"
        chapterTitle="Echoes"
        readinessReady
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    )

    expect(screen.getByRole("header", { name: "Publish now" })).toBeVisible()
    expect(screen.getByText("Publishing Echoes now makes it immediately visible to the public.")).toBeVisible()
  })

  it("keeps postponement a tertiary confirmation action", () => {
    render(
      <PublicationConfirmation
        visible
        action="POSTPONE"
        chapterTitle="Echoes"
        readinessReady
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Confirm postpone publication" })).toHaveStyle({
      minHeight: 44,
      backgroundColor: colors.surfaceContainer,
    })
  })
})
