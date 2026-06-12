import { Image } from "expo-image"
import { View, Text, StyleSheet } from "react-native"
import {
  ActivityList,
  MFActionCards,
  MFBadge,
  MFButton,
  MFCard,
  MFCover,
  MFHero,
  MFIconCircle,
  MFMetricStrip,
  MFProgress,
  MFQueueList,
  MFSeriesRow,
  SectionTitle,
  SegmentedControl,
} from "@/components/mf"
import {
  editorActions,
  editorActivity,
  editorQueues,
  commentActivity,
  commentMetrics,
  finalApprovals,
  manuscripts,
  productionComments,
  readinessChecks,
  type CommentItem,
} from "@/data/mobile-data"
import { MFIcon, type IconName } from "@/design/icons"
import { colors, radius, spacing } from "@/design/tokens"

const shadowlineCover = require("../../assets/images/biatruyen.jpg")
const crimsonRoadCover = require("../../assets/images/biatruyen1.jpg")

export function EditorHomeScreen() {
  return (
    <>
      <MFHero title="Today" subtitle="Review and publication companion" />
      <SectionTitle title="Next actions" action="View all" />
      <MFActionCards items={editorActions} />
      <SectionTitle title="Review queues" />
      <MFQueueList items={editorQueues} />
      <SectionTitle title="Priority chapter" />
      <MFCard style={styles.priorityCard}>
        <MFCover item={manuscripts[0]} small />
        <View style={styles.flex}>
          <Text style={styles.title}>Eclipse of Eternity / Ch.12</Text>
          <MFBadge tone="danger">Not Ready</MFBadge>
          <Text style={styles.passText}>4 / 6 checks passed</Text>
          <MFProgress value={0.67} />
          <Text style={styles.muted}>Blocked by unresolved comments / 1 pending final approval</Text>
        </View>
      </MFCard>
      <SectionTitle title="Recent activity" action="View all" />
      <ActivityList items={editorActivity} />
    </>
  )
}

export function EditorManuscriptsScreen() {
  return (
    <>
      <MFHero title="Manuscripts" subtitle="Review incoming series proposals and manuscript revisions." />
      <MFMetricStrip items={[
        { id: "waiting", label: "Waiting", value: "3", tone: "primary", icon: "file-text" },
        { id: "revision", label: "Revisions", value: "2", tone: "warning", icon: "refresh-cw" },
        { id: "ready", label: "Ready for Board", value: "1", tone: "success", icon: "shield-check" },
      ]} />
      <SegmentedControl labels={["Waiting 3", "Revision 2", "Forwarded 1"]} />
      <View style={styles.stack}>
        {manuscripts.map((item) => <MFSeriesRow key={item.id} item={item} actionLabel="Open Review" />)}
      </View>
    </>
  )
}

export function EditorReadinessScreen() {
  return (
    <>
      <MFHero title="Readiness" subtitle="Check chapter blockers before publication." />
      <MFCard style={styles.chapterPicker}>
        <MFCover item={manuscripts[0]} small />
        <Text style={[styles.title, styles.flex]}>Eclipse of Eternity / Chapter 12</Text>
        <MFIcon name="chevron-right" size={18} color={colors.outline} />
      </MFCard>
      <MFCard style={styles.readinessSummary}>
        <View style={styles.ring}><Text style={styles.ringValue}>4</Text><Text style={styles.ringTotal}>/ 6</Text></View>
        <View style={styles.flex}>
          <MFBadge tone="danger">Blocked</MFBadge>
          <Text style={styles.bigTitle}>4 of 6 checks passed</Text>
          <MFProgress value={0.67} />
        </View>
      </MFCard>
      <MFCard>
        {readinessChecks.map((check) => (
          <View key={check.id} style={[styles.checkRow, check.tone === "danger" && styles.failedRow]}>
            <View style={[styles.checkIcon, { borderColor: check.tone === "danger" ? colors.danger : colors.success }]}>
              <MFIcon name={check.tone === "danger" ? "alert-triangle" : "check"} size={14} color={check.tone === "danger" ? colors.danger : colors.success} />
            </View>
            <Text style={styles.checkTitle}>{check.title}</Text>
            <Text style={[styles.checkValue, { color: check.tone === "danger" ? colors.danger : colors.success }]}>{check.value}</Text>
          </View>
        ))}
      </MFCard>
      <SectionTitle title="Blockers" />
      <MFQueueList items={readinessChecks.filter((check) => check.tone === "danger")} />
      <MFButton tone="primary" variant="outline">Open blockers</MFButton>
      <MFButton>Schedule publication</MFButton>
    </>
  )
}

