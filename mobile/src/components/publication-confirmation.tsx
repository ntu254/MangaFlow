import { useEffect, useRef, useState } from "react"
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle } from "react-native"
import { colors, radius, spacing, typography } from "@/design/tokens"
import { formatSelectedSchedule, monthCalendarDates, toScheduledAt } from "@/domain/publication-schedule"

export type PublicationAction = "SCHEDULE" | "POSTPONE" | "PUBLISH"

const TITLES: Record<PublicationAction, string> = {
  SCHEDULE: "Schedule publication",
  POSTPONE: "Postpone publication",
  PUBLISH: "Publish now",
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute)
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const WHEEL_ITEM_HEIGHT = 44
const WEB_SCROLL_SETTLE_MS = 120
const webWheelStyle = { scrollSnapType: "y mandatory" } as unknown as ViewStyle
const webWheelOptionStyle = { scrollSnapAlign: "center" } as unknown as ViewStyle

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function TimeWheel({
  label,
  values,
  selectedValue,
  onSelect,
}: {
  label: "Hour" | "Minute"
  values: number[]
  selectedValue: number
  onSelect: (value: number) => void
}) {
  const scrollRef = useRef<ScrollView>(null)
  const webSettleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedIndex = values.indexOf(selectedValue)

  useEffect(() => {
    if (Platform.OS === "web") {
      scrollRef.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_HEIGHT, animated: false })
    }
  }, [selectedIndex])

  useEffect(
    () => () => {
      if (webSettleTimer.current) clearTimeout(webSettleTimer.current)
    },
    [],
  )

  const selectOffset = (offsetY: number) => {
    const index = Math.min(values.length - 1, Math.max(0, Math.round(offsetY / WHEEL_ITEM_HEIGHT)))
    onSelect(values[index])
    return index
  }

  const settleWebScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y
    if (webSettleTimer.current) clearTimeout(webSettleTimer.current)
    webSettleTimer.current = setTimeout(() => {
      const index = selectOffset(offsetY)
      scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: false })
    }, WEB_SCROLL_SETTLE_MS)
  }

  return (
    <View style={styles.wheelGroup}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <ScrollView
        ref={scrollRef}
        testID={`publication-${label.toLowerCase()}-picker`}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={[styles.wheel, Platform.OS === "web" && webWheelStyle]}
        contentOffset={Platform.OS === "web" ? undefined : { x: 0, y: selectedIndex * WHEEL_ITEM_HEIGHT }}
        snapToInterval={Platform.OS === "web" ? undefined : WHEEL_ITEM_HEIGHT}
        snapToAlignment={Platform.OS === "web" ? undefined : "center"}
        decelerationRate={Platform.OS === "web" ? undefined : "fast"}
        scrollEventThrottle={Platform.OS === "web" ? 16 : undefined}
        onScroll={Platform.OS === "web" ? settleWebScroll : undefined}
        onMomentumScrollEnd={
          Platform.OS === "web"
            ? undefined
            : (event: NativeSyntheticEvent<NativeScrollEvent>) => selectOffset(event.nativeEvent.contentOffset.y)
        }
      >
        <View style={styles.wheelPaddingRow} />
        {values.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${value}`}
            accessibilityState={{ selected: selectedValue === value }}
            onPress={() => onSelect(value)}
            style={[styles.option, Platform.OS === "web" && webWheelOptionStyle, selectedValue === value && styles.selectedOption]}
          >
            <Text style={[styles.optionText, selectedValue === value && styles.selectedOptionText]}>{String(value).padStart(2, "0")}</Text>
          </Pressable>
        ))}
        <View style={styles.wheelPaddingRow} />
      </ScrollView>
    </View>
  )
}

// High-friction publication confirmation. SCHEDULE requires a future date and
// validates it client-side before the request; PUBLISH names the chapter and
// its visibility effect.
export function PublicationConfirmation({
  visible,
  action,
  chapterTitle,
  readinessReady,
  submitting = false,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  visible: boolean
  action: PublicationAction | null
  chapterTitle: string
  readinessReady: boolean
  submitting?: boolean
  errorMessage?: string | null
  onCancel: () => void
  onConfirm: (payload: { scheduledAt?: string }) => void
}) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [hour, setHour] = useState(() => new Date().getHours())
  const [minute, setMinute] = useState(() => new Date().getMinutes())
  const [localError, setLocalError] = useState<string | null>(null)

  if (!action) return null

  const confirm = () => {
    if (action === "SCHEDULE") {
      const scheduledAt = toScheduledAt(selectedDate, hour, minute, new Date())
      if (!scheduledAt) {
        setLocalError("Scheduled time must be a future date.")
        return
      }
      setLocalError(null)
      onConfirm({ scheduledAt })
      return
    }
    setLocalError(null)
    onConfirm({})
  }

  const effect =
    action === "PUBLISH"
      ? `Publishing ${chapterTitle} now makes it immediately visible to the public.`
      : action === "SCHEDULE"
        ? `Schedule ${chapterTitle} for a future date. It does not publish automatically; return here and choose Publish now once the scheduled time is due.`
        : `Postpone the scheduled publication of ${chapterTitle}.`
  const readiness = action === "PUBLISH" ? `Backend readiness is currently ${readinessReady ? "ready" : "not ready"}.` : null
  const scheduledAt = action === "SCHEDULE" ? toScheduledAt(selectedDate, hour, minute, new Date()) : null
  const selectedSchedule = formatSelectedSchedule(selectedDate, hour, minute)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text accessibilityRole="header" style={styles.title}>
            {TITLES[action]}
          </Text>
          <Text style={styles.body}>{effect}</Text>
          {readiness ? <Text style={styles.readiness}>{readiness}</Text> : null}
          {action === "SCHEDULE" ? (
            <ScrollView testID="publication-schedule-scroll" style={styles.scheduler} contentContainerStyle={styles.schedulerContent} nestedScrollEnabled>
              <View style={styles.monthHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                  style={styles.calendarNavTarget}
                >
                  <Text style={styles.pickerLabel}>‹</Text>
                </Pressable>
                <Text style={styles.monthTitle}>{visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                  style={styles.calendarNavTarget}
                >
                  <Text style={styles.pickerLabel}>›</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarCanvas}>
                <View>
                  <View style={styles.weekdayRow}>
                    {WEEKDAYS.map((weekday) => (
                      <Text key={weekday} style={styles.weekday}>{weekday}</Text>
                    ))}
                  </View>
                  <View style={styles.dayGrid}>
                    {monthCalendarDates(visibleMonth).map((day, index) => {
                      if (!day) return <View key={`empty-${index}`} style={styles.dayPlaceholder} />
                      const selected = day.toDateString() === selectedDate.toDateString()
                      return (
                        <Pressable
                          key={day.toISOString()}
                          accessibilityRole="button"
                          accessibilityLabel={dayLabel(day)}
                          accessibilityState={{ selected }}
                          onPress={() => setSelectedDate(day)}
                          style={[styles.day, selected && styles.selectedOption]}
                        >
                          <Text style={[styles.dayText, selected && styles.selectedOptionText]}>{day.getDate()}</Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              </ScrollView>
              <View style={styles.timePickerRow}>
                <TimeWheel label="Hour" values={HOURS} selectedValue={hour} onSelect={setHour} />
                <TimeWheel label="Minute" values={MINUTES} selectedValue={minute} onSelect={setMinute} />
              </View>
              <Text accessibilityLabel="Selected publication time" style={styles.selectedTimestamp}>
                {selectedSchedule}
              </Text>
              {!scheduledAt ? <Text style={styles.futureHint}>Choose a future publication time.</Text> : null}
            </ScrollView>
          ) : null}
          {localError || errorMessage ? (
            <Text style={styles.error}>{localError ?? errorMessage}</Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onCancel}
              style={[styles.button, styles.cancel]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Confirm ${TITLES[action].toLowerCase()}`}
              disabled={submitting || (action === "SCHEDULE" && !scheduledAt)}
              onPress={confirm}
              style={[
                styles.button,
                styles.confirm,
                action === "POSTPONE" && styles.tertiaryConfirm,
                (submitting || (action === "SCHEDULE" && !scheduledAt)) && styles.disabled,
              ]}
            >
              <Text style={[styles.confirmText, action === "POSTPONE" && styles.tertiaryConfirmText]}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(29,26,33,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: typography.title, fontWeight: "700", color: colors.text },
  body: { fontSize: typography.body, color: colors.textMuted },
  readiness: { fontSize: typography.label, color: colors.textMuted },
  scheduler: { maxHeight: 360 },
  schedulerContent: { gap: spacing.xs },
  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calendarNavTarget: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  calendarCanvas: { minWidth: 308 },
  weekdayRow: { flexDirection: "row" },
  weekday: { width: 44, textAlign: "center", color: colors.textMuted, fontSize: typography.label, fontWeight: "700" },
  dayGrid: { width: 308, flexDirection: "row", flexWrap: "wrap" },
  dayPlaceholder: { width: 44, height: 44 },
  day: { width: 44, minWidth: 44, minHeight: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  dayText: { color: colors.text, fontSize: typography.body },
  pickerLabel: { color: colors.textMuted, fontSize: typography.body, fontWeight: "600" },
  timePickerRow: { flexDirection: "row", gap: spacing.md },
  wheelGroup: { flex: 1, alignItems: "center", gap: spacing.xs },
  wheel: { height: WHEEL_ITEM_HEIGHT * 3, width: 72 },
  wheelPaddingRow: { height: WHEEL_ITEM_HEIGHT },
  option: { minWidth: 44, minHeight: 44, height: WHEEL_ITEM_HEIGHT, paddingHorizontal: spacing.sm, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  optionText: { color: colors.text, fontSize: typography.body },
  selectedOption: { backgroundColor: colors.primary },
  selectedOptionText: { color: colors.surface, fontWeight: "700" },
  selectedTimestamp: { color: colors.textMuted, fontSize: typography.body },
  futureHint: { color: colors.warning, fontSize: typography.label },
  error: { color: colors.danger, fontSize: typography.body },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  button: { flex: 1, minHeight: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  cancel: { backgroundColor: colors.surfaceContainer },
  cancelText: { color: colors.text, fontWeight: "600", fontSize: typography.body },
  confirm: { backgroundColor: colors.primary },
  confirmText: { color: colors.surface, fontWeight: "700", fontSize: typography.body },
  tertiaryConfirm: { backgroundColor: colors.surfaceContainer },
  tertiaryConfirmText: { color: colors.text, fontWeight: "600" },
  disabled: { opacity: 0.6 },
})
