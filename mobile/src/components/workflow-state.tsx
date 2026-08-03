import { useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { canCopyToClipboard, copyToClipboard } from "@/services/mobile-clipboard"
import {
  formatSupportDetails,
  friendlyFailureTitle,
  resolveRequestDiagnostics,
} from "@/services/mobile-request-diagnostics"
import { colors, radius, spacing, typography } from "@/design/tokens"

export type WorkflowStateProps =
  | { kind: "loading"; label?: string }
  | { kind: "empty"; title: string; description: string }
  | {
      kind: "error"
      error: unknown
      onRetry: () => void
      /** Role/context noun, e.g. "Editor work". Drives the non-technical title. */
      context?: string
    }

// Shared loading / empty / error surface. Never imports mock data — a live
// failure shows an error with retry, not fallback content.
export function WorkflowState(props: WorkflowStateProps) {
  if (props.kind === "loading") {
    return (
      <View accessibilityRole="progressbar" style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.description}>{props.label ?? "Loading your queue…"}</Text>
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

  return <WorkflowErrorState error={props.error} onRetry={props.onRetry} context={props.context} />
}

function WorkflowErrorState({
  error,
  onRetry,
  context = "this screen",
}: {
  error: unknown
  onRetry: () => void
  context?: string
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const diagnostics = resolveRequestDiagnostics(error, context)
  const supportDetails = formatSupportDetails(diagnostics)
  const copyable = canCopyToClipboard()

  return (
    <View style={styles.center}>
      <Text accessibilityRole="header" style={styles.title}>
        {friendlyFailureTitle(diagnostics)}
      </Text>
      <Text style={styles.description}>
        Nothing was changed. Try again, or share the support details below if it keeps failing.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        onPress={onRetry}
        style={styles.retry}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: detailsOpen }}
        accessibilityLabel="Support details"
        onPress={() => setDetailsOpen((open) => !open)}
        style={styles.disclosure}
      >
        <Text style={styles.disclosureText}>
          {detailsOpen ? "Hide support details" : "Support details"}
        </Text>
      </Pressable>
      {detailsOpen ? (
        <View style={styles.supportPanel}>
          {/* Selectable so the details can be copied by hand where the platform
              exposes no clipboard API to the app. */}
          <Text selectable style={styles.supportText}>
            {supportDetails}
          </Text>
          {copyable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy support details"
              onPress={() => {
                void copyToClipboard(supportDetails).then(setCopied)
              }}
              style={styles.copy}
            >
              <Text style={styles.copyText}>{copied ? "Copied" : "Copy support details"}</Text>
            </Pressable>
          ) : (
            <Text style={styles.supportHint}>Long press the details above to select and copy.</Text>
          )}
        </View>
      ) : null}
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
  disclosure: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.sm },
  disclosureText: { color: colors.primary, fontSize: typography.label, fontWeight: "800" },
  supportPanel: {
    alignSelf: "stretch",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceLow,
    padding: spacing.md,
  },
  supportText: { color: colors.textMuted, fontSize: typography.label, lineHeight: 18 },
  supportHint: { color: colors.outline, fontSize: typography.label },
  copy: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  copyText: { color: colors.primary, fontWeight: "800", fontSize: typography.label },
})
