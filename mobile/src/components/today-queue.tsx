import type { PropsWithChildren, ReactNode } from "react"
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import type { MobileApiError } from "@/services/mobile-api-error"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"
import { WorkItemCard } from "@/components/work-item-card"
import { WorkflowState } from "@/components/workflow-state"
import { colors, spacing, typography } from "@/design/tokens"

export interface TodayQueueProps {
  inbox?: MobileInbox
  isLoading?: boolean
  error?: MobileApiError | Error | null
  onRetry?: () => void
  onRefresh?: () => void
  refreshing?: boolean
  onSelect?: (item: MobileWorkItem) => void
  demoMode?: boolean
  emptyTitle: string
  emptyDescription: string
  header?: ReactNode
  hideItems?: boolean
}

// Renders the backend queue order verbatim; mobile never re-sorts work.
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
  header,
  hideItems = false,
}: TodayQueueProps) {
  if (isLoading && !inbox) return <WorkflowState kind="loading" />
  if (error && !inbox) return <WorkflowState kind="error" error={error} onRetry={onRetry ?? (() => {})} />

  const items = inbox?.items ?? []

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      {demoMode ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoText}>Demo data</Text>
        </View>
      ) : null}
      {header}
      {!hideItems &&
        (items.length === 0 ? (
          <WorkflowState kind="empty" title={emptyTitle} description={emptyDescription} />
        ) : (
          items.map((item) => (
            <WorkItemCard key={item.id} item={item} onSelect={onSelect ?? (() => {})} />
          ))
        ))}
    </ScrollView>
  )
}


const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  demoBanner: {
    backgroundColor: colors.warningSoft,
    borderRadius: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  demoText: { color: colors.warning, fontWeight: "700", fontSize: typography.label },
})
