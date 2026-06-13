import { Pressable, Text, View, StyleSheet } from "react-native"
import {
  ActivityList,
  MFActionCards,
  MFBadge,
  MFCard,
  MFCover,
  MFEmptyState,
  MFHero,
  MFMetricStrip,
  MFQueueList,
  MFSeriesRow,
  MFStateNotice,
  SectionTitle,
  SegmentedControl,
} from "@/components/mf"
import { BoardAtRiskDecisionPanel, BoardTieBreakActionsPanel, BoardVoteConfirmationPanel, BoardVoteCount, BoardVotePanel } from "@/screens/board-action-panels"
import { colors, radius, spacing } from "@/design/tokens"
import { useBoardMobileFlow } from "@/hooks/use-board-mobile-flow"
import { BoardDecisionHistoryPanel, BoardRankingInsightPanel } from "@/screens/board-panels"

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
      <BoardVoteConfirmationPanel pendingVote={flow.pendingVote} selectedTitle={selected?.title} mode="vote" onConfirm={flow.confirmVote} onCancel={flow.cancelVote} />
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
                <BoardVoteCount label="Approve" value={String(item.voteSummary.approve)} tone="success" />
                <BoardVoteCount label="Needs Revision" value={String(item.voteSummary.needsRevision)} tone="danger" />
                <BoardVoteCount label="Pending" value={String(item.voteSummary.pending)} tone="neutral" />
              </View>
            </View>
          </MFCard>
          <MFCard>
            <Text style={styles.subhead}>Board Chair boundary</Text>
            <Text style={styles.body}>Chair tie-break is a separate action only because normal votes produced TIE_BREAK_REQUIRED.</Text>
          </MFCard>
          <BoardTieBreakActionsPanel onVote={flow.startVote} />
          <BoardVoteConfirmationPanel pendingVote={flow.pendingVote} selectedTitle={item.title} mode="tie-break" onConfirm={flow.confirmVote} onCancel={flow.cancelVote} />
        </>
      ) : (
        <MFEmptyState title="No tie-break decisions" subtitle="Board Chair action appears only when backend decision status is TIE_BREAK_REQUIRED." icon="scale-balance" tone="success" />
      )}
      <BoardDecisionHistoryPanel items={flow.decisionHistory} />
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
      {flow.selectedRanking ? <BoardRankingInsightPanel item={flow.selectedRanking} /> : null}
      <BoardAtRiskPanel />
      <BoardDecisionHistoryPanel items={flow.decisionHistory} />
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
        <BoardAtRiskDecisionPanel
          item={item}
          pendingDecision={flow.pendingAtRiskDecision}
          onStartDecision={flow.startAtRiskDecision}
          onConfirm={flow.confirmAtRiskDecision}
          onCancel={flow.cancelAtRiskDecision}
          lastMockAction={flow.lastMockAction}
        />
      ) : <MFEmptyState title="No selected at-risk case" subtitle="Select an at-risk title to review the support note and manual decision options." icon="alert-triangle" />}
    </>
  )
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  title: { color: colors.text, fontSize: 17, fontWeight: "900", flexShrink: 1 },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  body: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 4 },
  subhead: { color: colors.text, fontSize: 14, fontWeight: "900" },
  tieCard: { flexDirection: "row", gap: spacing.md },
  tieBody: { flex: 1 },
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.md },
  voteSplit: { flexDirection: "row", justifyContent: "space-between", gap: spacing.xs, marginTop: spacing.sm },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  rankingRow: { flexDirection: "row", gap: spacing.md, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: "#f0e8f4", padding: spacing.md },
  rankingRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
})
