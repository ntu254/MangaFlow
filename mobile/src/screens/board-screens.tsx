import { Pressable, Text, View, StyleSheet } from "react-native"
import {
  ActivityList,
  MFActionCards,
  MFBadge,
  MFButton,
  MFCard,
  MFConfirmationPanel,
  MFDetailList,
  MFCover,
  MFEmptyState,
  MFHero,
  MFMetricStrip,
  MFProgress,
  MFQueueList,
  MFSeriesRow,
  MFStateNotice,
  MFTimeline,
  SectionTitle,
  SegmentedControl,
} from "@/components/mf"
import type { AtRiskDecision, BoardRankingItem, BoardSeriesReviewItem, BoardVoteValue, Tone } from "@/domain/workflow"
import { MFIcon, type IconName } from "@/design/icons"
import { colors, radius, spacing } from "@/design/tokens"
import { useBoardMobileFlow } from "@/hooks/use-board-mobile-flow"

export function BoardHomeScreen() {
  const flow = useBoardMobileFlow()

  return (
    <>
      <MFHero role="board" title="Board Today" subtitle="Governance and decision companion" />
      <MFStateNotice loading={flow.loading} error={flow.error} message={flow.lastMockAction} loadingLabel="Loading mock Board home..." />
      <SectionTitle title="Next decisions" />
      <MFActionCards items={flow.home.decisionCards} />
      <SectionTitle title="Decision queues" />
      <MFQueueList items={flow.home.queues} />
      <SectionTitle title="Priority review" action="View all" />
      <MFSeriesRow item={flow.home.priorityReview} actionLabel="Open votes" />
      <SectionTitle title="Recent decisions" action="View all" />
      <ActivityList items={flow.home.activity} />
    </>
  )
}

export function BoardReviewsScreen() {
  const flow = useBoardMobileFlow()
  const selected = flow.selectedSeries

  return (
    <>
      <MFHero role="board" title="Series reviews" subtitle="Vote on proposals forwarded by Tantou Editors." />
      <MFStateNotice loading={flow.loading} error={flow.error} message={flow.lastMockAction} loadingLabel="Loading Board review queue..." />
      <MFMetricStrip items={flow.home.metrics} />
      <SegmentedControl labels={["BOARD_REVIEW", "Weekly", "Monthly", "Urgent"]} />
      <View style={styles.stack}>
        {flow.seriesReviews.length > 0 ? flow.seriesReviews.map((item) => (
          <MFSeriesRow
            key={item.id}
            item={item}
            actionLabel="Open vote"
            selected={flow.selectedSeriesId === item.id}
            onPress={() => flow.setSelectedSeriesId(item.id)}
          />
        )) : <MFEmptyState title="No Board reviews" subtitle="When the Board queue is empty, the vote route still renders a stable review state." icon="check-circle" tone="success" />}
      </View>
      {selected ? <BoardVotePanel item={selected} onVote={flow.startVote} /> : null}
      {flow.pendingVote ? (
        <MFConfirmationPanel
          title={voteActionTitle(flow.pendingVote)}
          body={`Confirm mock ${flow.pendingVote} vote for ${selected?.title ?? "the selected Board review"}. Mobile displays the vote boundary only and does not finalize Board decisions.`}
          confirmLabel="Confirm vote mock"
          tone={voteActionTone(flow.pendingVote)}
          endpointHint="Future endpoint: POST /api/board/series/:seriesId/votes"
          onConfirm={flow.confirmVote}
          onCancel={flow.cancelVote}
        />
      ) : null}
    </>
  )
}

