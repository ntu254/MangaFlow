import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"
import { WorkItemCard } from "@/components/work-item-card"
import { WorkflowState } from "@/components/workflow-state"
import { colors, radius, spacing, typography } from "@/design/tokens"

export interface TodayQueueProps {
  inbox?: MobileInbox
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  onRefresh?: () => void
  refreshing?: boolean
  onSelect?: (item: MobileWorkItem) => void
  demoMode?: boolean
  emptyTitle: string
  emptyDescription: string
  /** Role/context noun used by the failure title, e.g. "Editor work". */
  context?: string
  numColumns?: number
  variant?: "list" | "grid"
  subHeader?: React.ReactNode
}

// Renders the backend queue order verbatim; mobile never re-sorts work.
// FlatList (not ScrollView + .map) so a long inbox does not mount every
// row up front.
export function TodayQueue({
  inbox,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  refreshing = false,
  onSelect,
  demoMode = false,
  emptyTitle,
  emptyDescription,
  context,
  numColumns,
  variant = "list",
  subHeader,
}: TodayQueueProps) {
  if (isLoading && !inbox) return <WorkflowState kind="loading" />
  if (error && !inbox) {
    return (
      <WorkflowState kind="error" error={error} context={context} onRetry={onRetry ?? (() => {})} />
    )
  }

  const items = inbox?.items ?? []
  const cols = numColumns ?? (variant === "grid" ? 2 : 1)
  const isGrid = cols > 1 || variant === "grid"

  return (
    <FlatList
      key={`queue-list-${cols}`}
      data={items}
      numColumns={cols}
      columnWrapperStyle={cols > 1 ? styles.columnWrapper : undefined}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={isGrid ? styles.gridColWrapper : undefined}>
          <WorkItemCard item={item} onSelect={onSelect ?? (() => {})} variant={isGrid ? "grid" : "list"} />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={isGrid ? styles.gridSeparator : styles.separator} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          {demoMode ? (
            <View style={styles.demoBanner}>
              <Text style={styles.demoText}>Demo data</Text>
            </View>
          ) : null}
          {subHeader}
          {items.length > 0 ? (
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>{isGrid ? "Review Cards (2 Columns)" : "Queue Items"}</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>{items.length}</Text>
              </View>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <WorkflowState kind="empty" title={emptyTitle} description={emptyDescription} />
      }
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
    />
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, flexGrow: 1, paddingBottom: spacing.xl },
  separator: { height: spacing.md },
  gridSeparator: { height: 0 },
  columnWrapper: {
    gap: spacing.sm,
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  gridColWrapper: {
    flex: 1,
    maxWidth: "48.5%",
  },
  headerContainer: { marginBottom: spacing.sm },
  demoBanner: {
    backgroundColor: colors.warningSoft,
    borderRadius: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  demoText: { color: colors.warningText, fontWeight: "700", fontSize: typography.label },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontSize: typography.label,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  badgePill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.label,
    fontWeight: "700",
    color: colors.primary,
  },
})


