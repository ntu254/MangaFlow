import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, radius, spacing, typography } from "@/design/tokens"

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
  return (
    <View style={styles.bar}>
      {actions.map((descriptor) => {
        const label = actionLabel(descriptor.action)
        const busy = busyAction === descriptor.action
        return (
          <View key={descriptor.action} style={styles.slot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled: !descriptor.enabled || busy }}
              disabled={!descriptor.enabled || busy}
              onPress={() => onAction(descriptor)}
              style={[styles.button, (!descriptor.enabled || busy) && styles.disabled]}
            >
              <Text numberOfLines={1} style={styles.buttonText}>{busy ? "Working\u2026" : label}</Text>
            </Pressable>
            {!descriptor.enabled && descriptor.disabledReason ? (
              <Text style={styles.reason}>{descriptor.disabledReason}</Text>
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
  },
  slot: { gap: 2 },
  button: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { backgroundColor: colors.surfaceContainer },
  buttonText: { color: colors.surface, fontWeight: "600", fontSize: typography.body },
  reason: { color: colors.textMuted, fontSize: typography.label, paddingHorizontal: spacing.sm },
})
