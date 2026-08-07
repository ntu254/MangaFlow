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
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"

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
    return (
      <WorkflowState
        kind="error"
        context="this publication"
        error={detail.error as Error}
        onRetry={() => void detail.refetch()}
      />
    )
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
        actions={
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
          <View style={styles.headerRow}>
            <Text style={styles.sectionLabel}>Publication Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{data.publication?.status ?? "DRAFT"}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Publication Cadence:</Text>
            <Text style={styles.infoValue}>
              {data.series.publicationType === "WEEKLY" ? "Weekly Series" : "Monthly Series"}
            </Text>
          </View>
          {data.publication?.scheduledAt ? (
            <View style={styles.scheduledBox}>
              <Text style={styles.scheduledLabel}>Scheduled Release Time:</Text>
              <Text style={styles.scheduledValue}>{data.publication.scheduledAt}</Text>
            </View>
          ) : (
            <Text style={styles.bodyMuted}>This chapter is ready to be scheduled or published immediately.</Text>
          )}
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
    gap: spacing.sm,
    shadowColor: shadow.card.shadowColor,
    shadowOpacity: shadow.card.shadowOpacity,
    shadowRadius: shadow.card.shadowRadius,
    shadowOffset: shadow.card.shadowOffset,
    elevation: shadow.card.elevation,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: { fontSize: typography.label, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  statusBadge: {
    backgroundColor: colors.infoSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: { fontSize: typography.label, fontWeight: "700", color: colors.infoText },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontSize: typography.body, color: colors.textMuted },
  infoValue: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  scheduledBox: {
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    gap: 2,
  },
  scheduledLabel: { fontSize: typography.label, color: colors.primary, fontWeight: "700" },
  scheduledValue: { fontSize: typography.body, fontWeight: "800", color: colors.primaryPressed },
  bodyMuted: { fontSize: typography.body, color: colors.textMuted },
})

