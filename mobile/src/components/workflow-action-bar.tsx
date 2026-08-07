import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"

export interface WorkflowActionDescriptor {
  action: string
  enabled: boolean
  disabledReason: string | null
  requiresConfirmation: boolean
  requiresReason: boolean
}

export const ACTION_LABELS: Record<string, string> = {
  CLAIM: "Claim",
  RELEASE_CLAIM: "Release claim",
  REQUEST_CHANGES: "Request changes",
  REJECT: "Reject",
  FORWARD: "Forward to Board",
  REQUEST_REVISION: "Request revision",
  EDITOR_APPROVE: "Approve chapter",
  SCHEDULE: "Schedule publication",
  POSTPONE: "Postpone",
  PUBLISH: "Publish now",
  COMMENT_RESOLVE: "Resolve comment",
  COMMENT_REOPEN: "Reopen comment",
  VOTE: "Vote",
  TIE_RESOLVE: "Resolve tied vote",
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

// Sticky action bar. Enabled actions are pressable; a disabled action stays
// visible only with its reason so the user understands why they cannot act.
export function WorkflowActionBar({
  actions,
  onAction,
  busyAction,
}: {
  actions: WorkflowActionDescriptor[]
  onAction: (descriptor: WorkflowActionDescriptor) => void
  busyAction?: string | null
}) {
  if (actions.length === 0) return null

  return (
    <View style={styles.bar}>
      {actions.map((descriptor) => {
        const label = actionLabel(descriptor.action)
        const busy = busyAction === descriptor.action
        const disabled = !descriptor.enabled || busy
        const isDanger = descriptor.action === "REJECT" || descriptor.action === "REQUEST_CHANGES" || descriptor.action === "REQUEST_REVISION"
        const isPrimary = descriptor.action === "FORWARD" || descriptor.action === "EDITOR_APPROVE" || descriptor.action === "CLAIM" || descriptor.action === "SCHEDULE"
        const isSecondary = descriptor.action === "PUBLISH"
        const isTertiary = descriptor.action === "POSTPONE"
        
        const variant = isTertiary ? "tertiary" : isSecondary ? "secondary" : isPrimary ? "primary" : isDanger ? "danger" : "secondary"
        return (
          <View key={descriptor.action} style={styles.slot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={() => onAction(descriptor)}
              style={({ pressed }) => [
                styles.button,
                variant === "primary" && styles.primaryButton,
                variant === "danger" && styles.dangerButton,
                variant === "secondary" && styles.secondaryButton,
                variant === "tertiary" && styles.tertiaryButton,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.buttonText,
                  variant === "primary" && styles.primaryButtonText,
                  variant === "danger" && styles.dangerButtonText,
                  variant === "secondary" && styles.secondaryButtonText,
                  variant === "tertiary" && styles.tertiaryButtonText,
                  disabled && styles.disabledButtonText,
                ]}
              >
                {busy ? "Working\u2026" : label}
              </Text>
            </Pressable>
            {!descriptor.enabled && descriptor.disabledReason ? (
              <View style={styles.reasonBox}>
                <Text style={styles.reason}>{descriptor.disabledReason}</Text>
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: shadow.floating.shadowColor,
    shadowOpacity: shadow.floating.shadowOpacity,
    shadowRadius: shadow.floating.shadowRadius,
    shadowOffset: shadow.floating.shadowOffset,
    elevation: shadow.floating.elevation,
  },
  slot: { gap: 4 },
  button: {
    minHeight: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: shadow.glow.shadowColor,
    shadowOpacity: shadow.glow.shadowOpacity,
    shadowRadius: shadow.glow.shadowRadius,
    shadowOffset: shadow.glow.shadowOffset,
    elevation: shadow.glow.elevation,
  },
  dangerButton: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  tertiaryButton: {
    backgroundColor: colors.surfaceContainer,
  },
  disabled: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainer,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: { fontWeight: "700", fontSize: typography.body },
  primaryButtonText: { color: colors.surface },
  dangerButtonText: { color: colors.dangerText },
  secondaryButtonText: { color: colors.primary },
  tertiaryButtonText: { color: colors.textMuted },
  disabledButtonText: { color: colors.textMuted },
  reasonBox: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  reason: { color: colors.warningText, fontSize: typography.label, fontWeight: "600" },
})
