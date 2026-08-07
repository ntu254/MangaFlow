import { useEffect, useState } from "react"
import { Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
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
import { colors, radius, shadow, spacing, typography } from "@/design/tokens"

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

const checklistLabels: Array<[keyof EditorialChecklist, string]> = [
  ["hook", "Hook"],
  ["characterMotivation", "Character motivation"],
  ["audienceFit", "Audience fit"],
  ["storyboardFlow", "Storyboard flow"],
  ["manuscriptQuality", "Manuscript quality"],
  ["serializePotential", "Serialize potential"],
]

export const EDITORIAL_CHECKLIST_SIZE = checklistLabels.length

function checklistCount(checklist: EditorialChecklist): number {
  return checklistLabels.filter(([key]) => checklist[key]).length
}

// Stable value key: a refetch that returns the same checklist must not discard
// the Editor's in-progress ticks, so the sync effect keys on the value itself.
function checklistKey(checklist: EditorialChecklist | null): string {
  if (!checklist) return "none"
  return checklistLabels.map(([key]) => (checklist[key] ? "1" : "0")).join("")
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
  // savedChecklist is the backend value (detail read, or the last successful
  // save). draftChecklist is what the Editor has ticked but not yet saved.
  const [savedChecklist, setSavedChecklist] = useState<EditorialChecklist>(emptyEditorialChecklist)
  const [draftChecklist, setDraftChecklist] = useState<EditorialChecklist>(emptyEditorialChecklist)
  const [checklistError, setChecklistError] = useState<string | null>(null)

  const serverChecklistKey = checklistKey(detail.data?.editorialChecklist ?? null)

  useEffect(() => {
    const next = detail.data?.editorialChecklist ?? emptyEditorialChecklist
    setSavedChecklist(next)
    setDraftChecklist(next)
    setChecklistError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverChecklistKey])

  if (detail.isLoading && !detail.data) return <WorkflowState kind="loading" />
  if (detail.error && !detail.data) {
    return (
      <WorkflowState
        kind="error"
        context="this proposal"
        error={detail.error as Error}
        onRetry={() => void detail.refetch()}
      />
    )
  }
  const data = detail.data
  if (!data) return null

  const awaitingBoard = ["PENDING_BOARD", "BOARD_REVIEW"].includes(data.proposal.status)
  const terminal = ["APPROVED", "REJECTED", "WITHDRAWN", "ARCHIVED"].includes(data.proposal.status)
  const readOnlyStatus = awaitingBoard || terminal
  const savedCount = checklistCount(savedChecklist)
  const draftCount = checklistCount(draftChecklist)
  const displayedChecklistCount = readOnlyStatus ? savedCount : draftCount
  const savedChecklistComplete = savedCount === EDITORIAL_CHECKLIST_SIZE
  const hasUnsavedChecklist = checklistKey(draftChecklist) !== checklistKey(savedChecklist)

  // The backend remains the authority (EDITORIAL_CHECKLIST_INCOMPLETE); the
  // client only ever narrows an action, never re-enables one the backend
  // disabled, and never treats unsaved ticks as complete.
  const actions: WorkflowActionDescriptor[] = data.actions.map((descriptor) =>
    descriptor.action === "FORWARD" && descriptor.enabled && !savedChecklistComplete
      ? {
          ...descriptor,
          enabled: false,
          disabledReason: `Complete the checklist first: ${savedCount}/${EDITORIAL_CHECKLIST_SIZE}.`,
        }
      : descriptor,
  )
  const visibleActions = awaitingBoard || terminal ? [] : actions
  const showChecklist = readOnlyStatus
    ? data.editorialChecklist !== null
    : data.claim.claimedByEditorId !== null
  const statusExplanation = awaitingBoard
    ? "This proposal is awaiting a Board session. Editorial actions are unavailable while Board governance is in progress."
    : "This proposal has reached a final status and is read-only."

  const onAction = (descriptor: WorkflowActionDescriptor) => {
    setSheetError(null)
    if (descriptor.action === "FORWARD") {
      if (!savedChecklistComplete) return
      setForwardOpen(true)
      return
    }
    setPending(descriptor)
  }

  const saveChecklist = () => {
    setChecklistError(null)
    updateChecklist.mutate(draftChecklist, {
      // A failed save keeps the draft so nothing the Editor ticked is lost.
      onError: (error) => setChecklistError(errorMessage(error)),
      onSuccess: () => setSavedChecklist(draftChecklist),
    })
  }

  const busyAction =
    (claim.isPending && "CLAIM") ||
    (releaseClaim.isPending && "RELEASE_CLAIM") ||
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
        actions={<WorkflowActionBar actions={visibleActions} onAction={onAction} busyAction={busyAction} />}
      >
        {readOnlyStatus ? (
          <WorkflowState
            kind="empty"
            title={awaitingBoard ? "Awaiting Board session" : "Read-only proposal"}
            description={statusExplanation}
          />
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Claim</Text>
            <Text style={styles.body}>
              {data.claim.claimedByEditorName
                ? `Claimed by ${data.claim.claimedByEditorName}${data.claim.claimedByMe ? " (you)" : ""}`
                : "Unclaimed"}
            </Text>
          </View>
        )}
        {showChecklist ? (
          <View style={styles.card}>
            <View style={styles.checklistHeaderRow}>
              <View>
                <Text style={styles.sectionLabel}>Editorial checklist</Text>
                <Text style={styles.checklistCountText}>
                  {displayedChecklistCount}/{EDITORIAL_CHECKLIST_SIZE} complete
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(displayedChecklistCount / EDITORIAL_CHECKLIST_SIZE) * 100}%` }]} />
              </View>
            </View>
            {data.claim.claimedByMe && !readOnlyStatus ? (
              <>
                <ChecklistControls checklist={draftChecklist} onChange={setDraftChecklist} />
                {hasUnsavedChecklist ? (
                  <Text style={styles.unsaved}>
                    Unsaved changes. Saved checklist is {savedCount}/{EDITORIAL_CHECKLIST_SIZE}.
                  </Text>
                ) : null}
                {checklistError ? (
                  <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
                    {checklistError}
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save checklist"
                  accessibilityState={{ disabled: updateChecklist.isPending }}
                  disabled={updateChecklist.isPending}
                  onPress={saveChecklist}
                  style={({ pressed }) => [
                    styles.saveChecklist,
                    updateChecklist.isPending && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.confirmText}>
                    {updateChecklist.isPending ? "Saving…" : "Save checklist"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <ChecklistEvidence checklist={savedChecklist} />
            )}
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

function ChecklistControls({
  checklist,
  onChange,
}: {
  checklist: EditorialChecklist
  onChange: (checklist: EditorialChecklist) => void
}) {
  return checklistLabels.map(([key, label]) => {
    const checked = checklist[key]
    return (
      <Pressable
        key={key}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={() => onChange({ ...checklist, [key]: !checked })}
        style={styles.checklistRow}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
        <Text style={styles.checklistLabel}>{label}</Text>
        <Text style={styles.checklistState}>{checked ? "Done" : "Not reviewed"}</Text>
      </Pressable>
    )
  })
}

function ChecklistEvidence({ checklist }: { checklist: EditorialChecklist }) {
  return checklistLabels.map(([key, label]) => (
    <View key={key} style={styles.checklistRow}>
      <View style={[styles.checkbox, checklist[key] && styles.checkboxChecked]}>
        {checklist[key] ? <Text style={styles.checkboxMark}>✓</Text> : null}
      </View>
      <Text style={styles.checklistLabel}>{label}</Text>
      <Text style={styles.checklistState}>{checklist[key] ? "Done" : "Not reviewed"}</Text>
    </View>
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
      <Pressable style={styles.backdrop} onPress={Keyboard.dismiss}>
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
      </Pressable>
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
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  checklistHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  checklistCountText: { fontSize: typography.body, color: colors.text, fontWeight: "600" },
  progressTrack: {
    width: 90,
    height: 8,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  checklistRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkboxMark: { color: colors.surface, fontSize: typography.label, fontWeight: "900" },
  checklistLabel: { flex: 1, fontSize: typography.body, color: colors.text },
  checklistState: { fontSize: typography.label, color: colors.textMuted },
  unsaved: { fontSize: typography.label, color: colors.warning, fontWeight: "700" },
  saveChecklist: { minHeight: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
})
