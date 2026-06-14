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
}: {
  item: EditorManuscriptReviewItem
  pendingAction: EditorProposalAction | null
  onStartAction: (action: EditorProposalAction) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <MFCard>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>Proposal decision preview</Text>
          <MFBadge tone={item.tone}>{item.manuscriptStatus}</MFBadge>
        </View>
        <Text style={styles.body}>{item.editorRecommendation}</Text>
        <Text style={styles.muted}>Version {item.version}. Forwarding to Board will later call the manuscript action endpoint.</Text>
        <View style={styles.buttonRow}>
          <MFButton tone="warning" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartAction("request-revision")}>Request revision</MFButton>
          <MFButton tone="danger" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartAction("reject")}>Reject</MFButton>
        </View>
        <MFButton tone="success" style={styles.actionButtonFull} onPress={() => onStartAction("forward-to-board")}>Forward to Board</MFButton>
      </MFCard>
      {pendingAction ? (
        <MFConfirmationPanel
          title={proposalActionTitle(pendingAction)}
          body={`Confirm mock ${proposalActionLabel(pendingAction)} for ${item.title}. This preview does not change workflow status or permissions.`}
          confirmLabel="Confirm mock action"
          tone={proposalActionTone(pendingAction)}
          endpointHint={proposalActionEndpoint(pendingAction)}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
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
}: {
  item: EditorSubmissionReviewItem
  pendingAction: EditorFinalApprovalAction | null
  onStartAction: (action: EditorFinalApprovalAction) => void
  onConfirm: () => void
  onCancel: () => void
}) {
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
          body={`Confirm mock ${finalApprovalActionLabel(pendingAction)} for ${item.title}. Editor final approval remains separate from proposal review.`}
          confirmLabel="Confirm review mock"
          tone={finalApprovalActionTone(pendingAction)}
          endpointHint={finalApprovalActionEndpoint(pendingAction)}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ) : null}
    </>
  )
}

function proposalActionTitle(action: EditorProposalAction) {
  if (action === "forward-to-board") return "Forward proposal to Board"
  if (action === "reject") return "Reject proposal"
  return "Request proposal revision"
}

function proposalActionLabel(action: EditorProposalAction) {
  if (action === "forward-to-board") return "forward to Board"
  if (action === "reject") return "reject proposal"
  return "request proposal revision"
}

function proposalActionTone(action: EditorProposalAction): Tone {
  if (action === "forward-to-board") return "success"
  if (action === "reject") return "danger"
  return "warning"
}

function proposalActionEndpoint(action: EditorProposalAction) {
  if (action === "forward-to-board") return "Future endpoint: POST /api/manuscripts/:manuscriptId/forward-to-board"
  if (action === "reject") return "Future endpoint: POST /api/manuscripts/:manuscriptId/reject"
  return "Future endpoint: POST /api/manuscripts/:manuscriptId/request-revision"
}

function finalApprovalActionTitle(action: EditorFinalApprovalAction) {
  if (action === "editor-approve") return "Final approve submission"
  if (action === "add-comment") return "Add editor comment"
  return "Request production revision"
}

function finalApprovalActionLabel(action: EditorFinalApprovalAction) {
  if (action === "editor-approve") return "final approval"
  if (action === "add-comment") return "add editor comment"
  return "request production revision"
}

function finalApprovalActionTone(action: EditorFinalApprovalAction): Tone {
  if (action === "editor-approve") return "success"
  if (action === "request-revision") return "warning"
  return "primary"
}

function finalApprovalActionEndpoint(action: EditorFinalApprovalAction) {
  if (action === "editor-approve") return "Future endpoint: POST /api/submissions/:submissionId/editor-approve"
  if (action === "add-comment") return "Future endpoint: POST /api/comments"
  return "Future endpoint: POST /api/submissions/:submissionId/request-revision"
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
