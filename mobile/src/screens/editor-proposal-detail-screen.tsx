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
import { SubmittedFilesPanel } from "@/components/submitted-files-panel"
import { useEditorProposal } from "@/hooks/use-editor-proposal"
import type { EditorialChecklist, EditorProposalDetail } from "@/services/editor-mobile-data-source"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, spacing, typography } from "@/design/tokens"

function errorMessage(error: unknown): string {
  if (error instanceof MobileApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

const emptyEditorialChecklist: EditorialChecklist = {
  hook: false,
  characterMotivation: false,
  audienceFit: false,
  storyboardFlow: false,
  manuscriptQuality: false,
  serializePotential: false,
}

export function EditorProposalDetailScreen({
  proposalId,
  getDetail,
}: {
  proposalId: string
  getDetail?: (id: string) => Promise<EditorProposalDetail>
}) {
  const { detail, claim, releaseClaim, requestChanges, reject, forward, updateChecklist, reviewFiles } = useEditorProposal(
    proposalId,
    getDetail,
  )
  const [pending, setPending] = useState<WorkflowActionDescriptor | null>(null)
  const [forwardOpen, setForwardOpen] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [checklistDraft, setChecklistDraft] = useState<EditorialChecklist>(emptyEditorialChecklist)

  useEffect(() => {
    if (detail.data) setChecklistDraft(detail.data.editorialChecklist ?? emptyEditorialChecklist)
  }, [detail.data?.editorialChecklist])

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
    (releaseClaim.isPending && "RELEASE_CLAIM") ||
    (requestChanges.isPending && "REQUEST_CHANGES") ||
    (reject.isPending && "REJECT") ||
    (forward.isPending && "FORWARD") ||
    null

  const checklistComplete = Object.values(checklistDraft).filter(Boolean).length

  const runSimple = (reason: string) => {
    if (!pending) return
    const onError = (error: unknown) => setSheetError(errorMessage(error))
    const onSuccess = () => {
      setPending(null)
      setSheetError(null)
    }
    if (pending.action === "CLAIM") claim.mutate(undefined, { onError, onSuccess })
    else if (pending.action === "RELEASE_CLAIM") releaseClaim.mutate(undefined, { onError, onSuccess })
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
        {data.claim.claimedByEditorId ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Editorial checklist</Text>
            <Text style={styles.body}>{checklistComplete}/6 complete</Text>
            {data.claim.claimedByMe ? (
              <>
                <ChecklistControls checklist={checklistDraft} onChange={setChecklistDraft} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save checklist"
                  accessibilityState={{ disabled: updateChecklist.isPending }}
                  disabled={updateChecklist.isPending}
                  onPress={() => updateChecklist.mutate(checklistDraft)}
                  style={[styles.saveChecklist, updateChecklist.isPending && styles.disabled]}
                >
                  <Text style={styles.confirmText}>Save checklist</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
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
              Version {data.currentManuscript.version}
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
        <SubmittedFilesPanel
          files={reviewFiles.data ?? []}
          loading={reviewFiles.isLoading}
          errorText={reviewFiles.error ? "Could not load submitted files." : null}
        />
      </WorkflowDetailLayout>

      <WorkflowConfirmationSheet
        visible={pending !== null && pending.action !== "FORWARD"}
        title={pending ? `${actionLabel(pending.action)} — ${data.proposal.title}` : ""}
        effect={
          pending?.action === "CLAIM"
            ? "Claiming assigns this proposal to you. If another editor already claimed it, this fails."
            : pending?.action === "RELEASE_CLAIM"
              ? "Releasing makes this proposal available for another Editor to claim."
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

const checklistLabels: Array<[keyof EditorialChecklist, string]> = [
  ["hook", "Hook"],
  ["characterMotivation", "Character motivation"],
  ["audienceFit", "Audience fit"],
  ["storyboardFlow", "Storyboard flow"],
  ["manuscriptQuality", "Manuscript quality"],
  ["serializePotential", "Serialize potential"],
]

function ChecklistControls({
  checklist,
  onChange,
}: {
  checklist: EditorialChecklist
  onChange: (checklist: EditorialChecklist) => void
}) {
  return checklistLabels.map(([key, label]) => (
    <Pressable
      key={key}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: checklist[key] }}
      onPress={() => onChange({ ...checklist, [key]: !checklist[key] })}
      style={styles.checklistRow}
    >
      <Text style={styles.body}>{label}</Text>
      <Text style={styles.body}>{checklist[key] ? "Done" : "Not reviewed"}</Text>
    </Pressable>
  ))
}

// Forward requires an editor recommendation that is never synthesized. The
// draft is preserved across a failed confirm.
function ForwardSheet({
  visible,
  proposalTitle,
  submitting,
  errorMessage: externalError,
  onCancel,
  onConfirm,
}: {
  visible: boolean
  proposalTitle: string
  submitting: boolean
  errorMessage: string | null
  onCancel: () => void
  onConfirm: (input: {
    editorRecommendation: string
    feasibilityNote: string
  }) => void
}) {
  const [recommendation, setRecommendation] = useState("")
  const [feasibility, setFeasibility] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      setRecommendation("")
      setFeasibility("")
      setLocalError(null)
    }
  }, [visible])

  const confirm = () => {
    if (recommendation.trim().length === 0) {
      setLocalError("Editor recommendation is required.")
      return
    }
    setLocalError(null)
    onConfirm({
      editorRecommendation: recommendation.trim(),
      feasibilityNote: feasibility.trim(),
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
  error: { color: colors.danger, fontSize: typography.body },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  sheetButton: { flex: 1, minHeight: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  cancel: { backgroundColor: colors.surfaceContainer },
  cancelText: { color: colors.text, fontWeight: "600", fontSize: typography.body },
  confirm: { backgroundColor: colors.primary },
  confirmText: { color: colors.surface, fontWeight: "700", fontSize: typography.body },
  disabled: { opacity: 0.6 },
  checklistRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  saveChecklist: { minHeight: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
})
