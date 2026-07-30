import { useState } from "react"
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { colors, radius, spacing, typography } from "@/design/tokens"

export interface WorkflowConfirmationSheetProps {
  visible: boolean
  title: string
  effect: string
  confirmLabel: string
  // When set, the sheet requires a non-empty reason before confirming.
  reasonLabel?: string
  requireReason?: boolean
  submitting?: boolean
  errorMessage?: string | null
  onCancel: () => void
  onConfirm: (reason: string) => void
}

// Shared high-friction confirmation used by every consequential mobile action.
// The reason draft is owned here and preserved across a failed confirm so the
// caller can re-show the sheet after a validation/permission/conflict error.
export function WorkflowConfirmationSheet({
  visible,
  title,
  effect,
  confirmLabel,
  reasonLabel,
  requireReason = false,
  submitting = false,
  errorMessage,
  onCancel,
  onConfirm,
}: WorkflowConfirmationSheetProps) {
  const [reason, setReason] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const handleConfirm = () => {
    if (requireReason && reason.trim().length === 0) {
      setLocalError("Reason is required.")
      return
    }
    setLocalError(null)
    onConfirm(reason.trim())
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.effect}>{effect}</Text>
          {reasonLabel ? (
            <TextInput
              accessibilityLabel={reasonLabel}
              placeholder={reasonLabel}
              value={reason}
              onChangeText={setReason}
              multiline
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
              accessibilityLabel={confirmLabel}
              disabled={submitting}
              onPress={handleConfirm}
              style={[styles.button, styles.confirm, submitting && styles.disabled]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
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
  effect: { fontSize: typography.body, color: colors.textMuted },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    textAlignVertical: "top",
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
