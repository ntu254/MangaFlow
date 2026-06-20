import { Text, View, StyleSheet } from "react-native"
import { MFBadge, MFButton, MFCard, MFConfirmationPanel, MFCover, MFProgress } from "@/components/mf"
import type { AtRiskDecision, BoardAtRiskCase, BoardSeriesReviewItem, BoardVoteValue, Tone } from "@/domain/workflow"
import { MFIcon, type IconName } from "@/design/icons"
import { colors, spacing } from "@/design/tokens"

export function BoardVotePanel({
  item,
  onVote,
  onFinalize,
}: {
  item: BoardSeriesReviewItem
  onVote: (value: BoardVoteValue) => void
  onFinalize: () => void
}) {
  return (
    <MFCard>
      <View style={styles.rowBetween}>
        <Text style={styles.subhead}>Vote summary</Text>
        <MFBadge tone="primary">{item.seriesStatus}</MFBadge>
      </View>
      <Text style={styles.body}>Board vote options are APPROVE, REJECT, and NEEDS_REVISION. Admin override is not represented in mobile.</Text>
      <View style={styles.voteSplit}>
        <BoardVoteCount label="Approve" value={String(item.voteSummary.approve)} tone="success" />
        <BoardVoteCount label="Reject" value={String(item.voteSummary.reject)} tone="danger" />
        <BoardVoteCount label="Needs Revision" value={String(item.voteSummary.needsRevision)} tone="neutral" />
      </View>
      <MFProgress value={(item.voteSummary.eligible - item.voteSummary.pending) / item.voteSummary.eligible} />
      <View style={styles.buttonRow}>
        <MFButton tone="success" variant="soft" style={styles.actionButtonHalf} onPress={() => onVote("APPROVE")}>Approve</MFButton>
        <MFButton tone="danger" variant="soft" style={styles.actionButtonHalf} onPress={() => onVote("REJECT")}>Reject</MFButton>
      </View>
      <MFButton tone="warning" variant="soft" style={styles.actionButtonFull} onPress={() => onVote("NEEDS_REVISION")}>Needs revision</MFButton>
      <View style={styles.finalizeBlock}>
        <Text style={styles.muted}>Finalize is backend-owned: quorum, plurality, tie-break status, notifications, and audit are resolved server-side.</Text>
        <MFButton style={styles.actionButtonFull} onPress={onFinalize}>Finalize Board decision</MFButton>
      </View>
    </MFCard>
  )
}

export function BoardFinalizeConfirmationPanel({
  visible,
  selectedTitle,
  publicationType,
  noteValue,
  onChangeNote,
  busy,
  errorText,
  onConfirm,
  onCancel,
}: {
  visible: boolean
  selectedTitle?: string
  publicationType?: "WEEKLY" | "MONTHLY"
  noteValue: string
  onChangeNote: (value: string) => void
  busy: boolean
  errorText: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!visible) return null

  return (
    <MFConfirmationPanel
      title="Finalize Board decision"
      body={`Send finalize request for ${selectedTitle ?? "the selected Board review"}. Backend verifies quorum and vote result; ties become TIE_BREAK_REQUIRED.`}
      confirmLabel="Submit finalize"
      tone="primary"
      endpointHint="Live endpoint: POST /api/board/series/:seriesId/decisions/finalize"
      noteLabel="Finalize note"
      notePlaceholder={`Optional finalization note. Publication type sent when approval wins: ${publicationType ?? "MONTHLY"}.`}
      noteValue={noteValue}
      onChangeNote={onChangeNote}
      busy={busy}
      errorText={errorText}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export function BoardVoteConfirmationPanel({
  pendingVote,
  selectedTitle,
  mode,
  noteValue,
  onChangeNote,
  busy,
  errorText,
  onConfirm,
  onCancel,
}: {
  pendingVote: BoardVoteValue | null
  selectedTitle?: string
  mode: "vote" | "tie-break"
  noteValue: string
  onChangeNote: (value: string) => void
  busy: boolean
  errorText: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!pendingVote) return null

  const isTieBreak = mode === "tie-break"

  return (
    <MFConfirmationPanel
      title={voteActionTitle(pendingVote)}
      body={isTieBreak
        ? `Confirm Board Chair tie-break for ${selectedTitle ?? "the selected proposal"}. This action appears only because decision status is TIE_BREAK_REQUIRED.`
        : `Confirm ${voteActionLabel(pendingVote)} vote for ${selectedTitle ?? "the selected Board review"}. Mobile records the vote; backend handles quorum and final decision state.`}
      confirmLabel={isTieBreak ? "Submit tie-break" : "Submit vote"}
      tone={voteActionTone(pendingVote)}
      endpointHint={isTieBreak ? "Live endpoint: POST /api/board/series/:seriesId/decisions/tie-break" : "Live endpoint: POST /api/board/series/:seriesId/votes"}
      noteLabel={isTieBreak ? "Chair decision note" : "Vote note"}
      notePlaceholder={isTieBreak ? "Explain the tie-break rationale for audit." : "Optional Board note for audit."}
      noteValue={noteValue}
      onChangeNote={onChangeNote}
      busy={busy}
      errorText={errorText}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export function BoardTieBreakActionsPanel({ onVote }: { onVote: (value: BoardVoteValue) => void }) {
  return (
    <>
      <View style={styles.buttonRow}>
        <MFButton tone="success" variant="soft" style={styles.actionButtonHalf} onPress={() => onVote("APPROVE")}>Approve</MFButton>
        <MFButton tone="warning" variant="soft" style={styles.actionButtonHalf} onPress={() => onVote("NEEDS_REVISION")}>Needs revision</MFButton>
      </View>
      <MFButton tone="danger" variant="soft" style={styles.actionButtonFull} onPress={() => onVote("REJECT")}>Reject</MFButton>
    </>
  )
}

export function BoardAtRiskDecisionPanel({
  item,
  pendingDecision,
  noteValue,
  onChangeNote,
  busy,
  errorText,
  onStartDecision,
  onConfirm,
  onCancel,
  lastMockAction,
}: {
  item: BoardAtRiskCase
  pendingDecision: AtRiskDecision | null
  noteValue: string
  onChangeNote: (value: string) => void
  busy: boolean
  errorText: string | null
  onStartDecision: (decision: AtRiskDecision) => void
  onConfirm: () => void
  onCancel: () => void
  lastMockAction: string
}) {
  return (
    <MFCard>
      <View style={styles.atRiskDetail}>
        <MFCover item={item} />
        <View style={styles.flex}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{item.title}</Text>
            <MFBadge tone={item.tone}>{item.rankingStatus}</MFBadge>
          </View>
          <View style={styles.notePanel}>
            <Text style={styles.link}>Editor support note</Text>
            <Text style={styles.body}>{item.supportNote}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.subhead}>Manual Board decision</Text>
      <Text style={styles.body}>Series is not auto-cancelled. Each at-risk action requires confirmation when wired to the backend.</Text>
      <View style={styles.actionButtons}>
        <MFButton tone="success" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartDecision("CONTINUE")}>Continue</MFButton>
        <MFButton tone="warning" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartDecision("WARNING")}>Warning</MFButton>
        <MFButton tone="primary" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartDecision("REQUEST_IMPROVEMENT_PLAN")}>Request plan</MFButton>
        <MFButton tone="danger" variant="soft" style={styles.actionButtonHalf} onPress={() => onStartDecision("CANCEL")}>Cancel</MFButton>
      </View>
      {pendingDecision ? (
        <MFConfirmationPanel
          title={atRiskDecisionTitle(pendingDecision)}
          body={`Confirm ${atRiskDecisionLabel(pendingDecision)} for ${item.title}. Series is never auto-cancelled; Board action remains auditable on the backend.`}
          confirmLabel="Submit at-risk decision"
          tone={atRiskDecisionTone(pendingDecision)}
          endpointHint="Live endpoint: POST /api/board/series/:seriesId/at-risk-decisions"
          noteLabel="Board decision note"
          notePlaceholder="Optional reason or follow-up direction for audit."
          noteValue={noteValue}
          onChangeNote={onChangeNote}
          busy={busy}
          errorText={errorText}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ) : null}
      <Text style={styles.muted}>{lastMockAction}</Text>
    </MFCard>
  )
}

