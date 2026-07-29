import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import {
  ActivityList,
  MFActionCards,
  MFBadge,
  MFButton,
  MFCard,
  MFCover,
  MFEmptyState,
  MFHero,
  MFIconCircle,
  MFMetricStrip,
  MFProgress,
  MFQueueList,
  MFSeriesRow,
  MFStateNotice,
  SectionTitle,
  SegmentedControl,
} from "@/components/mf";
import type { EditorCommentItem } from "@/data/editor";
import type { EditorReadinessCheck } from "@/domain/workflow";
import { MFIcon, type IconName } from "@/design/icons";
import { colors, radius, spacing } from "@/design/tokens";
import { useEditorMobileFlow } from "@/hooks/use-editor-mobile-flow";
import {
  EditorFinalApprovalDecisionPanel,
  EditorProposalDecisionPanel,
} from "@/screens/editor-action-panels";
import { EditorCommentDetailPanel, EditorReadinessEvidencePanel } from "@/screens/editor-panels";
import { SeriesProposalSummaryPanel } from "@/screens/series-proposal-summary-panel";

const shadowlineCover = require("../../assets/images/biatruyen.jpg");
const crimsonRoadCover = require("../../assets/images/biatruyen1.jpg");

export function EditorHomeScreen() {
  const flow = useEditorMobileFlow();
  const passed = flow.readiness.checks.filter((check) => check.passed).length;

  return (
    <>
      <MFHero title="Today" subtitle="Review and publication companion" />
      <MFStateNotice
        loading={flow.loading}
        error={flow.error}
        message={flow.lastMockAction}
        loadingLabel="Loading Editor home..."
      />
      <SectionTitle title="Next actions" action="View all" />
      <MFActionCards items={flow.home.actions} />
      <SectionTitle title="Review queues" />
      <MFQueueList items={flow.home.queues} />
      <SectionTitle title="Priority chapter" />
      <MFCard style={styles.priorityCard}>
        <MFCover item={flow.home.priorityChapter} small />
        <View style={styles.flex}>
          <Text style={styles.title}>{flow.readiness.chapterTitle}</Text>
          <MFBadge tone={flow.readiness.overallPassed ? "success" : "danger"}>
            {flow.readiness.overallPassed ? "Ready" : "Blocked"}
          </MFBadge>
          <Text style={styles.passText}>
            {passed} / {flow.readiness.checks.length} checks passed
          </Text>
          <MFProgress value={passed / flow.readiness.checks.length} />
          <Text style={styles.muted}>
            Source: {flow.readiness.source}. Mobile displays results only.
          </Text>
        </View>
      </MFCard>
      <SectionTitle title="Recent activity" action="View all" />
      <ActivityList items={flow.home.activity} />
    </>
  );
}

