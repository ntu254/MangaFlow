import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type ColorValue
} from "react-native";
import {
  ActionButton,
  Badge,
  Card,
  ConfirmationDialog,
  MetricCard,
  Screen
} from "./src/components/Primitives";
import {
  boardSeries,
  editorComments,
  editorSeries,
  notifications,
  publicationReadiness,
  rankings,
  urgentReviews
} from "./src/data/seedData";
import { colors, radii, shadow, spacing } from "./src/theme";
import type {
  BoardTab,
  CommentItem,
  EditorTab,
  MobileRole,
  RankingItem,
  ReviewItem,
  SeriesSummary
} from "./src/types";
import { calculateFinalScore } from "./src/utils/ranking";
import { canApprovePublication } from "./src/utils/readiness";

const editorTabs: EditorTab[] = [
  "Home",
  "Series",
  "Reviews",
  "Publication",
  "Profile"
];

const boardTabs: BoardTab[] = [
  "Home",
  "Approvals",
  "Ranking",
  "Decisions",
  "Profile"
];

const tabIcons = {
  Home: "home-outline",
  Series: "albums-outline",
  Reviews: "chatbubbles-outline",
  Publication: "calendar-outline",
  Profile: "person-circle-outline",
  Approvals: "checkmark-done-outline",
  Ranking: "stats-chart-outline",
  Decisions: "shield-checkmark-outline"
} as const;

function statusTone(status: string) {
  if (status.includes("RISK") || status.includes("REVISION")) {
    return "danger" as const;
  }
  if (status.includes("WARNING") || status.includes("REVIEW")) {
    return "warning" as const;
  }
  if (status.includes("APPROVED") || status.includes("READY")) {
    return "success" as const;
  }
  return "default" as const;
}