export function BoardTieBreakScreen() {
  const flow = useBoardMobileFlow()
  const item = flow.tieBreaks[0]

  return (
    <>
      <MFHero role="board" title="Tie-break" subtitle="Board Chair resolution required" />
      <MFStateNotice loading={flow.loading} error={flow.error} message={flow.lastMockAction} loadingLabel="Loading Board Chair tie-break queue..." />
      {item ? (
        <>
          <MFCard style={styles.tieCard}>
            <MFCover item={item} />
            <View style={styles.tieBody}>
              <View style={styles.rowBetween}>
                <Text style={styles.title}>{item.title}</Text>
                <MFBadge tone="warning">{item.decisionStatus}</MFBadge>
              </View>
              <Text style={styles.muted}>Series proposal / {item.publicationType}</Text>
              <View style={styles.divider} />
              <Text style={styles.subhead}>Current vote split</Text>
              <View style={styles.voteSplit}>
                <VoteCount label="Approve" value={String(item.voteSummary.approve)} tone="success" />
                <VoteCount label="Needs Revision" value={String(item.voteSummary.needsRevision)} tone="danger" />
                <VoteCount label="Pending" value={String(item.voteSummary.pending)} tone="neutral" />
              </View>
            </View>
          </MFCard>
          <MFCard>
            <Text style={styles.subhead}>Board Chair boundary</Text>
            <Text style={styles.body}>Chair tie-break is a separate action only because normal votes produced TIE_BREAK_REQUIRED.</Text>
          </MFCard>
          <View style={styles.buttonRow}>
            <MFButton tone="success" variant="outline" onPress={() => flow.startVote("APPROVE")}>Approve</MFButton>
            <MFButton tone="danger" variant="outline" onPress={() => flow.startVote("NEEDS_REVISION")}>Needs Revision</MFButton>
          </View>
          <MFButton onPress={() => flow.startVote("NEEDS_REVISION")}>Finalize Tie-break Mock</MFButton>
          {flow.pendingVote ? (
            <MFConfirmationPanel
              title={voteActionTitle(flow.pendingVote)}
              body={`Confirm Board Chair mock tie-break for ${item.title}. This action appears only because decision status is TIE_BREAK_REQUIRED.`}
              confirmLabel="Confirm tie-break mock"
              tone={voteActionTone(flow.pendingVote)}
              endpointHint="Future endpoint: POST /api/board/series/:seriesId/decisions/tie-break"
              onConfirm={flow.confirmVote}
              onCancel={flow.cancelVote}
            />
          ) : null}
        </>
      ) : (
        <MFEmptyState title="No tie-break decisions" subtitle="Board Chair action appears only when backend decision status is TIE_BREAK_REQUIRED." icon="scale-balance" tone="success" />
      )}
      <DecisionHistory />
    </>
  )
}

export function BoardRankingScreen() {
  const flow = useBoardMobileFlow()

  return (
    <>
      <MFHero role="board" title="Ranking" subtitle="Review imported ranking data and manual at-risk actions." />
      <MFStateNotice loading={flow.loading} error={flow.error} message={flow.lastMockAction} loadingLabel="Loading ranking import preview..." />
      <MFMetricStrip items={[
        { id: "imported", label: "Imported", value: String(flow.rankings.length), tone: "primary", icon: "bar-chart-2" },
        { id: "score", label: "Score 1-10", value: "OK", tone: "success", icon: "check-circle" },
        { id: "risk", label: "At Risk", value: String(flow.atRiskCases.length), tone: "danger", icon: "alert-triangle" },
      ]} />
      <SectionTitle title="Ranking import preview" />
      <View style={styles.stack}>
        {flow.rankings.length > 0 ? flow.rankings.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: flow.selectedRankingId === item.id }}
            onPress={() => flow.setSelectedRankingId(item.id)}
            style={[styles.rankingRow, flow.selectedRankingId === item.id && styles.rankingRowSelected]}
          >
            <MFCover item={item} small />
            <View style={styles.flex}>
              <View style={styles.rowBetween}>
                <Text style={styles.title}>{item.title}</Text>
                <MFBadge tone={item.tone}>{item.rankingStatus}</MFBadge>
              </View>
              <Text style={styles.muted}>Rank {item.rank} / previous {item.previousRank}</Text>
              <Text style={styles.body}>voteCount {item.voteCount} / readerScore {item.readerScore} / finalScore {item.finalScore}</Text>
            </View>
          </Pressable>
        )) : <MFEmptyState title="No ranking import" subtitle="Reader score import can be empty while the Board waits for the next ranking cycle." icon="bar-chart-2" />}
      </View>
      {flow.selectedRanking ? <BoardRankingInsight item={flow.selectedRanking} /> : null}
      <BoardAtRiskPanel />
      <DecisionHistory />
    </>
  )
}

