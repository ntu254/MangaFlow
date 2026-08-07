import { Image } from "expo-image"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"
import { WorkItemCard } from "@/components/work-item-card"
import { WorkflowState } from "@/components/workflow-state"
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"

export function EditorHomeScreen({
  inbox,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  refreshing = false,
  onSelect,
  onSelectTab,
}: {
  inbox?: MobileInbox
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  onRefresh?: () => void
  refreshing?: boolean
  onSelect: (item: MobileWorkItem) => void
  onSelectTab?: (tab: string) => void
}) {
  if (isLoading && !inbox) return <WorkflowState kind="loading" />
  if (error && !inbox) {
    return (
      <WorkflowState kind="error" error={error} context="Editor workspace" onRetry={onRetry ?? (() => {})} />
    )
  }

  const items = inbox?.items ?? []
  const priorityFocus = items.filter(
    (item) => item.priority.level === "URGENT" || item.priority.level === "HIGH"
  )
  const proposals = items.filter((item) => item.kind === "PROPOSAL_REVIEW")
  const chapters = items.filter(
    (item) => item.kind === "CHAPTER_REVIEW" || item.kind === "COMMENT_REVIEW"
  )
  const publications = items.filter((item) => item.kind === "PUBLICATION")
  const publishReady = publications.filter(
    (item) => item.status === "SCHEDULED" || item.status === "READY"
  )

  const focusList = priorityFocus.length > 0 ? priorityFocus : items.slice(0, 4)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      {/* Hero Workspace Header */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.eyebrow}>EDITOR WORKSPACE</Text>
          <Text style={styles.heroTitle}>Today, Overview</Text>
          <Text style={styles.heroDescription}>
            {items.length} items to review · {priorityFocus.length} priority focus · {publishReady.length} ready to publish
          </Text>
        </View>
      </View>

      {/* Metrics Summary Grid */}
      <View style={styles.gridSection}>
        <View style={styles.gridRow}>
          <View style={[styles.statCard, { backgroundColor: colors.warningSoft }]}>
            <Text style={[styles.statValue, { color: colors.warningText }]}>
              {priorityFocus.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.warningText }]}>Priority Focus</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{proposals.length}</Text>
            <Text style={[styles.statLabel, { color: colors.primary }]}>Proposals</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.statCard, { backgroundColor: colors.badgeBg }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{chapters.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Chapters</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.successSoft }]}>
            <Text style={[styles.statValue, { color: colors.successText }]}>
              {publishReady.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.successText }]}>Publish Ready</Text>
          </View>
        </View>
      </View>

      {/* Today Review Focus Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today Review Focus</Text>
          <Text style={styles.sectionSubtitle}>Items requiring your editorial attention today</Text>
        </View>

        {focusList.length === 0 ? (
          <WorkflowState
            kind="empty"
            title="No priority focus"
            description="Your priority queue is clear right now."
          />
        ) : (
          <View style={styles.gridContainer}>
            {focusList.map((item) => (
              <View key={item.id} style={styles.gridColWrapper}>
                <WorkItemCard item={item} onSelect={onSelect} variant="grid" />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Navigation Shortcuts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Editorial Workspaces</Text>
        <View style={styles.shortcutsRow}>
          <Pressable
            style={({ pressed }) => [styles.shortcutCard, pressed && styles.shortcutPressed]}
            onPress={() => onSelectTab?.("reviews")}
          >
            <Text style={styles.shortcutTitle}>Reviews Queue</Text>
            <Text style={styles.shortcutCount}>{proposals.length + chapters.length} items</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shortcutCard, pressed && styles.shortcutPressed]}
            onPress={() => onSelectTab?.("publish")}
          >
            <Text style={styles.shortcutTitle}>Publishing Queue</Text>
            <Text style={styles.shortcutCount}>{publications.length} items</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    shadowColor: shadow.card.shadowColor,
    shadowOpacity: shadow.card.shadowOpacity,
    shadowRadius: shadow.card.shadowRadius,
    shadowOffset: shadow.card.shadowOffset,
    elevation: shadow.card.elevation,
  },
  heroHeader: { gap: 4 },
  eyebrow: {
    fontSize: typography.label,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: typography.title,
    fontWeight: "800",
    color: colors.text,
  },
  heroDescription: {
    fontSize: typography.body,
    color: colors.textMuted,
    marginTop: 2,
  },

  gridSection: { gap: spacing.sm },
  gridRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: typography.label,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  section: { gap: spacing.xs, marginTop: spacing.xs },
  sectionHeader: { marginBottom: spacing.xs },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: "800",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: typography.label,
    color: colors.textMuted,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridColWrapper: {
    width: "48.5%",
    marginBottom: spacing.sm,
  },

  shortcutsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  shortcutCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 2,
    shadowColor: shadow.card.shadowColor,
    shadowOpacity: shadow.card.shadowOpacity,
    shadowRadius: shadow.card.shadowRadius,
    shadowOffset: shadow.card.shadowOffset,
    elevation: shadow.card.elevation,
  },
  shortcutPressed: { backgroundColor: colors.surfaceLow },
  shortcutTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  shortcutCount: { fontSize: typography.label, color: colors.textMuted },
})
