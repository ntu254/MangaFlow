import { useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import type { UseQueryResult } from "@tanstack/react-query"
import { useHardwareBackToClose } from "@/hooks/use-hardware-back"
import { TodayQueue } from "@/components/today-queue"
import { WorkflowState } from "@/components/workflow-state"
import { EditorHomeScreen } from "@/screens/editor-home-screen"
import { EditorProposalDetailScreen } from "@/screens/editor-proposal-detail-screen"
import { EditorChapterDetailScreen } from "@/screens/editor-chapter-detail-screen"
import { EditorPublishScreen } from "@/screens/editor-publish-screen"
import { EditorHistoryScreen } from "@/screens/editor-history-screen"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"
import { colors, radius, spacing, typography } from "@/design/tokens"

export type ReviewSubTab = "all" | "proposal" | "chapter"

export interface ReviewSubTabConfig {
  id: ReviewSubTab
  label: string
}

export const REVIEW_SUB_TABS: ReviewSubTabConfig[] = [
  { id: "all", label: "All Reviews" },
  { id: "proposal", label: "Review Proposal" },
  { id: "chapter", label: "Review Chapter" },
]

export function filterReviewItemsBySubTab(subTab: ReviewSubTab, items: MobileWorkItem[]): MobileWorkItem[] {
  if (subTab === "proposal") {
    return items.filter((item) => item.kind === "PROPOSAL_REVIEW")
  }
  if (subTab === "chapter") {
    return items.filter((item) => item.kind === "CHAPTER_REVIEW" || item.kind === "COMMENT_REVIEW")
  }
  return items
}

function ReviewSubTabBar({
  activeSubTab,
  onSelectSubTab,
  counts,
}: {
  activeSubTab: ReviewSubTab
  onSelectSubTab: (subTab: ReviewSubTab) => void
  counts: Record<ReviewSubTab, number>
}) {
  return (
    <View style={subTabStyles.barContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={subTabStyles.scrollContent}
      >
        {REVIEW_SUB_TABS.map((subTab) => {
          const isActive = activeSubTab === subTab.id
          const count = counts[subTab.id] ?? 0
          return (
            <Pressable
              key={subTab.id}
              accessibilityRole="button"
              accessibilityLabel={`${subTab.label} tab (${count})`}
              onPress={() => onSelectSubTab(subTab.id)}
              style={subTabStyles.tabButton}
            >
              <View style={subTabStyles.tabRow}>
                <Text style={[subTabStyles.tabText, isActive && subTabStyles.tabTextActive]}>
                  {subTab.label}
                </Text>
                <View style={[subTabStyles.badgePill, isActive && subTabStyles.badgePillActive]}>
                  <Text style={[subTabStyles.badgeText, isActive && subTabStyles.badgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </View>
              {isActive ? <View style={subTabStyles.activeIndicator} /> : null}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

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
  const [activeSubTab, setActiveSubTab] = useState<ReviewSubTab>("all")

  // Switching tabs should always land on that tab's list, not leave a stale
  // detail screen from whichever item was open before.
  useEffect(() => {
    setSelected(null)
    setActiveSubTab("all")
  }, [tab])

  useHardwareBackToClose(selected !== null, () => setSelected(null))

  if (selected) {
    return <EditorDetail item={selected} onBack={() => setSelected(null)} />
  }

  if (tab === "priority" || tab === "home") {
    return (
      <EditorHomeScreen
        inbox={inbox.data}
        isLoading={inbox.isLoading}
        error={inbox.error}
        onRetry={() => void inbox.refetch()}
        onRefresh={() => void inbox.refetch()}
        refreshing={inbox.isRefetching}
        onSelect={setSelected}
      />
    )
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

  const rawTabItems = inbox.data ? filterEditorInbox(tab, inbox.data.items) : []

  let finalItems = rawTabItems
  let counts: Record<ReviewSubTab, number> | null = null

  if (tab === "reviews") {
    counts = {
      all: rawTabItems.length,
      proposal: filterReviewItemsBySubTab("proposal", rawTabItems).length,
      chapter: filterReviewItemsBySubTab("chapter", rawTabItems).length,
    }
    finalItems = filterReviewItemsBySubTab(activeSubTab, rawTabItems)
  }

  const filteredInbox: MobileInbox | undefined = inbox.data
    ? { ...inbox.data, items: finalItems }
    : undefined

  const emptyByTab: Record<string, { title: string; description: string }> = {
    priority: { title: "No priority work right now.", description: "Review your full workspaces for planned tasks." },
    reviews: {
      title: activeSubTab === "proposal" ? "No proposal reviews right now." : "No chapter reviews right now.",
      description:
        activeSubTab === "proposal"
          ? "Proposals submitted for review will appear here."
          : "Chapters and comments submitted for review will appear here.",
    },
    publish: { title: "Nothing to publish.", description: "Chapters ready to schedule or publish appear here." },
  }
  const empty = emptyByTab[tab] ?? emptyByTab.priority

  const subHeader =
    tab === "reviews" && counts ? (
      <ReviewSubTabBar
        activeSubTab={activeSubTab}
        onSelectSubTab={setActiveSubTab}
        counts={counts}
      />
    ) : undefined

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
      context="Editor work"
      numColumns={tab === "reviews" ? 2 : 1}
      variant={tab === "reviews" ? "grid" : "list"}
      subHeader={subHeader}
    />
  )
}

export function filterEditorInbox(tab: string, items: MobileWorkItem[]): MobileWorkItem[] {
  if (tab === "priority") return items.filter((item) => item.priority.level === "URGENT" || item.priority.level === "HIGH")
  if (tab === "reviews") return items.filter((item) => item.kind === "PROPOSAL_REVIEW" || item.kind === "CHAPTER_REVIEW" || item.kind === "COMMENT_REVIEW")
  if (tab === "publish") return items.filter((item) => item.kind === "PUBLICATION")
  return []
}

function EditorDetail({ item, onBack }: { item: MobileWorkItem; onBack: () => void }) {
  const commentChapterId =
    item.kind === "COMMENT_REVIEW" && typeof item.summary.chapterId === "string"
      ? item.summary.chapterId
      : null

  return (
    <View style={styles.root}>
      <View style={styles.backHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>
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

const subTabStyles = StyleSheet.create({
  barContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    marginBottom: spacing.sm,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    alignItems: "center",
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    position: "relative",
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabTextActive: {
    fontWeight: "800",
    color: colors.text,
  },
  badgePill: {
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePillActive: {
    backgroundColor: colors.text,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  badgeTextActive: {
    color: colors.surface,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.text,
    borderRadius: 2,
  },
})

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  backHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  backButtonPressed: { backgroundColor: colors.badgeBg, opacity: 0.9 },
  backText: { color: colors.primary, fontSize: typography.body, fontWeight: "700" },
  detail: { flex: 1 },
})


