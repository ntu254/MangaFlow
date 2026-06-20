import { Text, View, StyleSheet } from "react-native"
import { MFBadge, MFButton, MFCard, MFConfirmationPanel, SectionTitle } from "@/components/mf"
import type { EditorFinalApprovalAction, EditorManuscriptReviewItem, EditorProposalAction, EditorSubmissionReviewItem, Tone } from "@/domain/workflow"
import { colors, spacing } from "@/design/tokens"

export function EditorProposalDecisionPanel({
  item,
  pendingAction,
  onStartAction,
  onConfirm,
  onCancel,
  noteValue,
  onChangeNote,
  selectedPublicationType,
  onChangePublicationType,
  busy = false,
  errorText,
}: {
  item: EditorManuscriptReviewItem
  pendingAction: EditorProposalAction | null
  onStartAction: (action: EditorProposalAction) => void
  onConfirm: () => void
  onCancel: () => void
  noteValue: string
  onChangeNote: (value: string) => void
  selectedPublicationType: "WEEKLY" | "MONTHLY"
  onChangePublicationType: (value: "WEEKLY" | "MONTHLY") => void
  busy?: boolean
  errorText?: string | null
}) {
  const requiresNote = pendingAction === "request-revision" || pendingAction === "reject"

  return (
    <>
      <MFCard>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>Proposal decision preview</Text>
          <MFBadge tone={item.tone}>{item.manuscriptStatus}</MFBadge>
        </View>
        <Text style={styles.body}>{item.editorRecommendation}</Text>
        <Text style={styles.muted}>Version {item.version}. Editor decisions call the live Series review API and remain backend-authorized.</Text>
        <MFButton tone="primary" variant="soft" style={styles.actionButtonFull} onPress={() => onStartAction("start-review")}>Start review</MFButton>
        <View style={styles.buttonRow}>
          <MFButton tone="warning" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartAction("request-revision")}>Request revision</MFButton>
          <MFButton tone="danger" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartAction("reject")}>Reject</MFButton>
        </View>
        <MFButton tone="success" style={styles.actionButtonFull} onPress={() => onStartAction("forward-to-board")}>Forward to Board</MFButton>
      </MFCard>
      {pendingAction ? (
        <>
          {pendingAction === "forward-to-board" ? (
            <MFCard>
              <Text style={styles.link}>Publication cadence sent to Board</Text>
              <Text style={styles.body}>Mobile sends this as `suggestedPublicationType`; backend still owns the workflow transition.</Text>
              <View style={styles.buttonRow}>
                <MFButton tone={selectedPublicationType === "WEEKLY" ? "success" : "neutral"} variant="soft" style={styles.actionButtonHalf} onPress={() => onChangePublicationType("WEEKLY")}>Weekly</MFButton>
                <MFButton tone={selectedPublicationType === "MONTHLY" ? "success" : "neutral"} variant="soft" style={styles.actionButtonHalf} onPress={() => onChangePublicationType("MONTHLY")}>Monthly</MFButton>
              </View>
            </MFCard>
          ) : null}
          <MFConfirmationPanel
            title={proposalActionTitle(pendingAction)}
            body={`${proposalActionLabel(pendingAction)} for ${item.title}. Backend validation, permissions, notification, and audit stay server-owned.`}
            confirmLabel={proposalActionConfirmLabel(pendingAction)}
            tone={proposalActionTone(pendingAction)}
            endpointHint={proposalActionEndpoint(pendingAction)}
            onConfirm={onConfirm}
            onCancel={onCancel}
            noteValue={noteValue}
            onChangeNote={onChangeNote}
            noteLabel={proposalActionNoteLabel(pendingAction)}
            notePlaceholder={proposalActionNotePlaceholder(pendingAction)}
            errorText={errorText}
            busy={busy}
            confirmDisabled={requiresNote && noteValue.trim().length === 0}
          />
        </>
      ) : null}
    </>
  )
}

export function EditorFinalApprovalDecisionPanel({
  item,
  pendingAction,
  onStartAction,
  onConfirm,
  onCancel,
  noteValue,
  onChangeNote,
  busy = false,
  errorText,
}: {
  item: EditorSubmissionReviewItem
  pendingAction: EditorFinalApprovalAction | null
  onStartAction: (action: EditorFinalApprovalAction) => void
  onConfirm: () => void
  onCancel: () => void
  noteValue: string
  onChangeNote: (value: string) => void
  busy?: boolean
  errorText?: string | null
}) {
  const isLiveAction = pendingAction === "request-revision" || pendingAction === "add-comment" || pendingAction === "editor-approve"

  return (
    <>
      <SectionTitle title="Decision panel" />
      <MFCard style={styles.noteBox}>
        <Text style={styles.link}>Editor final approval boundary</Text>
        <Text style={styles.body}>This action is separate from proposal review and is the only approval path that can later trigger payroll.</Text>
      </MFCard>
      <View style={styles.buttonRow}>
        <MFButton tone="warning" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartAction("request-revision")}>Request revision</MFButton>
        <MFButton tone="primary" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartAction("add-comment")}>Add comment</MFButton>
      </View>
      <MFButton tone="success" style={styles.actionButtonFull} onPress={() => onStartAction("editor-approve")}>Final approve</MFButton>
      {pendingAction ? (
        <MFConfirmationPanel
          title={finalApprovalActionTitle(pendingAction)}
          body={`${finalApprovalActionLabel(pendingAction)} for ${item.title}. Editor final approval remains separate from proposal review.`}
          confirmLabel="Submit review action"
          tone={finalApprovalActionTone(pendingAction)}
          endpointHint={finalApprovalActionEndpoint(pendingAction)}
          onConfirm={onConfirm}
          onCancel={onCancel}
          noteValue={noteValue}
          onChangeNote={onChangeNote}
          noteLabel={finalApprovalActionNoteLabel(pendingAction)}
          notePlaceholder={finalApprovalActionNotePlaceholder(pendingAction)}
          errorText={errorText}
          busy={busy}
          confirmDisabled={(pendingAction === "request-revision" || pendingAction === "add-comment") && noteValue.trim().length === 0}
        />
      ) : null}
    </>
  )
}

