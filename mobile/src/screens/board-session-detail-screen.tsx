import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { WorkflowDetailLayout } from "@/components/workflow-detail-layout"
import { WorkflowConfirmationSheet } from "@/components/workflow-confirmation-sheet"
import { WorkflowState } from "@/components/workflow-state"
import { VoteProgress } from "@/components/vote-progress"
import { RevoteBanner } from "@/components/revote-banner"
import { useBoardSession } from "@/hooks/use-board-session"
import type { BoardSessionDetail, BoardVoteValue } from "@/services/board-mobile-data-source"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, spacing, typography } from "@/design/tokens"

function errorMessage(error: unknown): string {
  if (error instanceof MobileApiError || error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

const VOTE_CHOICES: BoardVoteValue[] = ["APPROVE", "REJECT", "ABSTAIN"]

export function BoardSessionDetailScreen({
  sessionId,
  getDetail,
}: {
  sessionId: string
  getDetail?: (id: string) => Promise<BoardSessionDetail>
}) {
  const { detail, vote } = useBoardSession(sessionId, getDetail)
  const [pendingVote, setPendingVote] = useState<BoardVoteValue | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)

  if (detail.isLoading && !detail.data) return <WorkflowState kind="loading" />
  if (detail.error && !detail.data) {
    return <WorkflowState kind="error" error={detail.error as Error} onRetry={() => void detail.refetch()} />
  }
  const data = detail.data
  if (!data) return null

  const voteAction = data.actions.find((action) => action.action === "VOTE")
  const canVote = voteAction?.enabled ?? false

  const confirmVote = () => {
    if (!pendingVote || !data.session.proposalId) return
    vote.mutate(
      { proposalId: data.session.proposalId, value: pendingVote, expectedVersion: data.session.version },
      {
        onError: (error) => setSheetError(errorMessage(error)),
        onSuccess: () => {
          setPendingVote(null)
          setSheetError(null)
        },
      },
    )
  }

  return (
    <>
      <WorkflowDetailLayout
        title={data.proposal?.title ?? data.session.title}
        subtitle={`Session ${data.session.status}`}
      >
        {data.session.isReVote ? <RevoteBanner /> : null}
        <VoteProgress
          approve={data.tally.approve}
          reject={data.tally.reject}
          quorum={data.tally.quorum}
          eligible={data.tally.eligible}
          canFinalize={data.tally.canFinalize}
        />
        {data.myVote?.decision ? (
          <Text style={styles.myVote}>You voted: {data.myVote.decision}</Text>
        ) : null}

        <View style={styles.voteCard}>
          <Text style={styles.sectionLabel}>Cast your vote</Text>
          {canVote ? (
            <View style={styles.choices}>
              {VOTE_CHOICES.map((choice) => (
                <Pressable
                  key={choice}
                  accessibilityRole="button"
                  accessibilityLabel={choice === "APPROVE" ? "Approve" : choice === "REJECT" ? "Reject" : "Abstain"}
                  onPress={() => {
                    setSheetError(null)
                    setPendingVote(choice)
                  }}
                  style={styles.choice}
                >
                  <Text style={styles.choiceText}>{choice}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.reason}>{voteAction?.disabledReason ?? "Voting is not available."}</Text>
          )}
        </View>
      </WorkflowDetailLayout>

      <WorkflowConfirmationSheet
        visible={pendingVote !== null}
        title={pendingVote ? `Vote ${pendingVote}?` : ""}
        effect="Your vote is recorded against the current session snapshot and cannot be changed this round."
        confirmLabel="Confirm vote"
        submitting={vote.isPending}
        errorMessage={sheetError}
        onCancel={() => {
          setPendingVote(null)
          setSheetError(null)
        }}
        onConfirm={confirmVote}
      />
    </>
  )
}

const styles = StyleSheet.create({
  myVote: { fontSize: typography.body, fontWeight: "700", color: colors.primary },
  voteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: { fontSize: typography.label, fontWeight: "800", color: colors.textMuted },
  choices: { flexDirection: "row", gap: spacing.sm },
  choice: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: { color: colors.primary, fontWeight: "800", fontSize: typography.body },
  reason: { fontSize: typography.body, color: colors.textMuted },
})
