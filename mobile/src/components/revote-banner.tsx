import { StyleSheet, Text, View } from "react-native"
import { colors, radius, spacing, typography } from "@/design/tokens"

export function RevoteBanner({
  previousRoundId,
  previousRoundStatus = "TIED",
  proposalVersionId,
}: {
  previousRoundId: string
  previousRoundStatus?: string
  proposalVersionId?: string | null
}) {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Fresh re-vote is open</Text>
      <Text style={styles.body}>
        {`Prior round ${previousRoundId} ended ${previousRoundStatus}. Votes start at zero in this round.`}
      </Text>
      {proposalVersionId ? (
        <Text style={styles.meta}>Proposal snapshot {proposalVersionId}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.md,
    gap: 2,
  },
  title: { fontSize: typography.body, fontWeight: "800", color: colors.warning },
  body: { fontSize: typography.label, color: colors.text },
  meta: { fontSize: typography.label, color: colors.textMuted, fontWeight: "700" },
})