export function BoardAtRiskScreen() {
  return (
    <>
      <MFHero role="board" title="At-risk titles" subtitle="Review warnings and decide next action." />
      <BoardAtRiskPanel />
    </>
  )
}

function BoardVotePanel({ item, onVote }: { item: BoardSeriesReviewItem; onVote: (value: BoardVoteValue) => void }) {
  return (
    <MFCard>
      <View style={styles.rowBetween}>
        <Text style={styles.subhead}>Vote summary</Text>
        <MFBadge tone="primary">{item.seriesStatus}</MFBadge>
      </View>
      <Text style={styles.body}>Board vote options are APPROVE, REJECT, and NEEDS_REVISION. Admin override is not represented in mobile.</Text>
      <View style={styles.voteSplit}>
        <VoteCount label="Approve" value={String(item.voteSummary.approve)} tone="success" />
        <VoteCount label="Reject" value={String(item.voteSummary.reject)} tone="danger" />
        <VoteCount label="Needs Revision" value={String(item.voteSummary.needsRevision)} tone="neutral" />
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

function BoardAtRiskPanel() {
  const flow = useBoardMobileFlow()
  const item = flow.selectedAtRiskCase

  return (
    <>
      <MFMetricStrip items={[
        { id: "risk", label: "At Risk", value: String(flow.atRiskCases.filter((risk) => risk.rankingStatus === "AT_RISK").length), tone: "danger", icon: "alert-triangle" },
        { id: "warning", label: "Warning", value: String(flow.atRiskCases.filter((risk) => risk.rankingStatus === "WARNING").length), tone: "warning", icon: "alert-circle" },
        { id: "plan", label: "Confirm", value: "Required", tone: "primary", icon: "file-check" },
      ]} />
      <View style={styles.stack}>
        {flow.atRiskCases.length > 0 ? flow.atRiskCases.map((risk) => (
          <MFSeriesRow
            key={risk.id}
            item={risk}
            actionLabel="Review case"
            selected={flow.selectedAtRiskId === risk.id}
            onPress={() => flow.setSelectedAtRiskId(risk.id)}
          />
        )) : <MFEmptyState title="No at-risk cases" subtitle="Manual Board decisions appear only when ranking review returns warning or at-risk items." icon="alert-triangle" tone="success" />}
      </View>
      {item ? (
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
            <MFButton tone="success" variant="outline" onPress={() => flow.startAtRiskDecision("CONTINUE")}>CONTINUE</MFButton>
            <MFButton tone="warning" variant="outline" onPress={() => flow.startAtRiskDecision("WARNING")}>WARNING</MFButton>
          </View>
          <View style={styles.actionButtons}>
            <MFButton tone="primary" variant="outline" onPress={() => flow.startAtRiskDecision("REQUEST_IMPROVEMENT_PLAN")}>REQUEST PLAN</MFButton>
            <MFButton tone="danger" variant="outline" onPress={() => flow.startAtRiskDecision("CANCEL")}>CANCEL</MFButton>
          </View>
          {flow.pendingAtRiskDecision ? (
            <MFConfirmationPanel
              title={atRiskDecisionTitle(flow.pendingAtRiskDecision)}
              body={`Confirm mock ${flow.pendingAtRiskDecision} for ${item.title}. Series is never auto-cancelled; Board action must remain auditable on the backend.`}
              confirmLabel="Confirm at-risk mock"
              tone={atRiskDecisionTone(flow.pendingAtRiskDecision)}
              endpointHint="Future endpoint: POST /api/board/series/:seriesId/at-risk-decisions"
              onConfirm={flow.confirmAtRiskDecision}
              onCancel={flow.cancelAtRiskDecision}
            />
          ) : null}
          <Text style={styles.muted}>{flow.lastMockAction}</Text>
        </MFCard>
      ) : <MFEmptyState title="No selected at-risk case" subtitle="Select an at-risk title to review the support note and manual decision options." icon="alert-triangle" />}
    </>
  )
}

function BoardRankingInsight({ item }: { item: BoardRankingItem }) {
  const rankChange = item.previousRank - item.rank
  const movement = rankChange > 0 ? `Up ${rankChange} places` : rankChange < 0 ? `Down ${Math.abs(rankChange)} places` : "No rank movement"

  return (
    <>
      <SectionTitle title="Ranking insight" />
      <MFDetailList items={[
        { id: "rank", label: "Rank movement", value: movement, tone: rankChange >= 0 ? "success" : "danger", icon: rankChange >= 0 ? "check-circle" : "alert-triangle" },
        { id: "reader", label: "Reader score", value: `${item.readerScore} / 10. Mobile displays imported score only.`, tone: item.readerScore >= 7 ? "success" : "warning", icon: "bar-chart-2" },
        { id: "votes", label: "Vote count", value: `${item.voteCount} votes in the imported ranking period.`, tone: "primary", icon: "file-check" },
        { id: "final", label: "Final score", value: `${item.finalScore}. Ranking formula remains backend-owned.`, tone: "neutral", icon: "shield-check" },
      ]} />
      <MFTimeline items={[
        { id: "imported", title: "Ranking imported", subtitle: "Board reviews voteCount, readerScore, and backend finalScore output.", tone: "primary", icon: "bar-chart-2" },
        { id: "review", title: item.rankingStatus, subtitle: item.rankingStatus === "AT_RISK" ? "Manual Board attention is required; cancellation is not automatic." : "Warning state can continue with monitoring or improvement plan.", tone: item.tone, icon: item.tone === "danger" ? "alert-triangle" : "alert-circle" },
        { id: "decision", title: "Board decision pending", subtitle: "Any at-risk action must be confirmed and audited by backend workflow later.", tone: "warning", icon: "scale-balance" },
      ]} />
    </>
  )
}

function DecisionHistory() {
  const flow = useBoardMobileFlow()

  return (
    <>
      <SectionTitle title="Decision history" />
      <MFTimeline items={flow.decisionHistory.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.decision} / ${item.status} / immutable record / ${item.time}`,
        tone: item.decision === "CANCEL" ? "danger" : item.decision === "REQUEST_IMPROVEMENT_PLAN" || item.decision === "NEEDS_REVISION" ? "warning" : "success",
        icon: item.decision === "CANCEL" ? "alert-triangle" : "check-circle",
      }))} />
    </>
  )
}

function VoteCount({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" | "neutral" }) {
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
  stack: { gap: spacing.md },
  title: { color: colors.text, fontSize: 17, fontWeight: "900", flexShrink: 1 },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  body: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 4 },
  link: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  subhead: { color: colors.text, fontSize: 14, fontWeight: "900" },
  tieCard: { flexDirection: "row", gap: spacing.md },
  tieBody: { flex: 1 },
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.md },
  voteSplit: { flexDirection: "row", justifyContent: "space-between", gap: spacing.xs, marginTop: spacing.sm },
  voteCount: { alignItems: "center", flex: 1, minWidth: 0 },
  voteCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, marginBottom: 6, alignItems: "center", justifyContent: "center" },
  voteLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 13, minHeight: 26, textAlign: "center" },
  voteValue: { fontSize: 24, fontWeight: "900" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  actionButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  atRiskDetail: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  flex: { flex: 1 },
  notePanel: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.surfaceLow },
  rankingRow: { flexDirection: "row", gap: spacing.md, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: "#f0e8f4", padding: spacing.md },
  rankingRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
})
