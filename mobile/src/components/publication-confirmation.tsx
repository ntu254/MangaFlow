import { useState } from "react"
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { colors, radius, spacing, typography } from "@/design/tokens"

export type PublicationAction = "SCHEDULE" | "POSTPONE" | "PUBLISH"

const TITLES: Record<PublicationAction, string> = {
  SCHEDULE: "Schedule publication",
  POSTPONE: "Postpone publication",
  PUBLISH: "Publish now",
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
  const [scheduledAt, setScheduledAt] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  if (!action) return null

  const confirm = () => {
    if (action === "SCHEDULE") {
      const parsed = new Date(scheduledAt)
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        setLocalError("Scheduled time must be a future date.")
        return
      }
      setLocalError(null)
      onConfirm({ scheduledAt: parsed.toISOString() })
      return
    }
    setLocalError(null)
    onConfirm({})
  }

  const effect =
    action === "PUBLISH"
      ? `Publish ${chapterTitle} now. It becomes publicly visible. Backend readiness is currently ${
          readinessReady ? "ready" : "not ready"
        }.`
      : action === "SCHEDULE"
        ? `Schedule ${chapterTitle} for a future date. It publishes automatically at that time.`
        : `Postpone the scheduled publication of ${chapterTitle}.`

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text accessibilityRole="header" style={styles.title}>
            {TITLES[action]}
          </Text>
          <Text style={styles.body}>{effect}</Text>
          {action === "SCHEDULE" ? (
            <TextInput
              accessibilityLabel="Scheduled date and time"
              placeholder="YYYY-MM-DDTHH:mm"
              value={scheduledAt}
              onChangeText={setScheduledAt}
              autoCapitalize="none"
              style={styles.input}
            />
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
              disabled={submitting}
              onPress={confirm}
              style={[styles.button, styles.confirm, submitting && styles.disabled]}
            >
              <Text style={styles.confirmText}>Confirm</Text>
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
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: typography.body },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  button: { flex: 1, minHeight: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  cancel: { backgroundColor: colors.surfaceContainer },
  cancelText: { color: colors.text, fontWeight: "600", fontSize: typography.body },
  confirm: { backgroundColor: colors.primary },
  confirmText: { color: colors.surface, fontWeight: "700", fontSize: typography.body },
  disabled: { opacity: 0.6 },
})
