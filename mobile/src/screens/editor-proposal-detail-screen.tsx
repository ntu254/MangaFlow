import { useEffect, useState } from "react"
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { WorkflowDetailLayout } from "@/components/workflow-detail-layout"
import {
  WorkflowActionBar,
  actionLabel,
  type WorkflowActionDescriptor,
} from "@/components/workflow-action-bar"
import { WorkflowConfirmationSheet } from "@/components/workflow-confirmation-sheet"
import { WorkflowState } from "@/components/workflow-state"
import { useEditorProposal } from "@/hooks/use-editor-proposal"
import type { EditorProposalDetail } from "@/services/editor-mobile-data-source"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, spacing, typography } from "@/design/tokens"

function errorMessage(error: unknown): string {
  if (error instanceof MobileApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

export function EditorProposalDetailScreen({
  proposalId,
  getDetail,
}: {
  proposalId: string
  getDetail?: (id: string) => Promise<EditorProposalDetail>
}) {
  const { detail, claim, requestChanges, reject, forward } = useEditorProposal(proposalId, getDetail)
  const [pending, setPending] = useState<WorkflowActionDescriptor | null>(null)
  const [forwardOpen, setForwardOpen] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)

  if (detail.isLoading && !detail.data) return <WorkflowState kind="loading" />
  if (detail.error && !detail.data) {
    return <WorkflowState kind="error" error={detail.error as Error} onRetry={() => void detail.refetch()} />
  }
  const data = detail.data
  if (!data) return null

  const onAction = (descriptor: WorkflowActionDescriptor) => {
    setSheetError(null)
    if (descriptor.action === "FORWARD") {
      setForwardOpen(true)
      return
    }
    setPending(descriptor)
  }

  const busyAction =
    (claim.isPending && "CLAIM") ||
    (requestChanges.isPending && "REQUEST_CHANGES") ||
    (reject.isPending && "REJECT") ||
    (forward.isPending && "FORWARD") ||
    null

  const runSimple = (reason: string) => {
    if (!pending) return
    const onError = (error: unknown) => setSheetError(errorMessage(error))
    const onSuccess = () => {
      setPending(null)
      setSheetError(null)
    }
    if (pending.action === "CLAIM") claim.mutate(undefined, { onError, onSuccess })
    else if (pending.action === "REQUEST_CHANGES")
      requestChanges.mutate({ comment: reason }, { onError, onSuccess })
    else if (pending.action === "REJECT") reject.mutate({ reason }, { onError, onSuccess })
  }

  return (
    <>
      <WorkflowDetailLayout
        title={data.proposal.title}
        subtitle={`${data.proposal.status} · ${data.proposal.requestedPublicationType}`}
        actionBar={<WorkflowActionBar actions={data.actions} onAction={onAction} busyAction={busyAction} />}
      >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Claim</Text>
          <Text style={styles.body}>
            {data.claim.claimedByEditorName
              ? `Claimed by ${data.claim.claimedByEditorName}${data.claim.claimedByMe ? " (you)" : ""}`
              : "Unclaimed"}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Logline</Text>
          <Text style={styles.body}>{data.proposal.logline || "—"}</Text>
          <Text style={styles.sectionLabel}>Synopsis</Text>
          <Text style={styles.body}>{data.proposal.synopsis || "—"}</Text>
        </View>
        {data.currentManuscript ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Current manuscript</Text>
            <Text style={styles.body}>
              v{data.currentManuscript.version} · {data.currentManuscript.status}
            </Text>
          </View>
        ) : null}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>History</Text>
          {data.history.length === 0 ? (
            <Text style={styles.body}>No history yet.</Text>
          ) : (
            data.history.map((event) => (
              <Text key={event.id} style={styles.historyRow}>
                {event.type}
                {event.toStatus ? ` → ${event.toStatus}` : ""}
                {event.actorName ? ` · ${event.actorName}` : ""}
              </Text>
            ))
          )}
        </View>
      </WorkflowDetailLayout>

      <WorkflowConfirmationSheet
        visible={pending !== null && pending.action !== "FORWARD"}
        title={pending ? `${actionLabel(pending.action)} — ${data.proposal.title}` : ""}
        effect={
          pending?.action === "CLAIM"
            ? "Claiming assigns this proposal to you. If another editor already claimed it, this fails."
            : "This decision is recorded and notifies the Mangaka."
        }
        confirmLabel={pending ? `Confirm ${actionLabel(pending.action).toLowerCase()}` : "Confirm"}
        reasonLabel={pending?.requiresReason ? "Reason" : undefined}
        requireReason={pending?.requiresReason ?? false}
        submitting={busyAction === pending?.action}
        errorMessage={sheetError}
        onCancel={() => {
          setPending(null)
          setSheetError(null)
        }}
        onConfirm={runSimple}
      />

      <ForwardSheet
        visible={forwardOpen}
        proposalTitle={data.proposal.title}
        defaultPublicationType={data.proposal.requestedPublicationType}
        submitting={forward.isPending}
        errorMessage={sheetError}
        onCancel={() => {
          setForwardOpen(false)
          setSheetError(null)
        }}
        onConfirm={(input) =>
          forward.mutate(input, {
            onError: (error) => setSheetError(errorMessage(error)),
            onSuccess: () => {
              setForwardOpen(false)
              setSheetError(null)
            },
          })
        }
      />
    </>
  )
}