export function EditorManuscriptsScreen() {
  const flow = useEditorMobileFlow();
  const selected = flow.selectedManuscript;

  return (
    <>
      <MFHero title="Manuscripts" subtitle="Proposal review before Board review." />
      <MFStateNotice
        loading={flow.loading}
        error={flow.error}
        message={flow.lastMockAction}
        loadingLabel="Loading manuscript review queue..."
      />
      <MFMetricStrip
        items={[
          {
            id: "waiting",
            label: "Waiting",
            value: String(
              flow.manuscriptItems.filter((item) => item.manuscriptStatus === "SUBMITTED").length,
            ),
            tone: "primary",
            icon: "file-text",
          },
          {
            id: "revision",
            label: "Revisions",
            value: String(
              flow.manuscriptItems.filter((item) => item.seriesStatus === "REVISION_REQUESTED")
                .length,
            ),
            tone: "warning",
            icon: "refresh-cw",
          },
          {
            id: "ready",
            label: "Ready for Board",
            value: String(
              flow.manuscriptItems.filter((item) =>
                item.decisionActions.includes("forward-to-board"),
              ).length,
            ),
            tone: "success",
            icon: "shield-check",
          },
        ]}
      />
      <SegmentedControl labels={["Editor review", "Revision", "Forwardable"]} />
      <View style={styles.stack}>
        {flow.manuscriptItems.length > 0 ? (
          flow.manuscriptItems.map((item) => (
            <MFSeriesRow
              key={item.id}
              item={item}
              actionLabel="Open Review"
              selected={flow.selectedManuscriptId === item.id}
              onPress={() => flow.setSelectedManuscriptId(item.id)}
            />
          ))
        ) : (
          <MFEmptyState
            title="No manuscripts waiting"
            subtitle="When the API returns an empty proposal queue, this panel keeps the review route stable."
            icon="file-text"
          />
        )}
      </View>
      {selected ? (
        <>
          <SeriesProposalSummaryPanel
            summary={flow.selectedProposalSummary}
            loading={flow.proposalSummaryLoading}
            role="editor"
          />
          <EditorProposalDecisionPanel
            item={selected}
            pendingAction={flow.pendingProposalAction}
            onStartAction={flow.startProposalAction}
            onConfirm={flow.confirmProposalAction}
            onCancel={flow.cancelProposalAction}
            noteValue={flow.proposalNote}
            onChangeNote={flow.setProposalNote}
            selectedPublicationType={flow.proposalPublicationType}
            onChangePublicationType={flow.setProposalPublicationType}
            busy={flow.actionBusy}
            errorText={flow.actionError}
          />
        </>
      ) : null}
      <EditorFinalApprovalsPanel />
    </>
  );
}

export function EditorReadinessScreen() {
  const flow = useEditorMobileFlow();
  const [showBlockersOnly, setShowBlockersOnly] = useState(false);
  const passed = flow.readiness.checks.filter((check) => check.passed).length;
  const readinessChecks = flow.readiness.checks.map(readinessCheckToQueueItem);
  const visibleReadinessChecks = showBlockersOnly
    ? flow.readiness.checks.filter((check) => !check.passed)
    : flow.readiness.checks;
  const blockerItems = readinessChecks.filter((check) => check.tone === "danger");

  return (
    <>
      <MFHero
        title="Readiness"
        subtitle="Display backend-owned chapter blockers before publication."
      />
      <MFStateNotice
        loading={flow.loading}
        error={flow.error}
        message={flow.lastMockAction}
        loadingLabel="Loading readiness result..."
      />
      <MFCard style={styles.chapterPicker}>
        <MFCover item={flow.home.priorityChapter} small />
        <Text style={[styles.title, styles.flex]}>{flow.readiness.chapterTitle}</Text>
        <MFIcon name="chevron-right" size={18} color={colors.outline} />
      </MFCard>
      <MFCard style={styles.readinessSummary}>
        <View style={styles.ring}>
          <Text style={styles.ringValue}>{passed}</Text>
          <Text style={styles.ringTotal}>/ {flow.readiness.checks.length}</Text>
        </View>
        <View style={styles.flex}>
          <MFBadge tone={flow.readiness.overallPassed ? "success" : "danger"}>
            {flow.readiness.overallPassed ? "Ready" : "Blocked"}
          </MFBadge>
          <Text style={styles.bigTitle}>
            {passed} of {flow.readiness.checks.length} checks passed
          </Text>
          <MFProgress value={passed / flow.readiness.checks.length} />
          <Text style={styles.muted}>
            Source: {flow.readiness.source}. UI does not duplicate readiness logic.
          </Text>
        </View>
      </MFCard>
      <MFCard>
        {visibleReadinessChecks.length > 0 ? (
          visibleReadinessChecks.map((check) => <ReadinessRow key={check.id} check={check} />)
        ) : (
          <MFEmptyState
            title="No blockers"
            subtitle="Backend readiness returned no failing checks for this chapter context."
            icon="check-circle"
            tone="success"
          />
        )}
      </MFCard>
      <EditorReadinessEvidencePanel readiness={flow.readiness} />
      <SectionTitle title="Blockers" />
      <MFQueueList items={blockerItems} />
      <MFButton
        tone="primary"
        variant="soft"
        onPress={() => setShowBlockersOnly((value) => !value)}
      >
        {showBlockersOnly ? "Show all checks" : "Open blockers"}
      </MFButton>
      <MFCard>
        <Text style={styles.title}>Publication scheduling boundary</Text>
        <Text style={styles.body}>
          Mobile displays readiness evidence only. Schedule and publish actions remain outside this
          Editor mobile slice.
        </Text>
      </MFCard>
    </>
  );
}

