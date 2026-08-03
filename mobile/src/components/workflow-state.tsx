import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, spacing, typography } from "@/design/tokens"

export type WorkflowStateProps =
  | { kind: "loading" }
  | { kind: "empty"; title: string; description: string }
  | { kind: "error"; error: MobileApiError | Error; onRetry: () => void }

// Shared loading / empty / error surface. Never imports mock data — a live
// failure shows an error with retry, not fallback content.
export function WorkflowState(props: WorkflowStateProps) {
  if (props.kind === "loading") {
    return (
      <View accessibilityRole="progressbar" style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.description}>Loading your queue…</Text>
      </View>
    )
  }

  if (props.kind === "empty") {
    return (
      <View style={styles.center}>
        <Text accessibilityRole="header" style={styles.title}>
          {props.title}
        </Text>
        <Text style={styles.description}>{props.description}</Text>
      </View>
    )
  }

  const message =
    props.error instanceof MobileApiError
      ? props.error.message
      : "Something went wrong loading your queue."
  return (
    <View style={styles.center}>
      <Text accessibilityRole="header" style={styles.title}>
        Could not load your queue.
      </Text>
      <Text style={styles.description}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        onPress={props.onRetry}
        style={styles.retry}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: typography.title, color: colors.text, fontWeight: "700", textAlign: "center" },
  description: { fontSize: typography.body, color: colors.textMuted, textAlign: "center" },
  retry: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.surface, fontWeight: "700", fontSize: typography.body },
})
