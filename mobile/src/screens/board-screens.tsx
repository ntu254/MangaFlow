import { Text, View, StyleSheet } from "react-native"
import {
  ActivityList,
  MFActionCards,
  MFBadge,
  MFButton,
  MFCard,
  MFCover,
  MFHero,
  MFMetricStrip,
  MFProgress,
  MFQueueList,
  MFSeriesRow,
  SectionTitle,
  SegmentedControl,
} from "@/components/mf"
import type { BoardSeriesReviewItem } from "@/domain/workflow"
import { MFIcon, type IconName } from "@/design/icons"
import { colors, spacing } from "@/design/tokens"
import { useBoardMobileFlow } from "@/hooks/use-board-mobile-flow"

export function BoardHomeScreen() {
  const flow = useBoardMobileFlow()

  return (
    <>
      <MFHero role="board" title="Board Today" subtitle="Governance and decision companion" />
      <StateBanner loading={flow.loading} error={flow.error} message={flow.lastMockAction} />
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
      <StateBanner loading={flow.loading} error={flow.error} message={flow.lastMockAction} />
      <MFMetricStrip items={flow.home.metrics} />
      <SegmentedControl labels={["BOARD_REVIEW", "Weekly", "Monthly", "Urgent"]} />
      <View style={styles.stack}>
        {flow.seriesReviews.map((item) => <MFSeriesRow key={item.id} item={item} actionLabel="Open vote" />)}
      </View>
      {selected ? <BoardVotePanel item={selected} onVote={flow.recordVote} /> : null}
    </>
  )
}

export function BoardTieBreakScreen() {
  const flow = useBoardMobileFlow()
  const item = flow.tieBreaks[0]

  return (
    <>
      <MFHero role="board" title="Tie-break" subtitle="Board Chair resolution required" />
      <StateBanner loading={flow.loading} error={flow.error} message={flow.lastMockAction} />
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
            <MFButton tone="success" variant="outline" onPress={() => flow.recordVote("APPROVE")}>Approve</MFButton>
            <MFButton tone="danger" variant="outline" onPress={() => flow.recordVote("NEEDS_REVISION")}>Needs Revision</MFButton>
          </View>
          <MFButton onPress={() => flow.recordVote("NEEDS_REVISION")}>Finalize Tie-break Mock</MFButton>
        </>
      ) : (
        <MFCard><Text style={styles.body}>No tie-break decisions in the mock queue.</Text></MFCard>
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
      <StateBanner loading={flow.loading} error={flow.error} message={flow.lastMockAction} />
      <MFMetricStrip items={[
        { id: "imported", label: "Imported", value: String(flow.rankings.length), tone: "primary", icon: "bar-chart-2" },
        { id: "score", label: "Score 1-10", value: "OK", tone: "success", icon: "check-circle" },
        { id: "risk", label: "At Risk", value: String(flow.atRiskCases.length), tone: "danger", icon: "alert-triangle" },
      ]} />
      <SectionTitle title="Ranking import preview" />
      <View style={styles.stack}>
        {flow.rankings.map((item) => (
          <MFCard key={item.id} style={styles.rankingRow}>
            <MFCover item={item} small />
            <View style={styles.flex}>
              <View style={styles.rowBetween}>
                <Text style={styles.title}>{item.title}</Text>
                <MFBadge tone={item.tone}>{item.rankingStatus}</MFBadge>
              </View>
              <Text style={styles.muted}>Rank {item.rank} / previous {item.previousRank}</Text>
              <Text style={styles.body}>voteCount {item.voteCount} / readerScore {item.readerScore} / finalScore {item.finalScore}</Text>
            </View>
          </MFCard>
        ))}
      </View>
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

function BoardVotePanel({ item, onVote }: { item: BoardSeriesReviewItem; onVote: (value: "APPROVE" | "REJECT" | "NEEDS_REVISION") => void }) {
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
        {flow.atRiskCases.map((risk) => <MFSeriesRow key={risk.id} item={risk} actionLabel="Review case" />)}
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
            <MFButton tone="success" variant="outline" onPress={() => flow.recordAtRiskDecision("CONTINUE")}>CONTINUE</MFButton>
            <MFButton tone="warning" variant="outline" onPress={() => flow.recordAtRiskDecision("WARNING")}>WARNING</MFButton>
          </View>
          <View style={styles.actionButtons}>
            <MFButton tone="primary" variant="outline" onPress={() => flow.recordAtRiskDecision("REQUEST_IMPROVEMENT_PLAN")}>REQUEST PLAN</MFButton>
            <MFButton tone="danger" variant="outline" onPress={() => flow.recordAtRiskDecision("CANCEL")}>CANCEL</MFButton>
          </View>
          <Text style={styles.muted}>{flow.lastMockAction}</Text>
        </MFCard>
      ) : null}
    </>
  )
}

function DecisionHistory() {
  const flow = useBoardMobileFlow()

  return (
    <>
      <SectionTitle title="Decision history" />
      <MFCard>
        {flow.decisionHistory.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <MFIcon name="check-circle" size={18} color={colors.primary} />
            <View style={styles.flex}>
              <Text style={styles.subhead}>{item.title}</Text>
              <Text style={styles.muted}>{item.decision} / {item.status} / immutable record / {item.time}</Text>
            </View>
          </View>
        ))}
      </MFCard>
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

function StateBanner({ loading, error, message }: { loading: boolean; error: string | null; message: string }) {
  if (error) return <MFCard style={styles.errorPanel}><Text style={styles.body}>{error}</Text></MFCard>
  return <Text style={styles.muted}>{loading ? "Loading mock Board flow..." : message}</Text>
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
  rankingRow: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  historyRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  errorPanel: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
})
