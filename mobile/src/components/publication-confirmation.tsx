import { useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
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

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
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
        ? `Schedule ${chapterTitle} for a future date. It publishes automatically at that time.`
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
              <Text style={styles.pickerLabel}>Hour</Text>
              <ScrollView testID="publication-hour-picker" horizontal nestedScrollEnabled showsHorizontalScrollIndicator contentContainerStyle={styles.optionRow}>
                {HOURS.map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`Hour ${value}`}
                    accessibilityState={{ selected: hour === value }}
                    onPress={() => setHour(value)}
                    style={[styles.option, hour === value && styles.selectedOption]}
                  >
                    <Text style={[styles.optionText, hour === value && styles.selectedOptionText]}>{String(value).padStart(2, "0")}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.pickerLabel}>Minute</Text>
              <ScrollView testID="publication-minute-picker" horizontal nestedScrollEnabled showsHorizontalScrollIndicator contentContainerStyle={styles.optionRow}>
                {MINUTES.map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`Minute ${value}`}
                    accessibilityState={{ selected: minute === value }}
                    onPress={() => setMinute(value)}
                    style={[styles.option, minute === value && styles.selectedOption]}
                  >
                    <Text style={[styles.optionText, minute === value && styles.selectedOptionText]}>{String(value).padStart(2, "0")}</Text>
                  </Pressable>
                ))}
              </ScrollView>
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
  optionRow: { flexDirection: "row", gap: spacing.xs, paddingBottom: spacing.xs },
  option: { minWidth: 44, minHeight: 44, paddingHorizontal: spacing.sm, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
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
