import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import type { UseQueryResult } from "@tanstack/react-query"
import { TodayQueue } from "@/components/today-queue"
import { WorkflowState } from "@/components/workflow-state"
import { EditorProposalDetailScreen } from "@/screens/editor-proposal-detail-screen"
import { EditorChapterDetailScreen } from "@/screens/editor-chapter-detail-screen"
import { EditorPublishScreen } from "@/screens/editor-publish-screen"
import { EditorHistoryScreen } from "@/screens/editor-history-screen"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"
import { colors, spacing, typography } from "@/design/tokens"

// Editor navigation lives inside the tab shell: each tab filters the same
// backend inbox (no re-sorting), and selecting an item opens the matching
// detail screen with a back affordance. History is immutable/read-only.
export function EditorWorkspace({
  tab,
  inbox,
  demoMode = false,
}: {
  tab: string
  inbox: UseQueryResult<MobileInbox, Error>
  demoMode?: boolean
}) {
  const [selected, setSelected] = useState<MobileWorkItem | null>(null)

  // Switching tabs should always land on that tab's list, not leave a stale
  // detail screen from whichever item was open before.
  useEffect(() => {
    setSelected(null)
  }, [tab])

  if (selected) {
    return <EditorDetail item={selected} onBack={() => setSelected(null)} />
  }

  if (tab === "history") {
    return demoMode ? (
      <WorkflowState
        kind="empty"
        title="Demo history"
        description="Demo mode does not read live Editor activity."
      />
    ) : <EditorHistoryScreen />
  }

  const filter = (item: MobileWorkItem): boolean => {
    if (tab === "reviews") return item.kind === "PROPOSAL_REVIEW" || item.kind === "CHAPTER_REVIEW"
    if (tab === "publish") return item.kind === "PUBLICATION"
    return true // today: everything
  }

  const filteredInbox: MobileInbox | undefined = inbox.data
    ? { ...inbox.data, items: inbox.data.items.filter(filter) }
    : undefined

  const emptyByTab: Record<string, { title: string; description: string }> = {
    today: { title: "No decisions need your attention.", description: "New work will appear here." },
    reviews: { title: "No reviews right now.", description: "Proposals and chapters to review appear here." },
    publish: { title: "Nothing to publish.", description: "Chapters ready to schedule or publish appear here." },
  }
  const empty = emptyByTab[tab] ?? emptyByTab.today

  return (
    <TodayQueue
      inbox={filteredInbox}
      isLoading={inbox.isLoading}
      error={inbox.error}
      onRetry={() => void inbox.refetch()}
      onRefresh={() => void inbox.refetch()}
      refreshing={inbox.isRefetching}
      onSelect={setSelected}
      emptyTitle={empty.title}
      emptyDescription={empty.description}
    />
  )
}

function EditorDetail({ item, onBack }: { item: MobileWorkItem; onBack: () => void }) {
  const commentChapterId =
    item.kind === "COMMENT_REVIEW" && typeof item.summary.chapterId === "string"
      ? item.summary.chapterId
      : null

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <View style={styles.detail}>
        {item.kind === "PROPOSAL_REVIEW" ? (
          <EditorProposalDetailScreen proposalId={item.entityId} />
        ) : item.kind === "CHAPTER_REVIEW" ? (
          <EditorChapterDetailScreen chapterId={item.entityId} />
        ) : item.kind === "PUBLICATION" ? (
          <EditorPublishScreen chapterId={item.entityId} />
        ) : commentChapterId ? (
          // Resolve/reopen lives on the chapter's blocking-comment thread, so
          // route straight there instead of a dead end.
          <EditorChapterDetailScreen chapterId={commentChapterId} />
        ) : (
          <WorkflowState
            kind="empty"
            title="Chapter not found"
            description="This comment's chapter could not be resolved. Open it from the Reviews tab instead."
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md },
  backText: { color: colors.primary, fontSize: typography.body, fontWeight: "700" },
  detail: { flex: 1 },
})
