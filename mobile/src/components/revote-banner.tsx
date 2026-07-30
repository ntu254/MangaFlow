import { StyleSheet, Text, View } from "react-native"
import { colors, radius, spacing, typography } from "@/design/tokens"

// Shown on a fresh re-vote session created after a tied round. No votes carry
// over from the tied round; this is a clean round.
export function RevoteBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Fresh re-vote</Text>
      <Text style={styles.body}>
        The previous round tied and was closed. This is a new round with no carried-over votes.
      </Text>
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
})