export function EditorCommentsScreen() {
  return (
    <>
      <MFHero title="Comments" subtitle="Review and resolve production feedback." />
      <MFMetricStrip items={commentMetrics} />
      <SegmentedControl labels={["All", "Open", "Blocking", "Fixed", "Resolved"]} />
      <View style={styles.stack}>
        {productionComments.map((comment) => <CommentReviewRow key={comment.id} item={comment} />)}
      </View>
      <MFCard style={styles.blockingCallout}>
        <MFIconCircle tone="danger" icon="alert-triangle" size={54} />
        <View style={styles.flex}>
          <Text style={styles.title}>Blocking publication</Text>
          <Text style={styles.body}>There are 2 unresolved blocking comments on Eclipse of Eternity Chapter 12.</Text>
        </View>
        <MFButton tone="danger" variant="outline">Open blockers</MFButton>
      </MFCard>
      <SectionTitle title="Recent activity" action="View all" />
      <ActivityList items={commentActivity} />
    </>
  )
}

export function EditorSubmissionReviewScreen() {
  return (
    <>
      <MFHero title="Submission Review" subtitle="Bubble Lettering / Page 12" />
      <MFCard>
        <View style={styles.compareGrid}>
          <PanelPreview label="Before" />
          <PanelPreview label="Submitted" />
        </View>
      </MFCard>
      <MFQueueList items={[
        { id: "assistant", title: "Assistant", subtitle: "Yuna Kato", value: "", tone: "primary" },
        { id: "note", title: "Mangaka approval note", subtitle: "Looks good, please do final review", value: "", tone: "success" },
        { id: "time", title: "Submitted", subtitle: "May 15, 2025 / 2:48 PM", value: "", tone: "neutral" },
        { id: "type", title: "Task type", subtitle: "Lettering", value: "", tone: "primary" },
      ]} />
      <MFCard>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>Linked comments</Text>
          <Text style={styles.link}>2 comments</Text>
        </View>
        <Text style={styles.passText}>Resolved: Adjust bubble tail position</Text>
        <Text style={styles.warnText}>Open: Ensure consistent letter spacing</Text>
      </MFCard>
      <SectionTitle title="Decision panel" />
      <MFCard style={styles.noteBox}>
        <Text style={styles.link}>Your note (optional)</Text>
        <Text style={styles.body}>Overall looks good. Please confirm spacing consistency in a few panels.</Text>
      </MFCard>
      <View style={styles.buttonRow}>
        <MFButton tone="primary" variant="outline">Request Revision</MFButton>
        <MFButton tone="primary" variant="outline">Add Comment</MFButton>
      </View>
      <MFButton tone="success">Final Approve</MFButton>
      <SectionTitle title="History" />
      <ActivityList items={[
        { id: "submitted", title: "Submitted by Assistant", time: "May 15, 2:48 PM", tone: "primary" },
        { id: "approved", title: "Approved by Mangaka", time: "May 15, 4:05 PM", tone: "success" },
        { id: "waiting", title: "Waiting Editor Review", time: "You", tone: "warning" },
      ]} />
    </>
  )
}

export function EditorFinalApprovalsScreen() {
  return (
    <>
      <MFHero title="Final approvals" subtitle="Submissions approved by Mangaka and waiting for your final decision." />
      <MFMetricStrip items={[
        { id: "waiting", label: "Waiting", value: "5", tone: "primary", icon: "file-text" },
        { id: "urgent", label: "Urgent", value: "2", tone: "danger", icon: "alert-triangle" },
        { id: "blocked", label: "Blocked", value: "1", tone: "danger", icon: "lock" },
      ]} />
      <SegmentedControl labels={["All", "Urgent", "Blocked", "Approved Today"]} />
      <View style={styles.stack}>
        {finalApprovals.map((item) => <MFSeriesRow key={item.id} item={item} actionLabel="Review" />)}
      </View>
      <SectionTitle title="Recently approved" action="View all" />
      <ActivityList items={[
        { id: "redraw", title: "Panel redraw / Dawn of Ashes", time: "16m ago", tone: "success" },
        { id: "details", title: "Background details / Shikkoku no Tenshi", time: "1h ago", tone: "success" },
      ]} />
    </>
  )
}

