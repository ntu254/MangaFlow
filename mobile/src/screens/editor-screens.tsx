import { Image } from "expo-image"
import { Text, View, StyleSheet } from "react-native"
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
import type { EditorCommentItem } from "@/data/editor"
import type { EditorReadinessCheck } from "@/domain/workflow"
import { MFIcon, type IconName } from "@/design/icons"
import { colors, radius, spacing } from "@/design/tokens"
import { useEditorMobileFlow } from "@/hooks/use-editor-mobile-flow"

const shadowlineCover = require("../../assets/images/biatruyen.jpg")
const crimsonRoadCover = require("../../assets/images/biatruyen1.jpg")

export function EditorHomeScreen() {
  const flow = useEditorMobileFlow()
  const passed = flow.readiness.checks.filter((check) => check.passed).length

  return (
    <>
      <MFHero title="Today" subtitle="Review and publication companion" />
      <StateBanner loading={flow.loading} error={flow.error} message={flow.lastMockAction} />
      <SectionTitle title="Next actions" action="View all" />
      <MFActionCards items={flow.home.actions} />
      <SectionTitle title="Review queues" />
      <MFQueueList items={flow.home.queues} />
      <SectionTitle title="Priority chapter" />
      <MFCard style={styles.priorityCard}>
        <MFCover item={flow.home.priorityChapter} small />
        <View style={styles.flex}>
          <Text style={styles.title}>{flow.readiness.chapterTitle}</Text>
          <MFBadge tone={flow.readiness.overallPassed ? "success" : "danger"}>{flow.readiness.overallPassed ? "Ready" : "Blocked"}</MFBadge>
          <Text style={styles.passText}>{passed} / {flow.readiness.checks.length} checks passed</Text>
          <MFProgress value={passed / flow.readiness.checks.length} />
          <Text style={styles.muted}>Source: {flow.readiness.source}. Mobile displays results only.</Text>
        </View>
      </MFCard>
      <SectionTitle title="Recent activity" action="View all" />
      <ActivityList items={flow.home.activity} />
    </>
  )
}

export function EditorManuscriptsScreen() {
  const flow = useEditorMobileFlow()
  const selected = flow.selectedManuscript

  return (
    <>
      <MFHero title="Manuscripts" subtitle="Proposal review before Board review." />
      <StateBanner loading={flow.loading} error={flow.error} message={flow.lastMockAction} />
      <MFMetricStrip items={[
        { id: "waiting", label: "Waiting", value: String(flow.manuscriptItems.filter((item) => item.manuscriptStatus === "EDITOR_REVIEW").length), tone: "primary", icon: "file-text" },
        { id: "revision", label: "Revisions", value: String(flow.manuscriptItems.filter((item) => item.seriesStatus === "REVISION_REQUESTED").length), tone: "warning", icon: "refresh-cw" },
        { id: "ready", label: "Ready for Board", value: String(flow.manuscriptItems.filter((item) => item.decisionActions.includes("forward-to-board")).length), tone: "success", icon: "shield-check" },
      ]} />
      <SegmentedControl labels={["EDITOR_REVIEW", "Revision", "Forwardable"]} />
      <View style={styles.stack}>
        {flow.manuscriptItems.map((item) => <MFSeriesRow key={item.id} item={item} actionLabel="Open Review" />)}
      </View>
      {selected ? (
        <MFCard>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>Proposal decision preview</Text>
            <MFBadge tone={selected.tone}>{selected.manuscriptStatus}</MFBadge>
          </View>
          <Text style={styles.body}>{selected.editorRecommendation}</Text>
          <Text style={styles.muted}>Version {selected.version}. Forwarding to Board will later call the manuscript action endpoint.</Text>
          <View style={styles.buttonRow}>
            <MFButton tone="warning" variant="outline" onPress={() => flow.recordProposalAction("request-revision")}>Request Revision</MFButton>
            <MFButton tone="danger" variant="outline" onPress={() => flow.recordProposalAction("reject")}>Reject</MFButton>
          </View>
          <MFButton tone="success" onPress={() => flow.recordProposalAction("forward-to-board")}>Forward to Board</MFButton>
        </MFCard>
      ) : null}
      <EditorFinalApprovalsPanel />
    </>
  )
}

