import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"
import { WorkItemCard } from "@/components/work-item-card"
import { WorkflowState } from "@/components/workflow-state"
import { colors, spacing, typography } from "@/design/tokens"

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
}: TodayQueueProps) {
  if (isLoading && !inbox) return <WorkflowState kind="loading" />
  if (error && !inbox) {
    return (
      <WorkflowState kind="error" error={error} context={context} onRetry={onRetry ?? (() => {})} />
    )
  }

  const items = inbox?.items ?? []

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <WorkItemCard item={item} onSelect={onSelect ?? (() => {})} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        demoMode ? (
          <View style={styles.demoBanner}>
            <Text style={styles.demoText}>Demo data</Text>
          </View>
        ) : null
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
  content: { padding: spacing.md, flexGrow: 1 },
  separator: { height: spacing.sm },
  demoBanner: {
    backgroundColor: colors.warningSoft,
    borderRadius: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  demoText: { color: colors.warning, fontWeight: "700", fontSize: typography.label },
})
