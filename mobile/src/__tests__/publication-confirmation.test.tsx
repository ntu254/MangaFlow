import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Platform, ScrollView, StyleSheet } from "react-native"
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
  const originalOS = Platform.OS

  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(2026, 7, 12, 14, 34)))
  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true })
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

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

  it("renders three-row snapping wheels with the centered values selected", () => {
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

    expect(screen.getByTestId("publication-hour-picker")).toHaveProp("snapToInterval", 44)
    expect(screen.getByTestId("publication-hour-picker")).toHaveProp("snapToAlignment", "center")
    expect(screen.getByTestId("publication-hour-picker")).toHaveProp("decelerationRate", "fast")
    expect(screen.getByTestId("publication-hour-picker")).toHaveStyle({ height: 44 * 3 })
    expect(screen.getByTestId("publication-minute-picker")).toHaveProp("snapToInterval", 44)
    expect(screen.getByTestId("publication-minute-picker")).toHaveProp("snapToAlignment", "center")
    expect(screen.getByTestId("publication-minute-picker")).toHaveProp("decelerationRate", "fast")
    expect(screen.getByTestId("publication-minute-picker")).toHaveStyle({ height: 44 * 3 })
    expect(screen.getByRole("button", { name: "Hour 14" })).toHaveProp("accessibilityState", { selected: true })
    expect(screen.getByRole("button", { name: "Minute 34" })).toHaveProp("accessibilityState", { selected: true })
  })

  it("selects hour and minute values from settled wheel offsets", () => {
    jest.setSystemTime(new Date(2026, 7, 12, 9, 5))
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

    fireEvent(screen.getByTestId("publication-hour-picker"), "momentumScrollEnd", {
      nativeEvent: { contentOffset: { y: 44 * 14 } },
    })
    fireEvent(screen.getByTestId("publication-minute-picker"), "momentumScrollEnd", {
      nativeEvent: { contentOffset: { y: 44 * 35 } },
    })

    expect(screen.getByRole("button", { name: "Hour 14" })).toHaveProp("accessibilityState", { selected: true })
    expect(screen.getByRole("button", { name: "Minute 35" })).toHaveProp("accessibilityState", { selected: true })
    expect(screen.getByLabelText("Selected publication time")).toHaveTextContent("Wed, Aug 12 · 14:35")
  })

  it("positions selected values in CSS-snapping web wheels", () => {
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true })
    jest.setSystemTime(new Date(2026, 7, 12, 9, 5))
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(() => undefined)

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

    expect(StyleSheet.flatten(screen.getByTestId("publication-hour-picker").props.style)).toMatchObject({
      scrollSnapType: "y mandatory",
    })
    expect(StyleSheet.flatten(screen.getByRole("button", { name: "Hour 9" }).props.style)).toMatchObject({
      scrollSnapAlign: "center",
    })
    expect(scrollTo).toHaveBeenCalledWith({ y: 44 * 9, animated: false })
    expect(scrollTo).toHaveBeenCalledWith({ y: 44 * 5, animated: false })
  })

  it("settles web scroll events to the nearest selected values", () => {
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true })
    jest.setSystemTime(new Date(2026, 7, 12, 9, 5))
    jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(() => undefined)

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

    const hourPicker = screen.getByTestId("publication-hour-picker")
    const minutePicker = screen.getByTestId("publication-minute-picker")
    expect(hourPicker).toHaveProp("onScroll", expect.any(Function))
    expect(minutePicker).toHaveProp("onScroll", expect.any(Function))

    fireEvent.scroll(hourPicker, { nativeEvent: { contentOffset: { y: 44 * 14.1 } } })
    fireEvent.scroll(minutePicker, { nativeEvent: { contentOffset: { y: 44 * 34.8 } } })
    expect(screen.getByRole("button", { name: "Hour 9" })).toHaveProp("accessibilityState", { selected: true })

    act(() => jest.advanceTimersByTime(150))

    expect(screen.getByRole("button", { name: "Hour 14" })).toHaveProp("accessibilityState", { selected: true })
    expect(screen.getByRole("button", { name: "Minute 35" })).toHaveProp("accessibilityState", { selected: true })
    expect(screen.getByLabelText("Selected publication time")).toHaveTextContent("Wed, Aug 12 · 14:35")
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

  it("explains that scheduling requires the Editor to publish manually once due", () => {
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

    expect(
      screen.getByText(
        "Schedule Echoes for a future date. It does not publish automatically; return here and choose Publish now once the scheduled time is due.",
      ),
    ).toBeVisible()
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
