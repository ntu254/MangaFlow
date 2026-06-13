import { Text, View, StyleSheet } from "react-native"
import { MFBadge, MFButton, MFCard, MFConfirmationPanel, MFCover, MFProgress } from "@/components/mf"
import type { AtRiskDecision, BoardAtRiskCase, BoardSeriesReviewItem, BoardVoteValue, Tone } from "@/domain/workflow"
import { MFIcon, type IconName } from "@/design/icons"
import { colors, spacing } from "@/design/tokens"

export function BoardVotePanel({ item, onVote }: { item: BoardSeriesReviewItem; onVote: (value: BoardVoteValue) => void }) {
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
        <MFButton tone="success" variant="outline" onPress={() => onVote("APPROVE")}>APPROVE</MFButton>
        <MFButton tone="danger" variant="outline" onPress={() => onVote("REJECT")}>REJECT</MFButton>
      </View>
      <MFButton tone="primary" variant="outline" onPress={() => onVote("NEEDS_REVISION")}>NEEDS_REVISION</MFButton>
    </MFCard>
  )
}

export function BoardVoteConfirmationPanel({
  pendingVote,
  selectedTitle,
  mode,
  onConfirm,
  onCancel,
}: {
  pendingVote: BoardVoteValue | null
  selectedTitle?: string
  mode: "vote" | "tie-break"
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!pendingVote) return null

  const isTieBreak = mode === "tie-break"

  return (
    <MFConfirmationPanel
      title={voteActionTitle(pendingVote)}
      body={isTieBreak
        ? `Confirm Board Chair mock tie-break for ${selectedTitle ?? "the selected proposal"}. This action appears only because decision status is TIE_BREAK_REQUIRED.`
        : `Confirm mock ${pendingVote} vote for ${selectedTitle ?? "the selected Board review"}. Mobile displays the vote boundary only and does not finalize Board decisions.`}
      confirmLabel={isTieBreak ? "Confirm tie-break mock" : "Confirm vote mock"}
      tone={voteActionTone(pendingVote)}
      endpointHint={isTieBreak ? "Future endpoint: POST /api/board/series/:seriesId/decisions/tie-break" : "Future endpoint: POST /api/board/series/:seriesId/votes"}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export function BoardTieBreakActionsPanel({ onVote }: { onVote: (value: BoardVoteValue) => void }) {
  return (
    <>
      <View style={styles.buttonRow}>
        <MFButton tone="success" variant="outline" onPress={() => onVote("APPROVE")}>Approve</MFButton>
        <MFButton tone="danger" variant="outline" onPress={() => onVote("NEEDS_REVISION")}>Needs Revision</MFButton>
      </View>
      <MFButton onPress={() => onVote("NEEDS_REVISION")}>Finalize Tie-break Mock</MFButton>
    </>
  )
}

export function BoardAtRiskDecisionPanel({
  item,
  pendingDecision,
  onStartDecision,
  onConfirm,
  onCancel,
  lastMockAction,
}: {
  item: BoardAtRiskCase
  pendingDecision: AtRiskDecision | null
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
          <MFCard style={styles.notePanel}>
            <Text style={styles.link}>Editor support note</Text>
            <Text style={styles.body}>{item.supportNote}</Text>
          </MFCard>
        </View>
      </View>
      <Text style={styles.subhead}>Manual Board decision</Text>
      <Text style={styles.body}>Series is not auto-cancelled. Each at-risk action requires confirmation when wired to the backend.</Text>
      <View style={styles.actionButtons}>
        <MFButton tone="success" variant="outline" onPress={() => onStartDecision("CONTINUE")}>CONTINUE</MFButton>
        <MFButton tone="warning" variant="outline" onPress={() => onStartDecision("WARNING")}>WARNING</MFButton>
      </View>
      <View style={styles.actionButtons}>
        <MFButton tone="primary" variant="outline" onPress={() => onStartDecision("REQUEST_IMPROVEMENT_PLAN")}>REQUEST PLAN</MFButton>
        <MFButton tone="danger" variant="outline" onPress={() => onStartDecision("CANCEL")}>CANCEL</MFButton>
      </View>
      {pendingDecision ? (
        <MFConfirmationPanel
          title={atRiskDecisionTitle(pendingDecision)}
          body={`Confirm mock ${pendingDecision} for ${item.title}. Series is never auto-cancelled; Board action must remain auditable on the backend.`}
          confirmLabel="Confirm at-risk mock"
          tone={atRiskDecisionTone(pendingDecision)}
          endpointHint="Future endpoint: POST /api/board/series/:seriesId/at-risk-decisions"
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
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  actionButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  voteSplit: { flexDirection: "row", justifyContent: "space-between", gap: spacing.xs, marginTop: spacing.sm },
  voteCount: { alignItems: "center", flex: 1, minWidth: 0 },
  voteCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, marginBottom: 6, alignItems: "center", justifyContent: "center" },
  voteLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 13, minHeight: 26, textAlign: "center" },
  voteValue: { fontSize: 24, fontWeight: "900" },
  atRiskDetail: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  notePanel: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.surfaceLow },
})