export function EditorReadinessScreen() {
  const flow = useEditorMobileFlow()
  const passed = flow.readiness.checks.filter((check) => check.passed).length
  const readinessChecks = flow.readiness.checks.map(readinessCheckToQueueItem)

  return (
    <>
      <MFHero title="Readiness" subtitle="Display backend-owned chapter blockers before publication." />
      <StateBanner loading={flow.loading} error={flow.error} message={flow.lastMockAction} />
      <MFCard style={styles.chapterPicker}>
        <MFCover item={flow.home.priorityChapter} small />
        <Text style={[styles.title, styles.flex]}>{flow.readiness.chapterTitle}</Text>
        <MFIcon name="chevron-right" size={18} color={colors.outline} />
      </MFCard>
      <MFCard style={styles.readinessSummary}>
        <View style={styles.ring}><Text style={styles.ringValue}>{passed}</Text><Text style={styles.ringTotal}>/ {flow.readiness.checks.length}</Text></View>
        <View style={styles.flex}>
          <MFBadge tone={flow.readiness.overallPassed ? "success" : "danger"}>{flow.readiness.overallPassed ? "Ready" : "Blocked"}</MFBadge>
          <Text style={styles.bigTitle}>{passed} of {flow.readiness.checks.length} checks passed</Text>
          <MFProgress value={passed / flow.readiness.checks.length} />
          <Text style={styles.muted}>Source: {flow.readiness.source}. UI does not duplicate readiness logic.</Text>
        </View>
      </MFCard>
      <MFCard>
        {flow.readiness.checks.map((check) => <ReadinessRow key={check.id} check={check} />)}
      </MFCard>
      <SectionTitle title="Blockers" />
      <MFQueueList items={readinessChecks.filter((check) => check.tone === "danger")} />
      <MFButton tone="primary" variant="outline">Open blockers</MFButton>
      <MFButton>Schedule publication mock</MFButton>
    </>
  )
}

export function EditorCommentsScreen() {
  const flow = useEditorMobileFlow()
  const blockingCount = flow.commentsPayload.comments.filter((comment) => "blocking" in comment && comment.blocking).length

  return (
    <>
      <MFHero title="Comments" subtitle="Resolve production feedback through the canonical lifecycle." />
      <StateBanner loading={flow.loading} error={flow.error} message={flow.lastMockAction} />
      <MFMetricStrip items={flow.commentsPayload.metrics} />
      <SegmentedControl labels={["All", "OPEN", "FIXED", "VERIFIED", "RESOLVED"]} />
      <View style={styles.stack}>
        {flow.commentsPayload.comments.map((comment) => <CommentReviewRow key={comment.id} item={comment as EditorCommentItem} />)}
      </View>
      <MFCard style={styles.blockingCallout}>
        <MFIconCircle tone="danger" icon="alert-triangle" size={54} />
        <View style={styles.flex}>
          <Text style={styles.title}>Blocking publication</Text>
          <Text style={styles.body}>There are {blockingCount} unresolved blocking comments. Publication remains blocked until RESOLVED_BY_EDITOR.</Text>
        </View>
        <MFButton tone="danger" variant="outline">Open blockers</MFButton>
      </MFCard>
      <SectionTitle title="Recent activity" action="View all" />
      <ActivityList items={flow.commentsPayload.activity} />
    </>
  )
}

