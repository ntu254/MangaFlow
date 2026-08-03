import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import type { UseQueryResult } from "@tanstack/react-query"
import { WorkflowDetailLayout } from "@/components/workflow-detail-layout"
import { WorkflowState } from "@/components/workflow-state"
import { AtRiskDecisionSheet } from "@/components/at-risk-decision-sheet"
import { BoardTodayScreen } from "@/screens/board-today-screen"
import { BoardSessionsScreen } from "@/screens/board-sessions-screen"
import { BoardSessionDetailScreen } from "@/screens/board-session-detail-screen"
import { BoardSessionFormScreen } from "@/screens/board-session-form-screen"
import { BoardRankingScreen } from "@/screens/board-ranking-screen"
import { BoardHistoryScreen } from "@/screens/board-history-screen"
import { useBoardAtRisk } from "@/hooks/use-board-at-risk"
import type { MobileInbox, MobileWorkItem } from "@/domain/mobile-work-item"
import type {
  AtRiskDecisionValue,
  BoardRankingItem,
} from "@/services/board-mobile-data-source"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, spacing, typography } from "@/design/tokens"

interface AtRiskTarget {
  rankingId: string
  seriesId: string
  title: string
  evidence: string
  reason: string
}

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
  const [atRiskTarget, setAtRiskTarget] = useState<AtRiskTarget | null>(null)
  const [creatingSession, setCreatingSession] = useState(false)

  useEffect(() => {
    setSelectedSessionId(null)
    setAtRiskTarget(null)
    setCreatingSession(false)
  }, [tab])

  if (selectedSessionId) {
    return (
      <WorkspaceDetail onBack={() => setSelectedSessionId(null)}>
        <BoardSessionDetailScreen sessionId={selectedSessionId} />
      </WorkspaceDetail>
    )
  }

  if (atRiskTarget) {
    return (
      <WorkspaceDetail onBack={() => setAtRiskTarget(null)}>
        <BoardAtRiskDetail
          target={atRiskTarget}
          isChair={isChair}
          onDone={() => {
            setAtRiskTarget(null)
            void inbox.refetch()
          }}
        />
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
    if (item.kind === "AT_RISK") {
      const seriesId = typeof item.summary.seriesId === "string" ? item.summary.seriesId : ""
      if (!seriesId) return
      setAtRiskTarget({
        rankingId: item.entityId,
        seriesId,
        title: item.title,
        evidence: item.subtitle,
        reason: item.priority.reason,
      })
      return
    }
    if (item.entityType === "VOTING_SESSION") setSelectedSessionId(item.entityId)
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
    return (
      <BoardRankingScreen
        onOpenAtRisk={isChair ? (item) => setAtRiskTarget(rankingTarget(item)) : undefined}
      />
    )
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

  return (
    <BoardTodayScreen
      inbox={inbox.data}
      isLoading={inbox.isLoading}
      error={inbox.error}
      onRetry={() => void inbox.refetch()}
      onRefresh={() => void inbox.refetch()}
      refreshing={inbox.isRefetching}
      onSelect={selectInboxItem}
    />
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

function BoardAtRiskDetail({
  target,
  isChair,
  onDone,
}: {
  target: AtRiskTarget
  isChair: boolean
  onDone: () => void
}) {
  const { decide } = useBoardAtRisk(target.seriesId)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (input: { decision: AtRiskDecisionValue; note?: string }) => {
    decide.mutate(
      { rankingId: target.rankingId, ...input },
      {
        onError: (nextError) => {
          setError(
            nextError instanceof MobileApiError || nextError instanceof Error
              ? nextError.message
              : "Could not record this Board decision.",
          )
        },
        onSuccess: onDone,
      },
    )
  }

  return (
    <>
      <WorkflowDetailLayout title={target.title} subtitle="Backend at-risk evidence">
        <View style={styles.card}>
          <Text style={styles.label}>Ranking evidence</Text>
          <Text style={styles.value}>{target.evidence}</Text>
          <Text style={styles.label}>Backend reason</Text>
          <Text style={styles.value}>{target.reason}</Text>
          {isChair ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Review at-risk decision for ${target.title}`}
              onPress={() => {
                setError(null)
                setSheetOpen(true)
              }}
              style={styles.decisionButton}
            >
              <Text style={styles.decisionText}>Review decision</Text>
            </Pressable>
          ) : (
            <WorkflowState
              kind="empty"
              title="Read-only evidence"
              description="Only the Board Chair can record an at-risk decision."
            />
          )}
        </View>
      </WorkflowDetailLayout>
      <AtRiskDecisionSheet
        visible={sheetOpen}
        isBoardChair={isChair}
        seriesTitle={target.title}
        evidence={target.evidence}
        reason={target.reason}
        submitting={decide.isPending}
        errorMessage={error}
        onCancel={() => {
          if (decide.isPending) return
          setSheetOpen(false)
          setError(null)
        }}
        onConfirm={submit}
      />
    </>
  )
}

function rankingTarget(item: BoardRankingItem): AtRiskTarget {
  return {
    rankingId: item.id,
    seriesId: item.seriesId,
    title: item.seriesTitle,
    evidence: `Rank ${item.rank ?? "—"} · reader score ${item.readerScore ?? "—"} · final score ${item.finalScore ?? "—"}`,
    reason: "Backend ranking marked this series as at risk.",
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md },
  backText: { color: colors.primary, fontSize: typography.body, fontWeight: "700" },
  detail: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.sm,
  },
  label: { color: colors.textMuted, fontSize: typography.label, fontWeight: "800" },
  value: { color: colors.text, fontSize: typography.body, lineHeight: 21 },
  decisionButton: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  decisionText: { color: colors.surface, fontSize: typography.body, fontWeight: "800" },
})