function proposalActionTitle(action: EditorProposalAction) {
  if (action === "start-review") return "Start proposal review"
  if (action === "forward-to-board") return "Forward proposal to Board"
  if (action === "reject") return "Reject proposal"
  return "Request proposal revision"
}

function proposalActionLabel(action: EditorProposalAction) {
  if (action === "start-review") return "Start live Editor review"
  if (action === "forward-to-board") return "Forward this proposal to Board review"
  if (action === "reject") return "Reject this proposal"
  return "Request a proposal revision"
}

function proposalActionConfirmLabel(action: EditorProposalAction) {
  if (action === "start-review") return "Start review"
  if (action === "forward-to-board") return "Forward to Board"
  if (action === "reject") return "Reject proposal"
  return "Request revision"
}

function proposalActionTone(action: EditorProposalAction): Tone {
  if (action === "start-review") return "primary"
  if (action === "forward-to-board") return "success"
  if (action === "reject") return "danger"
  return "warning"
}

function proposalActionEndpoint(action: EditorProposalAction) {
  if (action === "start-review") return "Live endpoint: POST /api/editor/series/:seriesId/start-review"
  if (action === "forward-to-board") return "Live endpoint: POST /api/editor/series/:seriesId/forward-to-board"
  if (action === "reject") return "Live endpoint: POST /api/editor/series/:seriesId/reject"
  return "Live endpoint: POST /api/editor/series/:seriesId/request-revision"
}

function proposalActionNoteLabel(action: EditorProposalAction) {
  if (action === "start-review") return "Review note"
  if (action === "forward-to-board") return "Recommendation note"
  if (action === "reject") return "Reject reason"
  return "Revision feedback"
}

function proposalActionNotePlaceholder(action: EditorProposalAction) {
  if (action === "start-review") return "Optional note before opening the live review context."
  if (action === "forward-to-board") return "Add a Board-facing recommendation or leave blank to use the existing editor recommendation."
  if (action === "reject") return "Explain why this proposal should not continue."
  return "Describe what the mangaka needs to revise before resubmission."
}

function finalApprovalActionTitle(action: EditorFinalApprovalAction) {
  if (action === "editor-approve") return "Final approve submission"
  if (action === "add-comment") return "Add editor comment"
  return "Request production revision"
}

function finalApprovalActionLabel(action: EditorFinalApprovalAction) {
  if (action === "editor-approve") return "Final approve this submission"
  if (action === "add-comment") return "Add an editor comment to this task"
  return "Request a production revision"
}

function finalApprovalActionTone(action: EditorFinalApprovalAction): Tone {
  if (action === "editor-approve") return "success"
  if (action === "request-revision") return "warning"
  return "primary"
}

function finalApprovalActionEndpoint(action: EditorFinalApprovalAction) {
  if (action === "editor-approve") return "Live endpoint: POST /api/submissions/:submissionId/editor-approve"
  if (action === "add-comment") return "Live endpoint: POST /api/comments"
  return "Live endpoint: POST /api/submissions/:submissionId/request-revision"
}

function finalApprovalActionNoteLabel(action: EditorFinalApprovalAction) {
  if (action === "editor-approve") return "Approval note"
  if (action === "add-comment") return "Comment body"
  return "Revision feedback"
}

function finalApprovalActionNotePlaceholder(action: EditorFinalApprovalAction) {
  if (action === "editor-approve") return "Optional note for the final approval record."
  if (action === "add-comment") return "Describe the production issue. Mobile submits it as a blocking editor comment."
  return "Explain what the assistant needs to fix before resubmission."
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  actionButtonHalf: { flexGrow: 1, flexBasis: "47%", minWidth: 132 },
  actionButtonFull: { marginTop: spacing.sm },
  title: { color: colors.text, fontSize: 16, fontWeight: "900", flexShrink: 1 },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  body: { color: colors.text, fontSize: 13, lineHeight: 20 },
  link: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  noteBox: { backgroundColor: colors.primarySoft },
})