export function EditorCommentsScreen() {
  const flow = useEditorMobileFlow();
  const [showBlockingOnly, setShowBlockingOnly] = useState(false);
  const blockingCount = flow.commentsPayload.comments.filter(
    (comment) => comment.isBlocking,
  ).length;
  const visibleComments = showBlockingOnly
    ? flow.commentsPayload.comments.filter((comment) => comment.isBlocking)
    : flow.commentsPayload.comments;

  return (
    <>
      <MFHero
        title="Comments"
        subtitle="Resolve production feedback through the canonical lifecycle."
      />
      <MFStateNotice
        loading={flow.loading}
        error={flow.error}
        message={flow.lastMockAction}
        loadingLabel="Loading comment lifecycle..."
      />
      <MFMetricStrip items={flow.commentsPayload.metrics} />
      <SegmentedControl
        labels={
          showBlockingOnly
            ? ["Blocking", "All", "Addressed", "Verified", "Resolved"]
            : ["All", "Open", "Addressed", "Verified", "Resolved"]
        }
      />
      <View style={styles.stack}>
        {visibleComments.length > 0 ? (
          visibleComments.map((comment) => (
            <CommentReviewRow
              key={comment.id}
              item={comment as EditorCommentItem}
              selected={flow.selectedCommentId === comment.id}
              onPress={() => flow.setSelectedCommentId(comment.id)}
            />
          ))
        ) : (
          <MFEmptyState
            title={showBlockingOnly ? "No blocking comments" : "No production comments"}
            subtitle={
              showBlockingOnly
                ? "The current live task context has no unresolved blocking comments."
                : "Resolved or empty comment states remain visible without hiding the lifecycle route."
            }
            icon="message-circle"
            tone="success"
          />
        )}
      </View>
      {flow.selectedComment ? (
        <EditorCommentDetailPanel
          item={flow.selectedComment as EditorCommentItem}
          onResolve={flow.resolveSelectedComment}
          onReopen={flow.reopenSelectedComment}
          busy={flow.actionBusy}
          errorText={flow.actionError}
        />
      ) : null}
      <MFCard style={styles.blockingCallout}>
        <MFIconCircle tone="danger" icon="alert-triangle" size={54} />
        <View style={styles.flex}>
          <Text style={styles.title}>Blocking publication</Text>
          <Text style={styles.body}>
            There are {blockingCount} unresolved blocking comments. Publication remains blocked
            until RESOLVED.
          </Text>
        </View>
        <MFButton
          tone={showBlockingOnly ? "neutral" : "danger"}
          variant="soft"
          style={styles.calloutButton}
          onPress={() => setShowBlockingOnly((value) => !value)}
        >
          {showBlockingOnly ? "Show all" : "Open blockers"}
        </MFButton>
      </MFCard>
      <SectionTitle title="Recent activity" action="View all" />
      <ActivityList items={flow.commentsPayload.activity} />
    </>
  );
}

export function EditorSubmissionReviewScreen() {
  const flow = useEditorMobileFlow();

  return <EditorSubmissionReviewDetail flow={flow} />;
}

