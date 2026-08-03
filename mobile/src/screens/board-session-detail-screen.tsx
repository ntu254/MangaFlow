import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { WorkflowDetailLayout } from "@/components/workflow-detail-layout"
import { WorkflowConfirmationSheet } from "@/components/workflow-confirmation-sheet"
import { WorkflowState } from "@/components/workflow-state"
import { VoteProgress } from "@/components/vote-progress"
import { RevoteBanner } from "@/components/revote-banner"
import { SubmittedFilesPanel } from "@/components/submitted-files-panel"
import { useBoardSession } from "@/hooks/use-board-session"
import type { BoardSessionDetail, BoardVoteValue } from "@/services/board-mobile-data-source"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, spacing, typography } from "@/design/tokens"

function errorMessage(error: unknown): string {
  if (error instanceof MobileApiError || error instanceof Error)
    return error.message;
  return "Something went wrong. Please try again.";
}

const VOTE_CHOICES: BoardVoteValue[] = ["APPROVE", "REJECT"];

export function BoardSessionDetailScreen({
  sessionId,
  getDetail,
}: {
  sessionId: string;
  getDetail?: (id: string) => Promise<BoardSessionDetail>;
}) {
  const { detail, vote, close, cancel, reviewFiles } = useBoardSession(sessionId, getDetail)
  const [pendingVote, setPendingVote] = useState<BoardVoteValue | null>(null)
  const [pendingChair, setPendingChair] = useState<"SESSION_FINALIZE" | "SESSION_CANCEL" | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (detail.isLoading && !detail.data) return <WorkflowState kind="loading" />;
  if (detail.error && !detail.data) {
    return (
      <WorkflowState
        kind="error"
        context="this voting session"
        error={detail.error as Error}
        onRetry={() => void detail.refetch()}
      />
    );
  }
  const data = detail.data;
  if (!data) return null;

  const voteAction = data.actions.find((action) => action.action === "VOTE");
  const versionReady =
    typeof data.session.version === "number" && data.session.version >= 0;
  const canVote = (voteAction?.enabled ?? false) && versionReady;
  const closeAction = data.actions.find(
    (action) => action.action === "SESSION_FINALIZE",
  );
  const cancelAction = data.actions.find(
    (action) => action.action === "SESSION_CANCEL",
  );
  const chairSubmitting = close.isPending || cancel.isPending;
  const currentVote = data.currentUserVote ?? data.myVote;
  const priorRound =
    data.previousRound ??
    (data.session.reVoteOfSessionId
      ? {
          id: data.session.reVoteOfSessionId,
          status: "TIED",
          proposalVersionId: data.session.proposalVersionId,
        }
      : null);

  const handleMutationError = (error: unknown) => {
    if (error instanceof MobileApiError && error.status === 409) {
      setSheetError(
        "This voting round changed. Review refreshed details, then confirm again.",
      );
      void detail.refetch();
      return;
    }
    setSheetError(errorMessage(error));
  };

  const confirmChair = (note: string) => {
    if (!pendingChair) return;
    if (pendingChair === "SESSION_FINALIZE") {
      if (!versionReady) {
        setSheetError(
          "Session version is unavailable. Refresh before closing.",
        );
        return;
      }
      close.mutate(
        {
          expectedVersion: data.session.version as number,
          note: note || undefined,
        },
        {
          onError: handleMutationError,
          onSuccess: (result) => {
            setSuccessMessage(closeResultMessage(result.status));
            setPendingChair(null);
            setSheetError(null);
          },
        },
      );
    } else {
      cancel.mutate(undefined, {
        onError: handleMutationError,
        onSuccess: () => {
          setSuccessMessage(
            "Session cancelled. The proposal returned to the Board queue.",
          );
          setPendingChair(null);
          setSheetError(null);
        },
      });
    }
  };

  const confirmVote = (note: string) => {
    if (!pendingVote || !data.session.proposalId || !versionReady) return;
    vote.mutate(
      {
        proposalId: data.session.proposalId,
        value: pendingVote,
        expectedVersion: data.session.version as number,
        note: note || undefined,
      },
      {
        onError: handleMutationError,
        onSuccess: () => {
          setSuccessMessage("Vote recorded");
          setPendingVote(null);
          setSheetError(null);
        },
      },
    );
  };

  const historicalTieBreak =
    data.session.status === "TIED" ||
    data.session.status === "TIE_BREAK_REQUIRED";

  return (
    <>
      <WorkflowDetailLayout
        title={data.proposal?.title ?? data.session.title}
        subtitle={
          historicalTieBreak
            ? "Historical tie-break record · read-only"
            : `Session ${data.session.status}`
        }
      >
        {priorRound ? (
          <RevoteBanner
            previousRoundId={priorRound.id}
            previousRoundStatus={priorRound.status}
            proposalVersionId={
              priorRound.proposalVersionId ?? data.session.proposalVersionId
            }
          />
        ) : null}

        <View style={styles.evidenceCard}>
          <Text style={styles.sectionLabel}>Backend session snapshot</Text>
          <Text style={styles.evidenceText}>
            Session {data.session.id} · version{" "}
            {data.session.version ?? "unavailable"}
          </Text>
          {data.session.proposalVersionId || data.proposal?.version ? (
            <Text style={styles.evidenceText}>
              Proposal snapshot{" "}
              {String(data.session.proposalVersionId ?? data.proposal?.version)}
            </Text>
          ) : null}
          {data.proposal?.editorRecommendation ? (
            <Text style={styles.evidenceText}>
              Editor recommendation: {data.proposal.editorRecommendation}
            </Text>
          ) : null}
          {data.session.closesAt ? (
            <Text style={styles.evidenceText}>
              Closes {new Date(data.session.closesAt).toLocaleString()}
            </Text>
          ) : null}
        </View>

        <SubmittedFilesPanel
          files={reviewFiles.data ?? []}
          loading={reviewFiles.isLoading}
          errorText={reviewFiles.error ? "Could not load submitted files." : null}
        />

        <VoteProgress
          approve={data.tally.approve}
          reject={data.tally.reject}
          total={data.tally.total}
          quorum={data.tally.quorum}
          eligible={data.tally.eligible}
          canFinalize={data.tally.canFinalize}
        />

        <Text style={styles.myVote}>
          {currentVote?.decision
            ? `You voted: ${currentVote.decision}`
            : "You have not voted in this round."}
        </Text>
        {successMessage ? (
          <Text accessibilityRole="alert" style={styles.success}>
            {successMessage}
          </Text>
        ) : null}

        <View style={styles.voteCard}>
          <Text style={styles.sectionLabel}>Cast your vote</Text>
          {canVote ? (
            <View style={styles.choices}>
              {VOTE_CHOICES.map((choice) => (
                <Pressable
                  key={choice}
                  accessibilityRole="button"
                  accessibilityLabel={
                    choice === "APPROVE" ? "Approve" : "Reject"
                  }
                  onPress={() => {
                    setSuccessMessage(null);
                    setSheetError(null);
                    setPendingVote(choice);
                  }}
                  style={styles.choice}
                >
                  <Text style={styles.choiceText}>{choice}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.reason}>
              {!versionReady
                ? "Session version is unavailable. Refresh before voting."
                : (voteAction?.disabledReason ?? "Voting is not available.")}
            </Text>
          )}
        </View>

        {closeAction || cancelAction ? (
          <View style={styles.voteCard}>
            <Text style={styles.sectionLabel}>Chair actions</Text>
            {closeAction ? (
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close voting"
                  accessibilityState={{ disabled: !closeAction.enabled }}
                  disabled={!closeAction.enabled}
                  onPress={() => {
                    setSuccessMessage(null);
                    setSheetError(null);
                    setPendingChair("SESSION_FINALIZE");
                  }}
                  style={[
                    styles.chairButton,
                    !closeAction.enabled && styles.chairDisabled,
                  ]}
                >
                  <Text style={styles.chairText}>Close voting</Text>
                </Pressable>
                {!closeAction.enabled && closeAction.disabledReason ? (
                  <Text style={styles.reason}>
                    {closeAction.disabledReason}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {cancelAction ? (
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel session"
                  accessibilityState={{ disabled: !cancelAction.enabled }}
                  disabled={!cancelAction.enabled}
                  onPress={() => {
                    setSuccessMessage(null);
                    setSheetError(null);
                    setPendingChair("SESSION_CANCEL");
                  }}
                  style={[
                    styles.chairButton,
                    styles.chairCancel,
                    !cancelAction.enabled && styles.chairDisabled,
                  ]}
                >
                  <Text style={[styles.chairText, styles.chairCancelText]}>
                    Cancel session
                  </Text>
                </Pressable>
                {!cancelAction.enabled && cancelAction.disabledReason ? (
                  <Text style={styles.reason}>
                    {cancelAction.disabledReason}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {data.notes?.length ? (
          <View style={styles.evidenceCard}>
            <Text style={styles.sectionLabel}>Session notes</Text>
            {data.notes.map((note) => (
              <Text key={note.id} style={styles.evidenceText}>
                {note.authorName ? `${note.authorName}: ` : ""}
                {note.text}
              </Text>
            ))}
          </View>
        ) : null}
      </WorkflowDetailLayout>

      <WorkflowConfirmationSheet
        visible={pendingVote !== null}
        title={pendingVote ? `Vote ${pendingVote}?` : ""}
        effect="This records one vote against the current backend session snapshot. It does not finalize the proposal."
        confirmLabel={
          pendingVote === "APPROVE" ? "Confirm approve" : "Confirm reject"
        }
        reasonLabel="Optional vote note"
        submitting={vote.isPending}
        errorMessage={sheetError}
        onCancel={() => {
          if (vote.isPending) return;
          setPendingVote(null);
          setSheetError(null);
        }}
        onConfirm={confirmVote}
      />

      <WorkflowConfirmationSheet
        visible={pendingChair !== null}
        title={
          pendingChair === "SESSION_FINALIZE"
            ? "Close this voting round?"
            : "Cancel this session?"
        }
        effect={
          pendingChair === "SESSION_FINALIZE"
            ? "The backend closes the round and determines the result: finalized decision, no quorum, or a fresh re-vote after a tie."
            : "The backend cancels the open session and returns its proposal to PENDING_BOARD."
        }
        confirmLabel={
          pendingChair === "SESSION_FINALIZE"
            ? "Confirm close"
            : "Confirm cancel"
        }
        reasonLabel={
          pendingChair === "SESSION_FINALIZE"
            ? "Optional closing note"
            : cancelAction?.requiresReason
              ? "Cancellation reason"
              : undefined
        }
        requireReason={
          pendingChair === "SESSION_CANCEL" &&
          cancelAction?.requiresReason === true
        }
        submitting={chairSubmitting}
        errorMessage={sheetError}
        onCancel={() => {
          if (chairSubmitting) return;
          setPendingChair(null);
          setSheetError(null);
        }}
        onConfirm={confirmChair}
      />
    </>
  );
}

function closeResultMessage(status: string): string {
  if (status === "TIED")
    return "Voting round tied. The backend opened a fresh re-vote.";
  if (status === "NO_QUORUM")
    return "Voting round closed without quorum. The proposal returned to the Board queue.";
  if (status === "FINALIZED")
    return "Voting round finalized. The backend decision is now immutable.";
  return `Voting round closed with status ${status}.`;
}

const styles = StyleSheet.create({
  myVote: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.primary,
  },
  success: {
    color: colors.success,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontWeight: "700",
  },
  evidenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.xs,
  },
  evidenceText: { fontSize: typography.body, color: colors.textMuted },
  voteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.label,
    fontWeight: "800",
    color: colors.textMuted,
  },
  choices: { flexDirection: "row", gap: spacing.sm },
  choice: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: typography.body,
  },
  reason: { fontSize: typography.body, color: colors.textMuted },
  chairButton: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  chairCancel: { backgroundColor: colors.dangerSoft },
  chairCancelText: { color: colors.danger },
  chairDisabled: { backgroundColor: colors.surfaceContainer },
  chairText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: typography.body,
  },
});