function CommentReviewRow({ item }: { item: CommentItem }) {
  const statusIcon: IconName = item.tone === "danger" ? "alert-triangle" : item.tone === "success" ? "check-circle" : item.tone === "warning" ? "circle" : "check"
  const coverSource = getCommentCoverSource(item)

  return (
    <MFCard style={styles.commentRow}>
      <View style={styles.commentThumb}>
        <View style={styles.commentPanel}>
          <Image source={coverSource} style={styles.commentPanelImage} contentFit="cover" transition={0} />
          <View style={styles.commentPanelShade} />
          <View style={styles.commentBubble} />
        </View>
        <View style={styles.pagePill}><Text style={styles.pagePillText}>{item.page}</Text></View>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.rowBetween}>
          <Text style={styles.commentTitle}>{item.title}</Text>
          <MFIcon name="chevron-right" size={17} color={colors.outline} />
        </View>
        <Text style={styles.commentText}>{item.body}</Text>
        <View style={styles.commentMetaRow}>
          <View style={styles.commentOwnerAvatar}><Text style={styles.commentOwnerText}>{item.owner.charAt(0)}</Text></View>
          <Text style={styles.commentOwner}>{item.owner}</Text>
        </View>
      </View>
      <View style={styles.commentAction}>
        <MFBadge tone={item.tone}>{item.status}</MFBadge>
        <View style={[styles.actionButton, item.tone === "danger" && styles.actionButtonDanger]}>
          <MFIcon name={statusIcon} size={15} color={item.tone === "danger" ? colors.danger : colors.primary} />
          <Text style={[styles.actionButtonText, item.tone === "danger" && styles.actionButtonTextDanger]}>{item.action}</Text>
        </View>
      </View>
    </MFCard>
  )
}

function getCommentCoverSource(item: CommentItem) {
  const title = item.title.toLowerCase()

  if (title.includes("crimson") || item.tone === "success") return crimsonRoadCover
  return shadowlineCover
}

function PanelPreview({ label }: { label: string }) {
  return (
    <View style={styles.panelPreview}>
      <Text style={styles.muted}>{label}</Text>
      <View style={styles.mangaPanel}>
        <Text style={styles.bubble}>WE WILL FIND OUR WAY.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  flex: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: "900" },
  bigTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginVertical: spacing.sm },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  passText: { color: colors.success, fontWeight: "800", fontSize: 12, marginTop: spacing.xs },
  warnText: { color: colors.warning, fontWeight: "800", fontSize: 12, marginTop: spacing.xs },
  body: { color: colors.text, fontSize: 13, lineHeight: 20 },
  link: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  priorityCard: { flexDirection: "row", gap: spacing.md },
  chapterPicker: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  readinessSummary: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  ring: { width: 104, height: 104, borderRadius: 52, borderWidth: 12, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  ringValue: { color: colors.primary, fontSize: 34, fontWeight: "900" },
  ringTotal: { color: colors.textMuted, fontSize: 15, fontWeight: "700" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  failedRow: { backgroundColor: colors.dangerSoft, borderRadius: radius.sm, paddingHorizontal: spacing.sm },
  checkIcon: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  checkTitle: { flex: 1, color: colors.text, fontWeight: "700" },
  checkValue: { fontWeight: "800" },
  compareGrid: { flexDirection: "row", gap: spacing.sm },
  panelPreview: { flex: 1 },
  mangaPanel: { minHeight: 118, borderRadius: radius.md, backgroundColor: "#2f2f37", marginTop: spacing.xs, padding: spacing.sm, alignItems: "flex-end", justifyContent: "flex-start" },
  bubble: { width: 78, height: 58, borderRadius: 30, backgroundColor: colors.surface, color: colors.text, fontSize: 10, fontWeight: "900", textAlign: "center", paddingTop: 13 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  noteBox: { backgroundColor: colors.primarySoft },
  buttonRow: { flexDirection: "row", gap: spacing.sm },
  commentRow: { flexDirection: "row", gap: spacing.sm, alignItems: "stretch", padding: 9 },
  commentThumb: { width: 78, position: "relative" },
  commentPanel: { width: 78, height: 78, borderRadius: radius.md, backgroundColor: "#d9d5df", overflow: "hidden", padding: 8 },
  commentPanelImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  commentPanelShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(22, 12, 36, 0.16)" },
  commentBubble: { marginLeft: "auto", width: 24, height: 36, borderRadius: 14, backgroundColor: colors.surface, opacity: 0.92 },
  pagePill: { position: "absolute", left: 7, bottom: 7, minWidth: 27, height: 23, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e4d7ff" },
  pagePillText: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  commentBody: { flex: 1, gap: 5 },
  commentTitle: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "900" },
  commentText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  commentMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  commentOwnerAvatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  commentOwnerText: { color: colors.primary, fontSize: 10, fontWeight: "900" },
  commentOwner: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  commentAction: { width: 82, alignItems: "flex-end", justifyContent: "space-between", gap: spacing.xs },
  actionButton: { minWidth: 76, minHeight: 34, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 4, paddingHorizontal: 7 },
  actionButtonDanger: { borderColor: colors.danger },
  actionButtonText: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  actionButtonTextDanger: { color: colors.danger },
  blockingCallout: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderColor: "#ffd9d9", backgroundColor: "#fff8f8" },
})