function EditorSubmissionReviewDetail({ flow }: { flow: ReturnType<typeof useEditorMobileFlow> }) {
  const item = flow.selectedSubmission;

  return (
    <>
      <MFHero title="Submission Review" subtitle={item ? item.subtitle : "Editor final approval"} />
      <MFStateNotice
        loading={flow.loading}
        error={flow.error}
        message={flow.lastMockAction}
        loadingLabel="Loading final approval detail..."
      />
      <MFCard>
        <View style={styles.compareGrid}>
          <PanelPreview label="Before" />
          <PanelPreview label="Submitted" />
        </View>
      </MFCard>
      {item ? (
        <>
          <MFQueueList
            items={[
              {
                id: "assistant",
                title: "Assistant",
                subtitle: item.assistantName,
                value: "",
                tone: "primary",
              },
              {
                id: "note",
                title: "Mangaka approval note",
                subtitle: item.mangakaNote,
                value: "",
                tone: "success",
              },
              {
                id: "status",
                title: "Review status",
                subtitle: item.submissionStatus,
                value: "",
                tone: item.tone,
              },
              {
                id: "task-detail",
                title: "Task detail",
                subtitle: `Priority ${item.taskPriority ?? "n/a"} / due ${item.taskDueDate ?? "n/a"}`,
                value: item.taskStatus,
                tone: item.taskStatus === "MANGAKA_APPROVED" ? "success" : "primary",
              },
              {
                id: "chapter-detail",
                title: "Chapter detail",
                subtitle: item.subtitle,
                value: item.chapterStatus ?? "API",
                tone: item.chapterStatus === "READY_FOR_PUBLICATION" ? "success" : "neutral",
              },
              {
                id: "page-detail",
                title: "Page metadata",
                subtitle: "Read-only page list; mobile does not request signed file URLs.",
                value: item.pageCount === undefined ? "API" : String(item.pageCount),
                tone: "neutral",
              },
              {
                id: "comments",
                title: "Linked comments",
                subtitle: "Resolve before publication readiness",
                value: String(item.linkedCommentCount),
                tone: item.linkedCommentCount > 0 ? "warning" : "success",
              },
            ]}
          />
          <EditorFinalApprovalDecisionPanel
            item={item}
            pendingAction={flow.pendingFinalApprovalAction}
            onStartAction={flow.startFinalApprovalAction}
            onConfirm={flow.confirmFinalApprovalAction}
            onCancel={flow.cancelFinalApprovalAction}
            noteValue={flow.finalApprovalNote}
            onChangeNote={flow.setFinalApprovalNote}
            busy={flow.actionBusy}
            errorText={flow.actionError}
          />
        </>
      ) : (
        <MFEmptyState
          title="No selected submission"
          subtitle="Select a Mangaka-approved submission to preview final approval details."
          icon="file-check"
        />
      )}
      <SectionTitle title="History" />
      <ActivityList
        items={[
          {
            id: "submitted",
            title: "Submitted by Assistant",
            time: "May 15, 2:48 PM",
            tone: "primary",
          },
          {
            id: "approved",
            title: "Approved by Mangaka",
            time: "May 15, 4:05 PM",
            tone: "success",
          },
          { id: "waiting", title: "Waiting Editor Review", time: "You", tone: "warning" },
        ]}
      />
    </>
  );
}

export function EditorFinalApprovalsScreen() {
  return <EditorFinalApprovalsPanel standalone />;
}

