import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, type ReactNode } from "react";
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
  EmptyState,
  MetricCard,
  Screen,
  StateBanner
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
import { roleFromUser, useMobileApiData } from "./src/hooks/useMobileApiData";
import type {
  BoardTab,
  CommentItem,
  EditorTab,
  MobileRole,
  NotificationItem,
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
  if (!comments.length) {
    return (
      <EmptyState
        title="No comments"
        message="Comment workflows will appear after target comment API data is available."
      />
    );
  }

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
  series,
  comments,
  status,
  onAction
}: {
  unreadCount: number;
  series: SeriesSummary[];
  comments: CommentItem[];
  status?: ReactNode;
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Editor Home" subtitle="Tantou Editor" unreadCount={unreadCount} status={status}>
      <View style={styles.metricGrid}>
        <MetricCard label="Assigned Series" value={series.length} />
        <MetricCard label="Manuscripts Waiting" value={1} color={colors.pinkPurple} />
        <MetricCard label="Open Comments" value={comments.length} color={colors.rosePink} />
        <MetricCard label="Deadline Risk" value={2} color={colors.coral} />
      </View>
      <Text style={styles.sectionTitle}>Urgent Queue</Text>
      {urgentReviews.map((review) => (
        <ReviewCard item={review} key={review.id} onAction={onAction} />
      ))}
    </Screen>
  );
}

function EditorSeries({
  series,
  status
}: {
  series: SeriesSummary[];
  status?: ReactNode;
}) {
  return (
    <Screen title="Assigned Series" subtitle="Tantou Editor" status={status}>
      {series.length ? (
        series.map((item) => <SeriesCard key={item.id} series={item} />)
      ) : (
        <EmptyState
          title="No assigned series"
          message="Series from /api/series will appear here after the token role can access them."
        />
      )}
    </Screen>
  );
}

function EditorReviews({
  comments,
  status,
  onAction
}: {
  comments: CommentItem[];
  status?: ReactNode;
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Review Queue" subtitle="Manuscripts, pages, comments" status={status}>
      {urgentReviews.map((review) => (
        <ReviewCard item={review} key={review.id} onAction={onAction} />
      ))}
      <Text style={styles.sectionTitle}>Comment Queue</Text>
      <CommentQueue comments={comments} />
    </Screen>
  );
}

