import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { WorkflowDetailLayout } from "@/components/workflow-detail-layout"
import {
  WorkflowActionBar,
  actionLabel,
  type WorkflowActionDescriptor,
} from "@/components/workflow-action-bar"
import { WorkflowConfirmationSheet } from "@/components/workflow-confirmation-sheet"
import { WorkflowState } from "@/components/workflow-state"
import { ReadinessEvidence } from "@/components/readiness-evidence"
import { CommentThread, type MobileComment } from "@/components/comment-thread"
import { SubmittedFilesPanel } from "@/components/submitted-files-panel"
import { useEditorChapter } from "@/hooks/use-editor-chapter"
import { useEditorComments } from "@/hooks/use-editor-comments"
import type { EditorChapterDetail } from "@/services/editor-mobile-data-source"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"

function errorMessage(error: unknown): string {
  if (error instanceof MobileApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

// Blocker status drives which lifecycle action the Tantou can take: an
// ADDRESSED comment can be resolved; a RESOLVED one can be reopened.
function toMobileComment(blocker: EditorChapterDetail["blockers"][number]): MobileComment {
  return {
    id: blocker.id,
    author: "You",
    status: blocker.status,
    isBlocking: true,
    targetLabel: `${blocker.targetType} ${blocker.targetId}`,
    body: blocker.body,
    actions: [
      {
        action: "COMMENT_RESOLVE",
        enabled: blocker.status === "ADDRESSED",
        disabledReason: blocker.status === "ADDRESSED" ? null : "Comment is not awaiting resolution.",
        requiresConfirmation: true,
        requiresReason: false,
      },
      {
        action: "COMMENT_REOPEN",
        enabled: blocker.status === "RESOLVED",
        disabledReason: blocker.status === "RESOLVED" ? null : "Only a resolved comment can be reopened.",
        requiresConfirmation: true,
        requiresReason: false,
      },
    ],
  }
}

// This screen implements the Tantou review decisions and nothing else. Once a
// chapter reaches READY_FOR_PUBLICATION the backend starts returning
// SCHEDULE/POSTPONE/PUBLISH here too, but `run` below has no branch for them,
// so rendering them would show buttons whose confirmation silently does
// nothing. Scheduling and publishing belong to the Publish tab
// (EditorPublishScreen), which owns those mutations.
const REVIEW_ACTIONS = new Set(["REQUEST_REVISION", "REJECT", "EDITOR_APPROVE"])

export function EditorChapterDetailScreen({
  chapterId,
  getDetail,
}: {
  chapterId: string
  getDetail?: (id: string) => Promise<EditorChapterDetail>
}) {
  const { detail, requestRevision, reject, approve, reviewFiles } = useEditorChapter(
    chapterId,
    getDetail,
  )
  const comments = useEditorComments(chapterId)
  const [pending, setPending] = useState<WorkflowActionDescriptor | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)

  if (detail.isLoading && !detail.data) return <WorkflowState kind="loading" />
  if (detail.error && !detail.data) {
    return (
      <WorkflowState
        kind="error"
        context="this chapter"
        error={detail.error as Error}
        onRetry={() => void detail.refetch()}
      />
    )
  }
  const data = detail.data
  if (!data) return null

  const busyAction =
    (requestRevision.isPending && "REQUEST_REVISION") ||
    (reject.isPending && "REJECT") ||
    (approve.isPending && "EDITOR_APPROVE") ||
    null

  const run = (reason: string) => {
    if (!pending) return
    const onError = (error: unknown) => setSheetError(errorMessage(error))
    const onSuccess = () => {
      setPending(null)
      setSheetError(null)
    }
    if (pending.action === "REQUEST_REVISION")
      requestRevision.mutate({ comment: reason }, { onError, onSuccess })
    else if (pending.action === "REJECT") reject.mutate({ comment: reason }, { onError, onSuccess })
    else if (pending.action === "EDITOR_APPROVE") approve.mutate(undefined, { onError, onSuccess })
  }

  const approveEffect = `Approve the frozen snapshot of ${data.chapter.title} (chapter ${data.chapter.number}). This moves the chapter to publication readiness.`

  return (
    <>
      <WorkflowDetailLayout
        title={data.chapter.title}
        subtitle={`${data.chapter.status} · Chapter ${data.chapter.number}`}
        actions={
          <WorkflowActionBar
            actions={data.actions.filter((descriptor) => REVIEW_ACTIONS.has(descriptor.action))}
            onAction={(descriptor) => {
              setSheetError(null)
              setPending(descriptor)
            }}
            busyAction={busyAction}
          />
        }
      >
        <ReadinessEvidence readiness={data.readiness} />
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Chapter Metrics & Evidence</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.pages.length}</Text>
              <Text style={styles.statLabel}>Pages</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.evidence.taskCount}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.evidence.currentSubmissionCount}</Text>
              <Text style={styles.statLabel}>Submissions</Text>
            </View>
          </View>
        </View>
        <SubmittedFilesPanel
          files={reviewFiles.data ?? []}
          loading={reviewFiles.isLoading}
          errorText={reviewFiles.error ? "Could not load submitted files." : null}
        />
        <View style={styles.card}>
          <View style={styles.blockerHeaderRow}>
            <Text style={styles.sectionLabel}>Blocking comments</Text>
            <View style={[styles.blockerBadge, { backgroundColor: data.blockers.length > 0 ? colors.dangerSoft : colors.successSoft }]}>
              <Text style={[styles.blockerBadgeText, { color: data.blockers.length > 0 ? colors.dangerText : colors.successText }]}>
                {data.blockers.length === 0 ? "Resolved" : `${data.blockers.length} Active`}
              </Text>
            </View>
          </View>
          {data.blockers.length === 0 ? (
            <Text style={styles.bodyMuted}>No blocking comments currently on this chapter.</Text>
          ) : null}
        </View>
        {data.blockers.map((blocker) => (
          <CommentThread
            key={blocker.id}
            comment={toMobileComment(blocker)}
            onResolve={(id) => comments.resolve.mutate(id)}
            onReopen={(id) => comments.reopen.mutate(id)}
            onReply={(id, body) => comments.reply.mutateAsync({ commentId: id, body })}
          />
        ))}
      </WorkflowDetailLayout>

      <WorkflowConfirmationSheet
        visible={pending !== null}
        title={pending ? `${actionLabel(pending.action)} — ${data.chapter.title}` : ""}
        effect={pending?.action === "EDITOR_APPROVE" ? approveEffect : "This decision is recorded and notifies the Mangaka."}
        confirmLabel={pending ? `Confirm ${actionLabel(pending.action).toLowerCase()}` : "Confirm"}
        reasonLabel={pending?.requiresReason ? "Reason" : undefined}
        requireReason={pending?.requiresReason ?? false}
        submitting={busyAction === pending?.action}
        errorMessage={sheetError}
        onCancel={() => {
          setPending(null)
          setSheetError(null)
        }}
        onConfirm={run}
      />
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: shadow.card.shadowColor,
    shadowOpacity: shadow.card.shadowOpacity,
    shadowRadius: shadow.card.shadowRadius,
    shadowOffset: shadow.card.shadowOffset,
    elevation: shadow.card.elevation,
  },
  sectionLabel: { fontSize: typography.label, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  body: { fontSize: typography.body, color: colors.text },
  bodyMuted: { fontSize: typography.body, color: colors.textMuted },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: "center",
  },
  statValue: { fontSize: typography.title, fontWeight: "800", color: colors.primary },
  statLabel: { fontSize: typography.label, color: colors.textMuted, fontWeight: "600" },
  blockerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  blockerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  blockerBadgeText: {
    fontSize: typography.label,
    fontWeight: "700",
  },
})