function EditorFinalApprovalsPanel({ standalone = false }: { standalone?: boolean }) {
  const flow = useEditorMobileFlow();

  return (
    <>
      {standalone ? (
        <MFHero
          title="Final approvals"
          subtitle="Submissions approved by Mangaka and waiting for Editor decision."
        />
      ) : (
        <SectionTitle title="Final approvals" action="Review all" />
      )}
      <MFMetricStrip
        items={[
          {
            id: "waiting",
            label: "Waiting",
            value: String(
              flow.submissionItems.filter((item) => item.submissionStatus === "MANGAKA_APPROVED")
                .length,
            ),
            tone: "primary",
            icon: "file-text",
          },
          {
            id: "urgent",
            label: "Urgent",
            value: String(flow.submissionItems.filter((item) => item.tone === "danger").length),
            tone: "danger",
            icon: "alert-triangle",
          },
          {
            id: "approved",
            label: "Mangaka approved",
            value: String(
              flow.submissionItems.filter((item) => item.submissionStatus === "MANGAKA_APPROVED")
                .length,
            ),
            tone: "success",
            icon: "check-circle",
          },
        ]}
      />
      <SegmentedControl labels={["Mangaka approved", "Urgent", "Blocked", "Editor approved"]} />
      <View style={styles.stack}>
        {flow.submissionItems.length > 0 ? (
          flow.submissionItems.map((item) => (
            <MFSeriesRow
              key={item.id}
              item={item}
              actionLabel="Review"
              selected={flow.selectedSubmissionId === item.id}
              onPress={() => flow.setSelectedSubmissionId(item.id)}
            />
          ))
        ) : (
          <MFEmptyState
            title="No final approvals"
            subtitle="The final approval queue can render empty API responses without dropping the decision panel shell."
            icon="shield-check"
            tone="success"
          />
        )}
      </View>
      <EditorSubmissionReviewDetail flow={flow} />
    </>
  );
}

function CommentReviewRow({
  item,
  selected,
  onPress,
}: {
  item: EditorCommentItem;
  selected: boolean;
  onPress: () => void;
}) {
  const statusIcon: IconName =
    item.tone === "danger"
      ? "alert-triangle"
      : item.tone === "success"
        ? "check-circle"
        : item.tone === "warning"
          ? "circle"
          : "check";
  const coverSource = getCommentCoverSource(item);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.commentRow, selected && styles.commentRowSelected]}
    >
      <View style={styles.commentThumb}>
        <View style={styles.commentPanel}>
          <Image
            source={coverSource}
            style={styles.commentPanelImage}
            contentFit="cover"
            transition={0}
          />
          <View style={styles.commentPanelShade} />
          <View style={styles.commentBubble} />
        </View>
        <View style={styles.pagePill}>
          <Text style={styles.pagePillText}>{item.page}</Text>
        </View>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.rowBetween}>
          <Text style={styles.commentTitle}>{item.title}</Text>
          <MFIcon name="chevron-right" size={17} color={colors.outline} />
        </View>
        <Text style={styles.commentText}>{item.body}</Text>
        <Text style={styles.muted}>{item.canonicalStatus}</Text>
        <View style={styles.commentMetaRow}>
          <View style={styles.commentOwnerAvatar}>
            <Text style={styles.commentOwnerText}>{item.owner.charAt(0)}</Text>
          </View>
          <Text style={styles.commentOwner}>{item.owner}</Text>
        </View>
      </View>
      <View style={styles.commentAction}>
        <MFBadge tone={item.tone}>{item.status}</MFBadge>
        <View style={[styles.actionButton, item.tone === "danger" && styles.actionButtonDanger]}>
          <MFIcon
            name={statusIcon}
            size={15}
            color={item.tone === "danger" ? colors.danger : colors.primary}
          />
          <Text
            style={[
              styles.actionButtonText,
              item.tone === "danger" && styles.actionButtonTextDanger,
            ]}
          >
            {selected ? "Selected" : item.action}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function getCommentCoverSource(item: EditorCommentItem) {
  const title = item.title.toLowerCase();

  if (title.includes("crimson") || item.tone === "success") return crimsonRoadCover;
  return shadowlineCover;
}

