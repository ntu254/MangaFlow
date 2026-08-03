import { useEffect, useState } from "react"
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import type { AtRiskDecisionValue } from "@/services/board-mobile-data-source"
import { colors, radius, spacing, typography } from "@/design/tokens"

const DECISIONS: { value: AtRiskDecisionValue; label: string }[] = [
  { value: "CONTINUE", label: "Continue" },
  { value: "WARNING", label: "Warning" },
  { value: "CHANGE_FORMAT", label: "Change format" },
  { value: "CANCEL", label: "Cancel series" },
]

// Manual at-risk decision. A decision must be chosen and a rationale entered;
// cancellation is never automatic.
export function AtRiskDecisionSheet({
  visible,
  isBoardChair,
  seriesTitle,
  evidence,
  reason,
  submitting = false,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  visible: boolean
  isBoardChair: boolean
  seriesTitle: string
  evidence: string
  reason: string
  submitting?: boolean
  errorMessage?: string | null
  onCancel: () => void
  onConfirm: (input: {
    decision: AtRiskDecisionValue
    note?: string
    publicationType?: "WEEKLY" | "MONTHLY"
  }) => void
}) {
  const [decision, setDecision] = useState<AtRiskDecisionValue | null>(null)
  const [note, setNote] = useState("")
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY")
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      setDecision(null)
      setNote("")
      setLocalError(null)
    }
  }, [visible, seriesTitle])

  const confirm = () => {
    if (!decision) {
      setLocalError("Choose a decision.")
      return
    }
    if (decision === "CANCEL" && note.trim().length === 0) {
      setLocalError("Reason is required.")
      return
    }
    setLocalError(null)
    onConfirm({
      decision,
      note: note.trim() || undefined,
      ...(decision === "CHANGE_FORMAT" ? { publicationType } : {}),
    })
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!submitting) onCancel()
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.title}>
            At-risk decision: {seriesTitle}
          </Text>
          <Text style={styles.evidence}>{evidence}</Text>
          <Text style={styles.reason}>{reason}</Text>
          {isBoardChair ? (
            <>
              <View style={styles.choices}>
                {DECISIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: decision === option.value }}
                    onPress={() => setDecision(option.value)}
                    style={[
                      styles.choice,
                      option.value === "CANCEL" && styles.choiceDanger,
                      decision === option.value && styles.choiceActive,
                    ]}
                  >
                    <Text style={[
                      styles.choiceText,
                      option.value === "CANCEL" && styles.choiceDangerText,
                      decision === option.value && styles.choiceTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {decision === "CANCEL" ? (
                <Text style={styles.manualNotice}>Cancellation is a manual Chair decision; it is never automatic.</Text>
              ) : null}
              {decision === "CHANGE_FORMAT" ? (
                <View style={styles.choices}>
                  {(["WEEKLY", "MONTHLY"] as const).map((value) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityLabel={`Set ${value.toLowerCase()} cadence`}
                      accessibilityState={{ selected: publicationType === value }}
                      onPress={() => setPublicationType(value)}
                      style={[styles.choice, publicationType === value && styles.choiceActive]}
                    >
                      <Text style={[styles.choiceText, publicationType === value && styles.choiceTextActive]}>
                        {value === "WEEKLY" ? "Weekly" : "Monthly"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <TextInput
                accessibilityLabel="Reason"
                placeholder={decision === "CANCEL" ? "Reason (required)" : "Optional note"}
                value={note}
                onChangeText={setNote}
                multiline
                style={styles.input}
              />
              {localError || errorMessage ? (
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
                  {localError ?? errorMessage}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  accessibilityState={{ disabled: submitting }}
                  disabled={submitting}
                  onPress={onCancel}
                  style={[styles.button, styles.cancel, submitting && styles.disabled]}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={decision === "CANCEL" ? "Confirm cancellation" : "Confirm decision"}
                  accessibilityState={{ disabled: submitting, busy: submitting }}
                  disabled={submitting}
                  onPress={confirm}
                  style={[styles.button, decision === "CANCEL" ? styles.confirmDanger : styles.confirm, submitting && styles.disabled]}
                >
                  <Text style={styles.confirmText}>{decision === "CANCEL" ? "Confirm cancellation" : "Confirm decision"}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.readOnly}>Only the Board Chair can record an at-risk decision.</Text>
          )}
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
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  choice: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  choiceDanger: { borderColor: colors.danger },
  choiceText: { color: colors.textMuted, fontWeight: "700", fontSize: typography.body },
  choiceTextActive: { color: colors.primary },
  choiceDangerText: { color: colors.danger },
  evidence: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  reason: { color: colors.textMuted, fontSize: typography.body },
  manualNotice: { color: colors.danger, fontSize: typography.body, fontWeight: "600" },
  readOnly: { color: colors.textMuted, fontSize: typography.body },
  input: {
    minHeight: 72,
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
  confirmDanger: { backgroundColor: colors.danger },
  confirmText: { color: colors.surface, fontWeight: "700", fontSize: typography.body },
  disabled: { opacity: 0.6 },
})
