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
import { colors, radius, spacing, typography } from "@/design/tokens"

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
        actionBar={
          <WorkflowActionBar
            actions={data.actions}
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
          <Text style={styles.sectionLabel}>Pages</Text>
          <Text style={styles.body}>{data.pages.length} page(s)</Text>
          <Text style={styles.sectionLabel}>Evidence</Text>
          <Text style={styles.body}>
            {data.evidence.taskCount} task(s) · {data.evidence.currentSubmissionCount} approved
            submission(s)
          </Text>
        </View>
        <SubmittedFilesPanel
          files={reviewFiles.data ?? []}
          loading={reviewFiles.isLoading}
          errorText={reviewFiles.error ? "Could not load submitted files." : null}
        />
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Blocking comments</Text>
          {data.blockers.length === 0 ? <Text style={styles.body}>None.</Text> : null}
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
  },
  sectionLabel: { fontSize: typography.label, fontWeight: "800", color: colors.textMuted },
  body: { fontSize: typography.body, color: colors.text },
})