export function EditorSubmissionReviewScreen() {
  const flow = useEditorMobileFlow()
  const item = flow.selectedSubmission

  return (
    <>
      <MFHero title="Submission Review" subtitle={item ? item.subtitle : "Editor final approval"} />
      <StateBanner loading={flow.loading} error={flow.error} message={flow.lastMockAction} />
      <MFCard>
        <View style={styles.compareGrid}>
          <PanelPreview label="Before" />
          <PanelPreview label="Submitted" />
        </View>
      </MFCard>
      {item ? (
        <>
          <MFQueueList items={[
            { id: "assistant", title: "Assistant", subtitle: item.assistantName, value: "", tone: "primary" },
            { id: "note", title: "Mangaka approval note", subtitle: item.mangakaNote, value: "", tone: "success" },
            { id: "status", title: "Review status", subtitle: item.submissionStatus, value: "", tone: item.tone },
            { id: "comments", title: "Linked comments", subtitle: "Resolve before publication readiness", value: String(item.linkedCommentCount), tone: item.linkedCommentCount > 0 ? "warning" : "success" },
          ]} />
          <SectionTitle title="Decision panel" />
          <MFCard style={styles.noteBox}>
            <Text style={styles.link}>Editor final approval boundary</Text>
            <Text style={styles.body}>This action is separate from proposal review and is the only approval path that can later trigger payroll.</Text>
          </MFCard>
          <View style={styles.buttonRow}>
            <MFButton tone="primary" variant="outline" onPress={() => flow.recordFinalApprovalAction("request-revision")}>Request Revision</MFButton>
            <MFButton tone="primary" variant="outline" onPress={() => flow.recordFinalApprovalAction("add-comment")}>Add Comment</MFButton>
          </View>
          <MFButton tone="success" onPress={() => flow.recordFinalApprovalAction("editor-approve")}>Final Approve</MFButton>
        </>
      ) : null}
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
  return <EditorFinalApprovalsPanel standalone />
}

function EditorFinalApprovalsPanel({ standalone = false }: { standalone?: boolean }) {
  const flow = useEditorMobileFlow()

  return (
    <>
      {standalone ? <MFHero title="Final approvals" subtitle="Submissions approved by Mangaka and waiting for Editor decision." /> : <SectionTitle title="Final approvals" action="Review all" />}
      <MFMetricStrip items={[
        { id: "waiting", label: "Waiting", value: String(flow.submissionItems.filter((item) => item.submissionStatus === "MANGAKA_APPROVED").length), tone: "primary", icon: "file-text" },
        { id: "urgent", label: "Urgent", value: String(flow.submissionItems.filter((item) => item.tone === "danger").length), tone: "danger", icon: "alert-triangle" },
        { id: "approved", label: "Approved", value: String(flow.submissionItems.filter((item) => item.submissionStatus === "EDITOR_APPROVED").length), tone: "success", icon: "check-circle" },
      ]} />
      <SegmentedControl labels={["MANGAKA_APPROVED", "Urgent", "Blocked", "EDITOR_APPROVED"]} />
      <View style={styles.stack}>
        {flow.submissionItems.map((item) => <MFSeriesRow key={item.id} item={item} actionLabel="Review" />)}
      </View>
      <EditorSubmissionReviewScreen />
    </>
  )
}

function CommentReviewRow({ item }: { item: EditorCommentItem }) {
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
        <Text style={styles.muted}>{item.canonicalStatus}</Text>
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

function getCommentCoverSource(item: EditorCommentItem) {
  const title = item.title.toLowerCase()

  if (title.includes("crimson") || item.tone === "success") return crimsonRoadCover
  return shadowlineCover
}

function ReadinessRow({ check }: { check: EditorReadinessCheck }) {
  return (
    <View style={[styles.checkRow, !check.passed && styles.failedRow]}>
      <View style={[styles.checkIcon, { borderColor: check.passed ? colors.success : colors.danger }]}>
        <MFIcon name={check.passed ? "check" : "alert-triangle"} size={14} color={check.passed ? colors.success : colors.danger} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.checkTitle}>{check.title}</Text>
        <Text style={styles.muted}>{check.reason}</Text>
      </View>
      <Text style={[styles.checkValue, { color: check.passed ? colors.success : colors.danger }]}>{check.passed ? "Passed" : "Failed"}</Text>
    </View>
  )
}

function readinessCheckToQueueItem(check: EditorReadinessCheck) {
  return {
    id: check.id,
    title: check.title,
    subtitle: check.reason,
    value: check.passed ? "Passed" : "Failed",
    tone: check.passed ? "success" as const : "danger" as const,
    icon: check.passed ? "check-circle" as const : "alert-triangle" as const,
  }
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

function StateBanner({ loading, error, message }: { loading: boolean; error: string | null; message: string }) {
  if (error) return <MFCard style={styles.errorPanel}><Text style={styles.body}>{error}</Text></MFCard>
  return <Text style={styles.muted}>{loading ? "Loading mock Editor flow..." : message}</Text>
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  flex: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: "900", flexShrink: 1 },
  bigTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginVertical: spacing.sm },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  passText: { color: colors.success, fontWeight: "800", fontSize: 12, marginTop: spacing.xs },
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
  checkValue: { fontWeight: "800", fontSize: 12 },
  compareGrid: { flexDirection: "row", gap: spacing.sm },
  panelPreview: { flex: 1 },
  mangaPanel: { minHeight: 118, borderRadius: radius.md, backgroundColor: "#2f2f37", marginTop: spacing.xs, padding: spacing.sm, alignItems: "flex-end", justifyContent: "flex-start" },
  bubble: { width: 78, height: 58, borderRadius: 30, backgroundColor: colors.surface, color: colors.text, fontSize: 10, fontWeight: "900", textAlign: "center", paddingTop: 13 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  noteBox: { backgroundColor: colors.primarySoft },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
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
  errorPanel: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
})