export function BoardVoteCount({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" | "neutral" }) {
  const color = tone === "success" ? colors.success : tone === "danger" ? colors.danger : colors.outline
  const bg = tone === "success" ? colors.successSoft : tone === "danger" ? colors.dangerSoft : colors.surfaceContainer
  const icon: IconName = tone === "success" ? "check" : tone === "danger" ? "alert-triangle" : "circle"

  return (
    <View style={styles.voteCount}>
      <View style={[styles.voteCircle, { borderColor: color, backgroundColor: bg }]}>
        <MFIcon name={icon} size={20} color={color} strokeWidth={2.5} />
      </View>
      <Text style={styles.voteLabel} numberOfLines={2}>{label}</Text>
      <Text style={[styles.voteValue, { color }]}>{value}</Text>
    </View>
  )
}

function voteActionTitle(value: BoardVoteValue) {
  if (value === "APPROVE") return "Approve production vote"
  if (value === "REJECT") return "Reject production vote"
  return "Request Board revision vote"
}

function voteActionLabel(value: BoardVoteValue) {
  if (value === "APPROVE") return "approve"
  if (value === "REJECT") return "reject"
  return "needs revision"
}

function voteActionTone(value: BoardVoteValue): Tone {
  if (value === "APPROVE") return "success"
  if (value === "REJECT") return "danger"
  return "warning"
}

function atRiskDecisionTitle(decision: AtRiskDecision) {
  if (decision === "CONTINUE") return "Continue publication"
  if (decision === "WARNING") return "Issue Board warning"
  if (decision === "REQUEST_IMPROVEMENT_PLAN") return "Request improvement plan"
  return "Cancel series"
}

function atRiskDecisionLabel(decision: AtRiskDecision) {
  if (decision === "CONTINUE") return "continue"
  if (decision === "WARNING") return "warning"
  if (decision === "REQUEST_IMPROVEMENT_PLAN") return "request improvement plan"
  return "cancel"
}

function atRiskDecisionTone(decision: AtRiskDecision): Tone {
  if (decision === "CONTINUE") return "success"
  if (decision === "WARNING") return "warning"
  if (decision === "CANCEL") return "danger"
  return "primary"
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { color: colors.text, fontSize: 17, fontWeight: "900", flexShrink: 1 },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  body: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 4 },
  link: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  subhead: { color: colors.text, fontSize: 14, fontWeight: "900" },
  rowBetween: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  actionButtons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  actionButtonHalf: { flexGrow: 1, flexBasis: "47%", minWidth: 132 },
  actionButtonFull: { marginTop: spacing.sm },
  finalizeBlock: { marginTop: spacing.md, gap: spacing.xs },
  voteSplit: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.xs, marginTop: spacing.sm },
  voteCount: { alignItems: "center", flex: 1, minWidth: 0 },
  voteCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, marginBottom: 6, alignItems: "center", justifyContent: "center" },
  voteLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 13, minHeight: 26, textAlign: "center" },
  voteValue: { fontSize: 24, fontWeight: "900" },
  atRiskDetail: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md, alignItems: "flex-start" },
  notePanel: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.surfaceLow, borderRadius: 14, borderWidth: 1, borderColor: colors.outlineVariant },
})
