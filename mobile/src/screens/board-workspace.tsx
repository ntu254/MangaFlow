import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import type { UseQueryResult } from "@tanstack/react-query"
import { useHardwareBackToClose } from "@/hooks/use-hardware-back"
import { WorkflowState } from "@/components/workflow-state"
import { BoardTodayScreen } from "@/screens/board-today-screen"
import { BoardSessionsScreen } from "@/screens/board-sessions-screen"
import { BoardSessionDetailScreen } from "@/screens/board-session-detail-screen"
import { BoardSessionFormScreen } from "@/screens/board-session-form-screen"
import { BoardRankingScreen } from "@/screens/board-ranking-screen"
import { BoardHistoryScreen } from "@/screens/board-history-screen"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"
import { colors, radius, spacing, typography } from "@/design/tokens"

export function BoardWorkspace({
  tab,
  inbox,
  isChair,
  demoMode = false,
}: {
  tab: string
  inbox: UseQueryResult<MobileInbox, Error>
  isChair: boolean
  demoMode?: boolean
}) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [creatingSession, setCreatingSession] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedSessionId(null)
    setCreatingSession(false)
    setSelectionError(null)
  }, [tab])

  useHardwareBackToClose(
    selectedSessionId !== null || creatingSession,
    () => {
      setSelectedSessionId(null)
      setCreatingSession(false)
    },
  )

  if (selectedSessionId) {
    return (
      <WorkspaceDetail onBack={() => setSelectedSessionId(null)}>
        <BoardSessionDetailScreen sessionId={selectedSessionId} />
      </WorkspaceDetail>
    )
  }

  if (creatingSession) {
    return (
      <WorkspaceDetail onBack={() => setCreatingSession(false)}>
        <BoardSessionFormScreen
          onCreated={() => {
            setCreatingSession(false)
            void inbox.refetch()
          }}
        />
      </WorkspaceDetail>
    )
  }

  const selectInboxItem = (item: MobileWorkItem) => {
    setSelectionError(null)
    if (item.entityType === "VOTING_SESSION") {
      setSelectedSessionId(item.entityId)
      return
    }
    setSelectionError(`Could not open "${item.title}". Refresh and try again.`)
  }

  if (tab === "sessions") {
    if (demoMode) {
      return (
        <WorkflowState
          kind="empty"
          title="Demo sessions"
          description="Demo mode does not read or change live voting sessions."
        />
      )
    }
    return (
      <BoardSessionsScreen
        isChair={isChair}
        onSelect={setSelectedSessionId}
        onCreate={() => setCreatingSession(true)}
      />
    )
  }

  if (tab === "ranking") {
    if (demoMode) {
      return (
        <WorkflowState
          kind="empty"
          title="Demo ranking"
          description="Demo mode does not read live ranking data."
        />
      )
    }
    return <BoardRankingScreen />
  }

  if (tab === "history") {
    return demoMode ? (
      <WorkflowState
        kind="empty"
        title="Demo history"
        description="Demo mode does not read live decision records."
      />
    ) : <BoardHistoryScreen />
  }

  const boardInbox = inbox.data ? {
    ...inbox.data,
    items: inbox.data.items.filter((item) => item.kind !== "AT_RISK"),
  } : undefined

  return (
    <>
      {selectionError ? (
        <View style={styles.selectionErrorBanner}>
          <Text style={styles.selectionErrorText}>{selectionError}</Text>
        </View>
      ) : null}
      <BoardTodayScreen
        inbox={boardInbox}
        isLoading={inbox.isLoading}
        error={inbox.error}
        onRetry={() => void inbox.refetch()}
        onRefresh={() => void inbox.refetch()}
        refreshing={inbox.isRefetching}
        onSelect={selectInboxItem}
      />
    </>
  )
}

function WorkspaceDetail({
  onBack,
  children,
}: {
  onBack: () => void
  children: ReactNode
}) {
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        style={styles.back}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <View style={styles.detail}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md },
  backText: { color: colors.primary, fontSize: typography.body, fontWeight: "700" },
  detail: { flex: 1 },
  selectionErrorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.sm,
  },
  selectionErrorText: { color: colors.danger, fontSize: typography.label, fontWeight: "700" },
})