// Forward needs a recommendation and cadence; the recommendation is required
// and never synthesized. The draft is preserved across a failed confirm.
function ForwardSheet({
  visible,
  proposalTitle,
  defaultPublicationType,
  submitting,
  errorMessage: externalError,
  onCancel,
  onConfirm,
}: {
  visible: boolean
  proposalTitle: string
  defaultPublicationType: "WEEKLY" | "MONTHLY"
  submitting: boolean
  errorMessage: string | null
  onCancel: () => void
  onConfirm: (input: {
    editorRecommendation: string
    feasibilityNote: string
    suggestedPublicationType: "WEEKLY" | "MONTHLY"
  }) => void
}) {
  const [recommendation, setRecommendation] = useState("")
  const [feasibility, setFeasibility] = useState("")
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY">(defaultPublicationType)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      setRecommendation("")
      setFeasibility("")
      setPublicationType(defaultPublicationType)
      setLocalError(null)
    }
  }, [defaultPublicationType, visible])

  const confirm = () => {
    if (recommendation.trim().length === 0) {
      setLocalError("Editor recommendation is required.")
      return
    }
    setLocalError(null)
    onConfirm({
      editorRecommendation: recommendation.trim(),
      feasibilityNote: feasibility.trim(),
      suggestedPublicationType: publicationType,
    })
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!submitting) onCancel()
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.sheetTitle}>
            Forward {proposalTitle} to Board
          </Text>
          <Text style={styles.body}>
            Forwarding hands this proposal to Board governance. Board review opens only through the
            Board session workflow.
          </Text>
          <TextInput
            accessibilityLabel="Editor recommendation"
            placeholder="Editor recommendation"
            value={recommendation}
            onChangeText={setRecommendation}
            multiline
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Feasibility note"
            placeholder="Feasibility note (optional)"
            value={feasibility}
            onChangeText={setFeasibility}
            multiline
            style={styles.input}
          />
          <View style={styles.cadenceRow}>
            {(["WEEKLY", "MONTHLY"] as const).map((type) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityLabel={`Cadence ${type}`}
                accessibilityState={{ selected: publicationType === type }}
                onPress={() => setPublicationType(type)}
                style={[styles.cadenceChip, publicationType === type && styles.cadenceChipActive]}
              >
                <Text
                  style={[
                    styles.cadenceText,
                    publicationType === type && styles.cadenceTextActive,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
          {localError || externalError ? (
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
              {localError ?? externalError}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessibilityState={{ disabled: submitting }}
              disabled={submitting}
              onPress={onCancel}
              style={[styles.sheetButton, styles.cancel, submitting && styles.disabled]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm forward"
              accessibilityState={{ disabled: submitting, busy: submitting }}
              disabled={submitting}
              onPress={confirm}
              style={[styles.sheetButton, styles.confirm, submitting && styles.disabled]}
            >
              <Text style={styles.confirmText}>Confirm forward</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  historyRow: { fontSize: typography.label, color: colors.textMuted },
  backdrop: { flex: 1, backgroundColor: "rgba(29,26,33,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sheetTitle: { fontSize: typography.title, fontWeight: "700", color: colors.text },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    textAlignVertical: "top",
  },
  cadenceRow: { flexDirection: "row", gap: spacing.sm },
  cadenceChip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  cadenceChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  cadenceText: { color: colors.textMuted, fontWeight: "700", fontSize: typography.body },
  cadenceTextActive: { color: colors.primary },
  error: { color: colors.danger, fontSize: typography.body },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  sheetButton: { flex: 1, minHeight: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  cancel: { backgroundColor: colors.surfaceContainer },
  cancelText: { color: colors.text, fontWeight: "600", fontSize: typography.body },
  confirm: { backgroundColor: colors.primary },
  confirmText: { color: colors.surface, fontWeight: "700", fontSize: typography.body },
  disabled: { opacity: 0.6 },
})