function ReadinessRow({ check }: { check: EditorReadinessCheck }) {
  const toneColor = check.passed ? colors.success : colors.danger;
  const toneBg = check.passed ? colors.successSoft : colors.dangerSoft;

  return (
    <View style={[styles.checkRow, !check.passed && styles.failedRow]}>
      <View style={[styles.checkIcon, { backgroundColor: toneBg }]}>
        <MFIcon name={check.passed ? "check" : "alert-triangle"} size={14} color={toneColor} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.checkTitle}>{check.title}</Text>
        <Text style={styles.muted}>{check.reason}</Text>
      </View>
      <View style={[styles.checkValuePill, { backgroundColor: toneBg }]}>
        <Text style={[styles.checkValue, { color: toneColor }]}>
          {check.passed ? "Passed" : "Failed"}
        </Text>
      </View>
    </View>
  );
}

function readinessCheckToQueueItem(check: EditorReadinessCheck) {
  return {
    id: check.id,
    title: check.title,
    subtitle: check.reason,
    value: check.passed ? "Passed" : "Failed",
    tone: check.passed ? ("success" as const) : ("danger" as const),
    icon: check.passed ? ("check-circle" as const) : ("alert-triangle" as const),
  };
}

function PanelPreview({ label }: { label: string }) {
  return (
    <View style={styles.panelPreview}>
      <Text style={styles.muted}>{label}</Text>
      <View style={styles.mangaPanel}>
        <Text style={styles.bubble}>WE WILL FIND OUR WAY.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  flex: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: "900", flexShrink: 1 },
  bigTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginVertical: spacing.sm },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  passText: { color: colors.success, fontWeight: "800", fontSize: 12, marginTop: spacing.xs },
  body: { color: colors.text, fontSize: 13, lineHeight: 20 },
  priorityCard: { flexDirection: "row", gap: spacing.md },
  chapterPicker: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  readinessSummary: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  ring: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 12,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: { color: colors.primary, fontSize: 34, fontWeight: "900" },
  ringTotal: { color: colors.textMuted, fontSize: 15, fontWeight: "700" },
  checkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  failedRow: {
    backgroundColor: "#fff7f8",
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkTitle: { flex: 1, color: colors.text, fontWeight: "700" },
  checkValuePill: {
    minWidth: 66,
    minHeight: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  checkValue: { fontWeight: "900", fontSize: 12 },
  compareGrid: { flexDirection: "row", gap: spacing.sm },
  panelPreview: { flex: 1 },
  mangaPanel: {
    minHeight: 118,
    borderRadius: radius.md,
    backgroundColor: "#2f2f37",
    marginTop: spacing.xs,
    padding: spacing.sm,
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  bubble: {
    width: 78,
    height: 58,
    borderRadius: 30,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    paddingTop: 13,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  commentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "stretch",
    padding: 9,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#f0e8f4",
  },
  commentRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  commentThumb: { width: 78, position: "relative" },
  commentPanel: {
    width: 78,
    height: 78,
    borderRadius: radius.md,
    backgroundColor: "#d9d5df",
    overflow: "hidden",
    padding: 8,
  },
  commentPanelImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  commentPanelShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(22, 12, 36, 0.16)" },
  commentBubble: {
    marginLeft: "auto",
    width: 24,
    height: 36,
    borderRadius: 14,
    backgroundColor: colors.surface,
    opacity: 0.92,
  },
  pagePill: {
    position: "absolute",
    left: 7,
    bottom: 7,
    minWidth: 27,
    height: 23,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e4d7ff",
  },
  pagePillText: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  commentBody: { flex: 1, minWidth: 160, gap: 5 },
  commentTitle: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "900" },
  commentText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  commentMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  commentOwnerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  commentOwnerText: { color: colors.primary, fontSize: 10, fontWeight: "900" },
  commentOwner: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  commentAction: {
    width: 88,
    minWidth: 88,
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  actionButton: {
    minWidth: 82,
    minHeight: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 7,
  },
  actionButtonDanger: { backgroundColor: colors.dangerSoft },
  actionButtonText: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  actionButtonTextDanger: { color: colors.danger },
  blockingCallout: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    borderColor: "#ffd9d9",
    backgroundColor: "#fff8f8",
  },
  calloutButton: { flexGrow: 1, flexBasis: "100%" },
});