function SeriesCard({ series }: { series: SeriesSummary }) {
  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={styles.stack}>
          <Text style={styles.cardTitle}>{series.title}</Text>
          <Text style={styles.metaText}>{series.mangaka} · {series.currentChapter}</Text>
        </View>
        <Badge label={series.status} tone={statusTone(series.status)} />
      </View>
      <Text style={styles.bodyText}>{series.editorRecommendation}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${series.progress}%` }]} />
      </View>
      <View style={styles.inlineMeta}>
        <Text style={styles.metaText}>Rank #{series.ranking}</Text>
        <Text style={styles.metaText}>Vote {series.voteProgress}</Text>
        <Text style={styles.metaText}>{series.genre.join(", ")}</Text>
      </View>
    </Card>
  );
}

function ReviewCard({
  item,
  onAction
}: {
  item: ReviewItem;
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={styles.stack}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.metaText}>{item.seriesTitle} · {item.dueLabel}</Text>
        </View>
        <Badge label={item.type} tone={item.priority === "high" ? "danger" : "default"} />
      </View>
      <View style={styles.actionRow}>
        <ActionButton
          icon="checkmark-circle-outline"
          label={item.type === "COMMENT" ? "Resolve" : "Approve"}
          onPress={() =>
            onAction(
              item.type === "COMMENT" ? "Resolve comment" : "Approve review",
              `${item.title} will be marked as completed for ${item.seriesTitle}.`,
              item.type === "COMMENT" ? "Resolve" : "Approve"
            )
          }
        />
        <ActionButton
          label="Revision"
          onPress={() =>
            onAction(
              "Request revision",
              `Request revision for ${item.title}. This action will notify the assigned workflow users.`,
              "Request revision"
            )
          }
          variant="secondary"
        />
      </View>
    </Card>
  );
}

function CommentQueue({ comments }: { comments: CommentItem[] }) {
  return (
    <View style={styles.stack}>
      {comments.map((comment) => (
        <Card key={comment.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{comment.seriesTitle}</Text>
            <Badge label={comment.status} tone={statusTone(comment.status)} />
          </View>
          <Text style={styles.metaText}>{comment.pageLabel}</Text>
          <Text style={styles.bodyText}>{comment.text}</Text>
        </Card>
      ))}
    </View>
  );
}

function EditorHome({
  unreadCount,
  onAction
}: {
  unreadCount: number;
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Editor Home" subtitle="Tantou Editor" unreadCount={unreadCount}>
      <View style={styles.metricGrid}>
        <MetricCard label="Assigned Series" value={editorSeries.length} />
        <MetricCard label="Manuscripts Waiting" value={1} color={colors.pinkPurple} />
        <MetricCard label="Open Comments" value={editorComments.length} color={colors.rosePink} />
        <MetricCard label="Deadline Risk" value={2} color={colors.coral} />
      </View>
      <Text style={styles.sectionTitle}>Urgent Queue</Text>
      {urgentReviews.map((review) => (
        <ReviewCard item={review} key={review.id} onAction={onAction} />
      ))}
    </Screen>
  );
}

function EditorSeries() {
  return (
    <Screen title="Assigned Series" subtitle="Tantou Editor">
      {editorSeries.map((series) => (
        <SeriesCard key={series.id} series={series} />
      ))}
    </Screen>
  );
}

function EditorReviews({
  onAction
}: {
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Review Queue" subtitle="Manuscripts, pages, comments">
      {urgentReviews.map((review) => (
        <ReviewCard item={review} key={review.id} onAction={onAction} />
      ))}
      <Text style={styles.sectionTitle}>Comment Queue</Text>
      <CommentQueue comments={editorComments} />
    </Screen>
  );
}

function EditorPublication({
  onAction
}: {
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  const ready = canApprovePublication(publicationReadiness);

  return (
    <Screen title="Publication" subtitle="Readiness checklist">
      <Card style={{ backgroundColor: colors.bgPanel }}>
        <Text style={styles.cardTitle}>Paper Moon Arcade · Chapter 7</Text>
        <Text style={styles.bodyText}>
          Approval is blocked until every required production item is complete.
        </Text>
      </Card>
      {publicationReadiness.map((item) => (
        <Card key={item.label}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Badge label={item.complete ? "Complete" : "Blocked"} tone={item.complete ? "success" : "danger"} />
          </View>
        </Card>
      ))}
      <ActionButton
        disabled={!ready}
        icon="checkmark-done-outline"
        label={ready ? "Approve for Publication" : "Approval Blocked"}
        onPress={() =>
          onAction(
            "Approve publication",
            "This confirms the chapter is ready to move toward publication.",
            "Approve"
          )
        }
      />
      <ActionButton
        label="Request Revision"
        onPress={() =>
          onAction(
            "Request revision",
            "This sends the chapter back with a publication blocker notice.",
            "Request revision"
          )
        }
        variant="secondary"
      />
    </Screen>
  );
}

function BoardHome({ unreadCount }: { unreadCount: number }) {
  return (
    <Screen title="Board Home" subtitle="Editorial Board" unreadCount={unreadCount}>
      <View style={styles.metricGrid}>
        <MetricCard label="Pending Approvals" value={boardSeries.length} />
        <MetricCard label="Votes Required" value={3} color={colors.pinkPurple} />
        <MetricCard label="At-Risk Series" value={1} color={colors.rosePink} />
        <MetricCard label="Ranking Period" value="W23" color={colors.coral} />
      </View>
      <Text style={styles.sectionTitle}>Approval Queue</Text>
      {boardSeries.map((series) => (
        <SeriesCard key={series.id} series={series} />
      ))}
    </Screen>
  );
}

function BoardApprovals({
  onAction
}: {
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Approvals" subtitle="Summary-based board review">
      {boardSeries.map((series) => (
        <Card key={series.id}>
          <View style={styles.rowBetween}>
            <View style={styles.stack}>
              <Text style={styles.cardTitle}>{series.title}</Text>
              <Text style={styles.metaText}>{series.mangaka} · {series.submittedAt}</Text>
            </View>
            <Badge label={series.voteProgress} tone="warning" />
          </View>
          <Text style={styles.bodyText}>{series.editorRecommendation}</Text>
          <View style={styles.inlineMeta}>
            <Text style={styles.metaText}>{series.genre.join(", ")}</Text>
            <Text style={styles.metaText}>Rank #{series.ranking}</Text>
            <Text style={styles.metaText}>{series.status}</Text>
          </View>
          <View style={styles.actionRow}>
            <ActionButton
              label="Approve"
              onPress={() =>
                onAction(
                  "Submit vote",
                  `Vote APPROVE for ${series.title}. This will be recorded with your board identity.`,
                  "Submit vote"
                )
              }
            />
            <ActionButton
              label="Needs Revision"
              onPress={() =>
                onAction(
                  "Submit vote",
                  `Vote NEEDS_REVISION for ${series.title}. Reason is required for this decision.`,
                  "Submit vote"
                )
              }
              variant="secondary"
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function RankingCard({ item }: { item: RankingItem }) {
  const finalScore = calculateFinalScore(item.voteCount, item.readerScore);

  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={styles.rankBubble}>
          <Text style={styles.rankText}>#{item.rank}</Text>
        </View>
        <Badge label={item.status} tone={statusTone(item.status)} />
      </View>
      <Text style={styles.cardTitle}>{item.seriesTitle}</Text>
      <View style={styles.inlineMeta}>
        <Text style={styles.metaText}>Prev #{item.previousRank}</Text>
        <Text style={styles.metaText}>Votes {item.voteCount.toLocaleString()}</Text>
        <Text style={styles.metaText}>Reader {item.readerScore}/10</Text>
      </View>
      <Text style={styles.scoreText}>Final score {finalScore.toLocaleString()}</Text>
    </Card>
  );
}

function BoardRanking({
  onAction
}: {
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Ranking" subtitle="Period 2026-W23">
      <Card style={{ backgroundColor: colors.bgPanel }}>
        <Text style={styles.cardTitle}>Formula</Text>
        <Text style={styles.bodyText}>
          finalScore = voteCount * 0.7 + normalizedReaderScore * 0.3
        </Text>
      </Card>
      {rankings.map((ranking) => (
        <RankingCard item={ranking} key={ranking.id} />
      ))}
      <ActionButton
        label="Mark At Risk"
        onPress={() =>
          onAction(
            "Mark series at risk",
            "This moves the selected series into at-risk governance review.",
            "Mark at risk"
          )
        }
        variant="warning"
      />
    </Screen>
  );
}

function BoardDecisions({
  onAction
}: {
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Decisions" subtitle="Chair tie-break and history">
      <Card style={{ borderColor: colors.rosePink }}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Chair tie-break required</Text>
          <Badge label="BOARD_CHAIR" tone="danger" />
        </View>
        <Text style={styles.bodyText}>
          Star Lantern Guild has an unresolved vote tie. Only the Board Chair can
          finalize this decision.
        </Text>
        <ActionButton
          icon="shield-checkmark-outline"
          label="Finalize Tie-Break"
          onPress={() =>
            onAction(
              "Finalize tie-break",
              "This is a final board decision and requires chair authority.",
              "Finalize"
            )
          }
          variant="danger"
        />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Recent decision</Text>
        <Text style={styles.bodyText}>
          Aurora Ink continued with a ranking warning and editor follow-up.
        </Text>
      </Card>
    </Screen>
  );
}

function ProfileScreen({
  role,
  unreadCount
}: {
  role: MobileRole;
  unreadCount: number;
}) {
  const isEditor = role === "EDITOR";
  const profile = {
    name: isEditor ? "Tantou Editor" : "Editorial Board",
    handle: isEditor ? "editor@mangaflow.local" : "board@mangaflow.local",
    scope: isEditor ? "Assigned series review" : "Governance and ranking",
    primaryMetric: isEditor ? `${editorSeries.length} assigned series` : `${boardSeries.length} approvals`,
    secondaryMetric: isEditor ? `${editorComments.length} open comments` : `${rankings.length} ranking items`
  };

  return (
    <Screen title="Profile" subtitle={profile.name} unreadCount={unreadCount}>
      <Card style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={34} color={colors.primary} />
        </View>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.metaText}>{profile.handle}</Text>
        <Badge label={profile.scope} tone="default" />
      </Card>

      <View style={styles.metricGrid}>
        <MetricCard label="Primary Scope" value={profile.primaryMetric} />
        <MetricCard label="Current Signals" value={profile.secondaryMetric} color={colors.pinkPurple} />
      </View>

      <Text style={styles.sectionTitle}>Recent Alerts</Text>
      {notifications.slice(0, 2).map((notification) => (
        <Card key={notification.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{notification.title}</Text>
            <Badge
              label={notification.unread ? "Unread" : "Read"}
              tone={notification.priority === "high" ? "danger" : "default"}
            />
          </View>
          <Text style={styles.bodyText}>{notification.message}</Text>
        </Card>
      ))}
    </Screen>
  );
}

function RoleSwitch({
  role,
  setRole
}: {
  role: MobileRole;
  setRole: (role: MobileRole) => void;
}) {
  return (
    <View style={styles.roleSwitch}>
      {(["EDITOR", "BOARD"] as const).map((nextRole) => (
        <ActionButton
          key={nextRole}
          label={nextRole === "EDITOR" ? "Tantou Editor" : "Editorial Board"}
          onPress={() => setRole(nextRole)}
          variant={role === nextRole ? "primary" : "secondary"}
        />
      ))}
    </View>
  );
}

function BottomTabs({
  role,
  tab,
  setTab,
  unreadCount
}: {
  role: MobileRole;
  tab: string;
  setTab: (tab: string) => void;
  unreadCount: number;
}) {
  const tabs = role === "EDITOR" ? editorTabs : boardTabs;

  return (
    <View style={styles.tabs}>
      {tabs.map((item) => {
        const active = item === tab;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tabItem, active ? styles.tabItemActive : null]}
          >
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={tabIcons[item]}
                size={20}
                color={(active ? colors.primary : colors.textMuted) as ColorValue}
              />
              {item === "Profile" && unreadCount > 0 ? (
                <Text style={styles.tabBadge}>{unreadCount}</Text>
              ) : null}
            </View>
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              numberOfLines={1}
              style={[styles.tabLabel, active ? styles.tabLabelActive : null]}
            >
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const [role, setRoleState] = useState<MobileRole>("EDITOR");
  const [editorTab, setEditorTab] = useState<EditorTab>("Home");
  const [boardTab, setBoardTab] = useState<BoardTab>("Home");
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
  } | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    []
  );

  function setRole(nextRole: MobileRole) {
    setRoleState(nextRole);
    setEditorTab("Home");
    setBoardTab("Home");
  }

  const openDialog = (title: string, message: string, confirmLabel: string) => {
    setDialog({ title, message, confirmLabel });
  };

  let content;
  if (role === "EDITOR") {
    content =
      editorTab === "Home" ? (
        <EditorHome unreadCount={unreadCount} onAction={openDialog} />
      ) : editorTab === "Series" ? (
        <EditorSeries />
      ) : editorTab === "Reviews" ? (
        <EditorReviews onAction={openDialog} />
      ) : editorTab === "Publication" ? (
        <EditorPublication onAction={openDialog} />
      ) : (
        <ProfileScreen role={role} unreadCount={unreadCount} />
      );
  } else {
    content =
      boardTab === "Home" ? (
        <BoardHome unreadCount={unreadCount} />
      ) : boardTab === "Approvals" ? (
        <BoardApprovals onAction={openDialog} />
      ) : boardTab === "Ranking" ? (
        <BoardRanking onAction={openDialog} />
      ) : boardTab === "Decisions" ? (
        <BoardDecisions onAction={openDialog} />
      ) : (
        <ProfileScreen role={role} unreadCount={unreadCount} />
      );
  }

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgMain} />
      <RoleSwitch role={role} setRole={setRole} />
      <ScrollView>{content}</ScrollView>
      <BottomTabs
        role={role}
        tab={role === "EDITOR" ? editorTab : boardTab}
        unreadCount={unreadCount}
        setTab={(nextTab) => {
          if (role === "EDITOR") {
            setEditorTab(nextTab as EditorTab);
            return;
          }
          setBoardTab(nextTab as BoardTab);
        }}
      />
      <ConfirmationDialog
        confirmLabel={dialog?.confirmLabel ?? "Confirm"}
        message={dialog?.message ?? ""}
        onCancel={() => setDialog(null)}
        onConfirm={() => setDialog(null)}
        title={dialog?.title ?? ""}
        visible={Boolean(dialog)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.bgMain,
    flex: 1
  },
  stack: {
    gap: spacing.md
  },
  rowBetween: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  cardTitle: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.sm
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18
  },
  inlineMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md
  },
  progressTrack: {
    backgroundColor: colors.bgSoft,
    borderRadius: 999,
    height: 9,
    marginTop: spacing.lg,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg
  },
  roleSwitch: {
    backgroundColor: colors.bgMain,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.sm
  },
  tabs: {
    alignItems: "center",
    backgroundColor: "rgba(248, 241, 255, 0.96)",
    borderColor: colors.borderDefault,
    borderRadius: radii.xl,
    borderWidth: 1,
    bottom: spacing.md,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    left: spacing.md,
    padding: 6,
    position: "absolute",
    right: spacing.md,
    ...shadow
  },
  tabItem: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.48)",
    borderColor: "rgba(234, 223, 246, 0)",
    borderWidth: 1,
    borderRadius: radii.lg,
    flex: 1,
    gap: 3,
    justifyContent: "center",
    minHeight: 58,
    minWidth: 0,
    overflow: "visible",
    paddingHorizontal: 4,
    paddingVertical: 7
  },
  tabItemActive: {
    backgroundColor: colors.bgCard,
    borderColor: colors.borderDefault,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4
  },
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22,
    position: "relative"
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 12,
    textAlign: "center"
  },
  tabLabelActive: {
    color: colors.primary
  },
  tabBadge: {
    backgroundColor: colors.rosePink,
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 12,
    minWidth: 15,
    overflow: "hidden",
    paddingHorizontal: 4,
    position: "absolute",
    right: -12,
    textAlign: "center",
    top: -5
  },
  profileCard: {
    alignItems: "center",
    gap: spacing.sm
  },
  profileAvatar: {
    alignItems: "center",
    backgroundColor: colors.bgCanvas,
    borderColor: colors.borderDefault,
    borderRadius: 999,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0
  },
  rankBubble: {
    alignItems: "center",
    backgroundColor: colors.bgCanvas,
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  rankText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900"
  },
  scoreText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: spacing.md
  }
});
