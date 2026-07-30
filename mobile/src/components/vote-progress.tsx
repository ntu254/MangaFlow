import { StyleSheet, Text, View } from "react-native"
import { colors, radius, spacing, typography } from "@/design/tokens"

// Renders the backend tally as read-only progress. Mobile never computes the
// numbers; it only visualizes approve/reject against quorum and electorate.
export function VoteProgress({
  approve,
  reject,
  quorum,
  eligible,
  canFinalize,
}: {
  approve: number
  reject: number
  quorum: number
  eligible: number
  canFinalize: boolean
}) {
  const denom = Math.max(eligible, 1)
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {`Approve ${approve} · Reject ${reject} · Quorum ${quorum} of ${eligible}`}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fillApprove, { flex: approve }]} />
        <View style={[styles.fillReject, { flex: reject }]} />
        <View style={{ flex: Math.max(denom - approve - reject, 0) }} />
      </View>
      <Text style={[styles.status, { color: canFinalize ? colors.success : colors.textMuted }]}>
        {canFinalize ? "Decision ready to finalize" : "Awaiting more votes"}
      </Text>
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
    gap: spacing.sm,
  },
  title: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  track: { flexDirection: "row", height: 10, borderRadius: radius.full, overflow: "hidden", backgroundColor: colors.surfaceContainer },
  fillApprove: { backgroundColor: colors.success },
  fillReject: { backgroundColor: colors.danger },
  status: { fontSize: typography.label, fontWeight: "700" },
})