function EditorPublication({
  status,
  onAction
}: {
  status?: ReactNode;
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  const ready = canApprovePublication(publicationReadiness);

  return (
    <Screen title="Publication" subtitle="Readiness checklist" status={status}>
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

function BoardHome({
  unreadCount,
  series,
  status
}: {
  unreadCount: number;
  series: SeriesSummary[];
  status?: ReactNode;
}) {
  return (
    <Screen title="Board Home" subtitle="Editorial Board" unreadCount={unreadCount} status={status}>
      <View style={styles.metricGrid}>
        <MetricCard label="Pending Approvals" value={series.length} />
        <MetricCard label="Votes Required" value={3} color={colors.pinkPurple} />
        <MetricCard label="At-Risk Series" value={1} color={colors.rosePink} />
        <MetricCard label="Ranking Period" value="W23" color={colors.coral} />
      </View>
      <Text style={styles.sectionTitle}>Approval Queue</Text>
      {series.length ? (
        series.map((item) => <SeriesCard key={item.id} series={item} />)
      ) : (
        <EmptyState
          title="No board approvals"
          message="Board queue needs a server list endpoint for BOARD_REVIEW series."
        />
      )}
    </Screen>
  );
}

function BoardApprovals({
  series,
  status,
  onAction
}: {
  series: SeriesSummary[];
  status?: ReactNode;
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Approvals" subtitle="Summary-based board review" status={status}>
      {series.length ? series.map((series) => (
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
      )) : (
        <EmptyState
          title="No approval items"
          message="When the server exposes board review series, this screen will render the direct API data."
        />
      )}
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
  rankingItems,
  status,
  onAction
}: {
  rankingItems: RankingItem[];
  status?: ReactNode;
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Ranking" subtitle="Period 2026-W23" status={status}>
      <Card style={{ backgroundColor: colors.bgPanel }}>
        <Text style={styles.cardTitle}>Formula</Text>
        <Text style={styles.bodyText}>
          finalScore = voteCount * 0.7 + normalizedReaderScore * 0.3
        </Text>
      </Card>
      {rankingItems.length ? (
        rankingItems.map((ranking) => <RankingCard item={ranking} key={ranking.id} />)
      ) : (
        <EmptyState
          title="No rankings"
          message="Rankings from /api/rankings?period=2026-W23 will appear here."
        />
      )}
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
  status,
  onAction
}: {
  status?: ReactNode;
  onAction: (title: string, message: string, confirmLabel: string) => void;
}) {
  return (
    <Screen title="Decisions" subtitle="Chair tie-break and history" status={status}>
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
  unreadCount,
  userName,
  userEmail,
  roleSeriesCount,
  rankingCount,
  profileNotifications,
  status
}: {
  role: MobileRole;
  unreadCount: number;
  userName?: string;
  userEmail?: string;
  roleSeriesCount: number;
  rankingCount: number;
  profileNotifications: NotificationItem[];
  status?: ReactNode;
}) {
  const isEditor = role === "EDITOR";
  const profile = {
    name: userName || (isEditor ? "Tantou Editor" : "Editorial Board"),
    handle: userEmail || (isEditor ? "editor@mangaflow.local" : "board@mangaflow.local"),
    scope: isEditor ? "Assigned series review" : "Governance and ranking",
    primaryLabel: isEditor ? "Assigned series" : "Approvals",
    secondaryLabel: isEditor ? "Open comments" : "Ranking items",
    secondaryValue: isEditor ? editorComments.length : rankingCount
  };

  return (
    <Screen title="Profile" subtitle={profile.name} unreadCount={unreadCount} status={status}>
      <Card style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={26} color={colors.primary} />
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.metaText}>{profile.handle}</Text>
          <Badge label={profile.scope} tone="default" />
        </View>
      </Card>

      <View style={styles.metricGrid}>
        <MetricCard label={profile.primaryLabel} value={roleSeriesCount} />
        <MetricCard label={profile.secondaryLabel} value={profile.secondaryValue} color={colors.pinkPurple} />
      </View>

      <Text style={styles.sectionTitle}>Recent Alerts</Text>
      {profileNotifications.length ? profileNotifications.slice(0, 2).map((notification) => (
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
      )) : (
        <EmptyState
          title="No alerts"
          message="Notifications from /api/notifications will appear here."
        />
      )}
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
  const apiData = useMobileApiData();
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
  } | null>(null);

  const usingSeedData = apiData.source === "seed";
  const editorSeriesData = usingSeedData ? editorSeries : apiData.editorSeries;
  const boardSeriesData = usingSeedData ? boardSeries : apiData.boardSeries;
  const rankingData = usingSeedData ? rankings : apiData.rankings;
  const notificationData = usingSeedData ? notifications : apiData.notifications;
  const commentData = editorComments;

  const unreadCount = useMemo(() => {
    if (typeof apiData.unreadCount === "number") return apiData.unreadCount;
    return notificationData.filter((notification) => notification.unread).length;
  }, [apiData.unreadCount, notificationData]);

  const statusBanner = apiData.isLoading ? (
    <StateBanner
      title="Dang dong bo API"
      message="Mobile dang lay user, notifications, series va rankings tu server."
      tone="info"
    />
  ) : apiData.error ? (
    <StateBanner
      title={apiData.isUnauthorized ? "Can dang nhap lai" : "Dang dung du lieu demo"}
      message={apiData.error}
      tone={apiData.isUnauthorized ? "danger" : "warning"}
      onRetry={apiData.refresh}
    />
  ) : (
    <StateBanner
      title="Du lieu API dang hoat dong"
      message="Man hinh nay dang doc truc tiep tu MangaFlow server."
      tone="success"
      onRetry={apiData.refresh}
    />
  );

  const resolvedRole = roleFromUser(apiData.user, role);
  const profileName = apiData.user?.fullName;
  const profileEmail = apiData.user?.email;

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
        <EditorHome
          unreadCount={unreadCount}
          series={editorSeriesData}
          comments={commentData}
          status={statusBanner}
          onAction={openDialog}
        />
      ) : editorTab === "Series" ? (
        <EditorSeries series={editorSeriesData} status={statusBanner} />
      ) : editorTab === "Reviews" ? (
        <EditorReviews comments={commentData} status={statusBanner} onAction={openDialog} />
      ) : editorTab === "Publication" ? (
        <EditorPublication status={statusBanner} onAction={openDialog} />
      ) : (
        <ProfileScreen
          role={resolvedRole}
          unreadCount={unreadCount}
          userName={profileName}
          userEmail={profileEmail}
          roleSeriesCount={editorSeriesData.length}
          rankingCount={rankingData.length}
          profileNotifications={notificationData}
          status={statusBanner}
        />
      );
  } else {
    content =
      boardTab === "Home" ? (
        <BoardHome unreadCount={unreadCount} series={boardSeriesData} status={statusBanner} />
      ) : boardTab === "Approvals" ? (
        <BoardApprovals series={boardSeriesData} status={statusBanner} onAction={openDialog} />
      ) : boardTab === "Ranking" ? (
        <BoardRanking
          rankingItems={rankingData}
          status={statusBanner}
          onAction={openDialog}
        />
      ) : boardTab === "Decisions" ? (
        <BoardDecisions status={statusBanner} onAction={openDialog} />
      ) : (
        <ProfileScreen
          role={resolvedRole}
          unreadCount={unreadCount}
          userName={profileName}
          userEmail={profileEmail}
          roleSeriesCount={boardSeriesData.length}
          rankingCount={rankingData.length}
          profileNotifications={notificationData}
          status={statusBanner}
        />
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
    gap: spacing.sm
  },
  rowBetween: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  cardTitle: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    letterSpacing: 0
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17
  },
  inlineMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  progressTrack: {
    backgroundColor: colors.bgSoft,
    borderRadius: 999,
    height: 7,
    marginTop: spacing.md,
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
    gap: spacing.sm,
    marginTop: spacing.md
  },
  roleSwitch: {
    backgroundColor: colors.bgMain,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xs
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
    borderRadius: radii.sm,
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
    flexDirection: "row",
    gap: spacing.md
  },
  profileAvatar: {
    alignItems: "center",
    backgroundColor: colors.bgCanvas,
    borderColor: colors.borderDefault,
    borderRadius: 999,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  profileDetails: {
    flex: 1,
    gap: spacing.xs
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
    letterSpacing: 0
  },
  rankBubble: {
    alignItems: "center",
    backgroundColor: colors.bgCanvas,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  rankText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  scoreText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    marginTop: spacing.sm
  }
});
