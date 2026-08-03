import { Pressable, StyleSheet, Text, View } from "react-native"
import type { MobileWorkItem } from "@/domain/mobile-work-item"
import { colors, radius, spacing, typography } from "@/design/tokens"

const PRIORITY_COLOR: Record<MobileWorkItem["priority"]["level"], string> = {
  URGENT: colors.danger,
  HIGH: colors.warning,
  NORMAL: colors.outline,
}

const WORK_TYPE_LABEL: Record<MobileWorkItem["kind"], string> = {
  PROPOSAL_REVIEW: "Proposal review",
  CHAPTER_REVIEW: "Chapter review",
  COMMENT_REVIEW: "Comment review",
  PUBLICATION: "Publication",
  BOARD_VOTE: "Board vote",
  SESSION_FINALIZE: "Session finalization",
  BOARD_REVOTE: "Board revote",
  AT_RISK: "At risk",
}

function normalizedObjectName(item: MobileWorkItem) {
  const objectType = item.entityType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
  const title = item.title.trim()

  return title.toLowerCase().startsWith(objectType.toLowerCase()) ? title : `${objectType} ${title}`
}

// Read-only queue card. Consequential actions live on the detail surface, never
// here, so a card only opens its item. Shows at most two status/blocker badges.
export function WorkItemCard({
  item,
  onSelect,
}: {
  item: MobileWorkItem
  onSelect: (item: MobileWorkItem) => void
}) {
  const badges = [
    { key: "status", label: item.status },
    ...item.blockers.slice(0, 1).map((blocker) => ({ key: blocker.code, label: blocker.label })),
  ].slice(0, 2)
  const eyebrow = `${WORK_TYPE_LABEL[item.kind]} · ${normalizedObjectName(item)}`

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}, ${item.status}, ${item.priority.reason}`}
      onPress={() => onSelect(item)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[item.priority.level] }]} />
        <Text style={styles.reason}>{item.priority.reason}</Text>
      </View>
      <Text style={styles.eyebrow} numberOfLines={1}>
        {eyebrow}
      </Text>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {item.subtitle}
      </Text>
      <View style={styles.badgeRow}>
        {badges.map((badge) => (
          <View key={badge.key} style={styles.badge}>
            <Text style={styles.badgeText}>{badge.label}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: { backgroundColor: colors.surfaceLow },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  priorityDot: { width: 8, height: 8, borderRadius: radius.full },
  reason: { fontSize: typography.label, color: colors.textMuted, fontWeight: "600" },
  eyebrow: { fontSize: typography.label, color: colors.textMuted, fontWeight: "700" },
  title: { fontSize: typography.title, color: colors.text, fontWeight: "700" },
  subtitle: { fontSize: typography.body, color: colors.textMuted },
  badgeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs, flexWrap: "wrap" },
  badge: {
    backgroundColor: colors.chip,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: typography.label, color: colors.textMuted },
})
