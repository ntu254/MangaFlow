import { View, Text, StyleSheet } from "react-native"
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
import {
  atRiskTitles,
  boardActivity,
  boardDecisionCards,
  boardMetrics,
  boardQueues,
  boardSeries,
} from "@/data/mobile-data"
import { colors, spacing } from "@/design/tokens"

export function BoardHomeScreen() {
  return (
    <>
      <MFHero title="Board Today" subtitle="Governance and decision companion" />
      <SectionTitle title="Next decisions" />
      <MFActionCards items={boardDecisionCards} />
      <SectionTitle title="Decision queues" />
      <MFQueueList items={boardQueues} />
      <SectionTitle title="Priority review" action="View all" />
      <MFSeriesRow item={boardSeries[0]} actionLabel="Open votes" />
      <SectionTitle title="Recent decisions" action="View all" />
      <ActivityList items={boardActivity} />
    </>
  )
}

export function BoardReviewsScreen() {
  return (
    <>
      <MFHero title="Series reviews" subtitle="Review proposals forwarded by editors." />
      <MFMetricStrip items={boardMetrics} />
      <SegmentedControl labels={["All", "Weekly", "Monthly", "Urgent"]} />
      <View style={styles.stack}>
        {boardSeries.map((item) => <MFSeriesRow key={item.id} item={item} />)}
      </View>
    </>
  )
}

export function BoardTieBreakScreen() {
  const item = boardSeries[0]
  return (
    <>
      <MFHero title="Tie-break" subtitle="Board Chair resolution required" />
      <MFCard style={styles.tieCard}>
        <MFCover item={item} />
        <View style={styles.tieBody}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.muted}>Series proposal / Monthly</Text>
          <View style={styles.divider} />
          <Text style={styles.subhead}>Current vote split</Text>
          <View style={styles.voteSplit}>
            <VoteCount label="Approve" value="3" tone="success" />
            <VoteCount label="Needs Revision" value="3" tone="danger" />
            <VoteCount label="Abstain / Pending" value="1" tone="neutral" />
          </View>
        </View>
      </MFCard>
      <MFCard>
        <View style={styles.rowBetween}>
          <Text style={styles.subhead}>Board notes</Text>
          <Text style={styles.link}>View all</Text>
        </View>
        <Text style={styles.body}>Strong visual appeal and world-building potential.</Text>
        <Text style={styles.body}>Concerns about pacing consistency in early chapters.</Text>
      </MFCard>
      <MFCard>
        <Text style={styles.subhead}>Editor recommendation</Text>
        <Text style={styles.body}>Revise the opening arc to strengthen character motivation and pacing.</Text>
      </MFCard>
      <MFCard style={styles.warningPanel}>
        <Text style={styles.subhead}>Decision required</Text>
        <Text style={styles.body}>Your decision will finalize the Board outcome.</Text>
      </MFCard>
      <View style={styles.buttonRow}>
        <MFButton tone="success" variant="outline">Approve</MFButton>
        <MFButton tone="danger" variant="outline">Needs Revision</MFButton>
      </View>
      <MFButton>Finalize Decision</MFButton>
      <MFCard>
        <View style={styles.rowBetween}>
          <Text style={styles.subhead}>Decision history</Text>
          <Text style={styles.link}>View history</Text>
        </View>
        <Text style={styles.body}>Tie: 3 Approve / 3 Needs Revision / 1 Abstain</Text>
        <Text style={styles.muted}>May 12, 2025 / 2:37 PM</Text>
      </MFCard>
    </>
  )
}

export function BoardAtRiskScreen() {
  return (
    <>
      <MFHero title="At-risk titles" subtitle="Review warnings and decide next action." />
      <MFMetricStrip items={[
        { id: "risk", label: "At Risk", value: "3", tone: "danger", icon: "!" },
        { id: "warning", label: "Warning", value: "2", tone: "warning", icon: "W" },
        { id: "plan", label: "Improvement Plans", value: "1", tone: "primary", icon: "P" },
      ]} />
      <View style={styles.stack}>
        {atRiskTitles.map((item) => <MFSeriesRow key={item.id} item={item} actionLabel="Review case" />)}
      </View>
      <MFCard>
        <View style={styles.atRiskDetail}>
          <MFCover item={atRiskTitles[0]} />
          <View style={styles.flex}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>Shadowline</Text>
              <MFBadge tone="danger">At Risk</MFBadge>
            </View>
            <MFCard style={styles.notePanel}>
              <Text style={styles.link}>Editor support note</Text>
              <Text style={styles.body}>Recent performance decline across key metrics. Recommend reviewing story pacing and character arcs.</Text>
            </MFCard>
          </View>
        </View>
        <Text style={styles.subhead}>Choose next action</Text>
        <View style={styles.actionButtons}>
          <MFButton tone="success" variant="outline">Continue</MFButton>
          <MFButton tone="warning" variant="outline">Warning</MFButton>
        </View>
        <View style={styles.actionButtons}>
          <MFButton tone="primary" variant="outline">Request Plan</MFButton>
          <MFButton tone="danger" variant="outline">Cancel</MFButton>
        </View>
      </MFCard>
    </>
  )
}

function VoteCount({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" | "neutral" }) {
  const color = tone === "success" ? colors.success : tone === "danger" ? colors.danger : colors.outline
  return (
    <View style={styles.voteCount}>
      <View style={[styles.voteCircle, { borderColor: color }]} />
      <Text style={styles.voteLabel}>{label}</Text>
      <Text style={[styles.voteValue, { color }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  title: { color: colors.text, fontSize: 17, fontWeight: "900" },
  muted: { color: colors.textMuted, fontSize: 12 },
  body: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 4 },
  link: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  subhead: { color: colors.text, fontSize: 14, fontWeight: "900" },
  tieCard: { flexDirection: "row", gap: spacing.md },
  tieBody: { flex: 1 },
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.md },
  voteSplit: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  voteCount: { alignItems: "center", flex: 1 },
  voteCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, marginBottom: 4 },
  voteLabel: { color: colors.textMuted, fontSize: 10, textAlign: "center" },
  voteValue: { fontSize: 24, fontWeight: "900" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  warningPanel: { backgroundColor: colors.warningSoft, borderColor: "#ffd99c" },
  buttonRow: { flexDirection: "row", gap: spacing.sm },
  actionButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  atRiskDetail: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  flex: { flex: 1 },
  notePanel: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.surfaceLow },
})

