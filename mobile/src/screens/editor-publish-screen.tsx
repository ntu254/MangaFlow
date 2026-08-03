import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { WorkflowDetailLayout } from "@/components/workflow-detail-layout"
import { WorkflowActionBar, type WorkflowActionDescriptor } from "@/components/workflow-action-bar"
import { WorkflowState } from "@/components/workflow-state"
import {
  PublicationConfirmation,
  type PublicationAction,
} from "@/components/publication-confirmation"
import { useEditorChapter } from "@/hooks/use-editor-chapter"
import { useEditorPublications } from "@/hooks/use-editor-publications"
import type { EditorChapterDetail } from "@/services/editor-mobile-data-source"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, spacing, typography } from "@/design/tokens"

function errorMessage(error: unknown): string {
  if (error instanceof MobileApiError || error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

const PUBLICATION_ACTIONS = new Set(["SCHEDULE", "POSTPONE", "PUBLISH"])

export function EditorPublishScreen({
  chapterId,
  getDetail,
}: {
  chapterId: string
  getDetail?: (id: string) => Promise<EditorChapterDetail>
}) {
  const { detail } = useEditorChapter(chapterId, getDetail)
  const { schedule, postpone, publish } = useEditorPublications(chapterId)
  const [pending, setPending] = useState<PublicationAction | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)

  if (detail.isLoading && !detail.data) return <WorkflowState kind="loading" />
  if (detail.error && !detail.data) {
    return <WorkflowState kind="error" error={detail.error as Error} onRetry={() => void detail.refetch()} />
  }
  const data = detail.data
  if (!data) return null

  const publicationActions = data.actions.filter((action) =>
    PUBLICATION_ACTIONS.has(action.action),
  )
  const submitting = schedule.isPending || postpone.isPending || publish.isPending
  const busyAction =
    (schedule.isPending && "SCHEDULE") ||
    (postpone.isPending && "POSTPONE") ||
    (publish.isPending && "PUBLISH") ||
    null

  const onConfirm = (payload: { scheduledAt?: string }) => {
    if (!pending) return
    const onError = (error: unknown) => setSheetError(errorMessage(error))
    const onSuccess = () => {
      setPending(null)
      setSheetError(null)
    }
    if (pending === "SCHEDULE" && payload.scheduledAt)
      schedule.mutate({ scheduledAt: payload.scheduledAt }, { onError, onSuccess })
    else if (pending === "POSTPONE") postpone.mutate(undefined, { onError, onSuccess })
    else if (pending === "PUBLISH") publish.mutate(undefined, { onError, onSuccess })
  }

  return (
    <>
      <WorkflowDetailLayout
        title={data.chapter.title}
        subtitle={`Publication · ${data.publication?.status ?? "DRAFT"}`}
        actionBar={
          <WorkflowActionBar
            actions={publicationActions}
            onAction={(descriptor: WorkflowActionDescriptor) => {
              setSheetError(null)
              setPending(descriptor.action as PublicationAction)
            }}
            busyAction={busyAction}
          />
        }
      >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Status</Text>
          <Text style={styles.body}>{data.publication?.status ?? "Not scheduled"}</Text>
          {data.publication?.scheduledAt ? (
            <Text style={styles.body}>Scheduled for {data.publication.scheduledAt}</Text>
          ) : null}
        </View>
      </WorkflowDetailLayout>

      <PublicationConfirmation
        visible={pending !== null}
        action={pending}
        chapterTitle={data.chapter.title}
        readinessReady={data.readiness.ready}
        submitting={submitting}
        errorMessage={sheetError}
        onCancel={() => {
          setPending(null)
          setSheetError(null)
        }}
        onConfirm={onConfirm}
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
