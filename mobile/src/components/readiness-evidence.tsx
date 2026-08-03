import { StyleSheet, Text, View } from "react-native"
import type { EditorReadiness } from "@/services/editor-mobile-data-source"
import { colors, radius, spacing, typography } from "@/design/tokens"

// Renders the backend readiness result as evidence. Mobile never recomputes
// readiness; it only displays each canonical check and its reason.
export function ReadinessEvidence({ readiness }: { readiness: EditorReadiness }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{`Readiness ${readiness.ready ? "· Ready" : "· Blocked"}`}</Text>
      {readiness.items.map((item) => (
        <View key={item.key} style={styles.row}>
          <Text style={[styles.mark, { color: item.passed ? colors.success : colors.danger }]}>
            {item.passed ? "✓" : "✕"}
          </Text>
          <Text style={styles.reason}>{item.reason}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: { fontSize: typography.label, fontWeight: "800", color: colors.textMuted },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  mark: { fontSize: typography.body, fontWeight: "800", width: 16 },
  reason: { flex: 1, fontSize: typography.body, color: colors.text },
})
