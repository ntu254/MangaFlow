import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck,
  FileCode2,
  FileEdit,
  Layers,
  Loader2,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  SUBMISSION_STATUS_BADGE,
  SUBMISSION_STATUS_LABEL,
} from "@/entities/submission/model/assistant-types";
import {
  buildTaskContext,
  deadlineRisk,
  getTaskEdgeSummary,
  getTaskStatusLabel,
  getVisualTaskStatus,
  getVisualTaskStatusClass,
} from "@/entities/task";
import {
  useAssistantEarningsQuery,
  useChaptersForSeriesQuery,
  useCommentsQuery,
  useMarkAllReadMutation,
  useMySeriesQuery,
  useNotificationsQuery,
  useStudioTasksQuery,
  useSubmissionsQuery,
} from "../../api/assistant-queries";
import { tasksForAssistant } from "../../model/assistant-access";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";

function formatYen(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export function AssistantDashboard() {
  const user = useAuth((s) => s.user);
  const { data: seriesList = [] } = useMySeriesQuery();
  const seriesIds = useMemo(() => seriesList.map((series) => series.id), [seriesList]);
  const { data: chapters = [] } = useChaptersForSeriesQuery(seriesIds);
  const {
    data: tasks = [],
    isError: tasksError,
    error: taskError,
    isLoading: tasksLoading,
  } = useStudioTasksQuery({
    assigneeId: user?.id ?? "",
  });
  const { data: comments = [] } = useCommentsQuery({
    seriesId: undefined,
  });
  const { data: submissionsAll = [] } = useSubmissionsQuery({ assistantId: user?.id ?? "" });
  const { data: earningsAll = [] } = useAssistantEarningsQuery();
  const { data: notifItems = [] } = useNotificationsQuery();

  const mine = useMemo(() => (user ? tasksForAssistant(tasks, user.id) : []), [tasks, user]);
  const mySubs = submissionsAll;
  const myEarnings = useMemo(
    () => (user ? earningsAll.filter((e) => e.assistantId === user.id) : []),
    [earningsAll, user],
  );
  const myNotifs = useMemo(
    () => (user ? notifItems.filter((n) => n.userId === user.id) : []),
    [notifItems, user],
  );

  const myUnreadNotifs = useMemo(
    () => (user ? notifItems.filter((n) => n.userId === user.id && !n.readAt) : []),
    [notifItems, user],
  );

  const markAllReadMutation = useMarkAllReadMutation();

  const handleMarkAllAssistantNotifsRead = async () => {
    if (myUnreadNotifs.length === 0) return;
    try {
      const result = await markAllReadMutation.mutateAsync({
        notificationIds: myUnreadNotifs.map((n) => n.id),
      });
      if (result.errorCount > 0) {
        console.error(`${result.errorCount} assistant notifications could not be marked as read`);
      }
    } catch (error) {
      console.error("Error marking assistant notifications as read:", error);
    }
  };

  const today = useMemo(() => {
    return [...mine]
      .filter((t) => {
        const d = deadlineRisk(t.dueAt);
        const visualStatus = getVisualTaskStatus(t);
        return (
          t.status === "MANGAKA_REVISION_REQUESTED" ||
          t.status === "EDITOR_REVISION_REQUESTED" ||
          t.status === "TODO" ||
          d.tone === "rose" ||
          d.tone === "amber" ||
          visualStatus === "OVERDUE"
        );
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 6);
  }, [mine]);

  const upcoming = useMemo(() => {
    return [...mine]
      .filter((t) => {
        const visualStatus = getVisualTaskStatus(t);
        return visualStatus !== "EDITOR_APPROVED" && visualStatus !== "CANCELLED";
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 5);
  }, [mine]);

  const revisions = useMemo(
    () =>
      mine
        .filter(
          (t) =>
            t.status === "MANGAKA_REVISION_REQUESTED" || t.status === "EDITOR_REVISION_REQUESTED",
        )
        .slice(0, 5),
    [mine],
  );

  const recentSubs = useMemo(
    () =>
      [...mySubs]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 6),
    [mySubs],
  );

  const earningSummary = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return {
      totalEarned: myEarnings.reduce((acc, e) => acc + (e.amount || 0), 0),
      pending: myEarnings.filter((e) => e.status === "PENDING").reduce((a, b) => a + b.amount, 0),
      confirmed: myEarnings
        .filter((e) => e.status === "CONFIRMED" || e.status === "EARNED")
        .reduce((a, b) => a + b.amount, 0),
      paidMonth: myEarnings
        .filter((e) => e.status === "PAID" && e.month === monthKey)
        .reduce((a, b) => a + b.amount, 0),
    };
  }, [myEarnings]);

  if (!user) return null;

  if (tasksError) {
    return (
      <div className="mx-auto max-w-7xl p-6 text-center text-xs text-destructive">
        <p className="font-bold">Could not load assistant workspace.</p>
        <p className="mt-1 text-muted-foreground">
          {taskError instanceof Error ? taskError.message : "Backend unavailable."}
        </p>
      </div>
    );
  }

  if (tasksLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const firstName = user.name ? user.name.split(" ")[0] : "Assistant";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* SaaS Dashboard Header — No Eyebrow per Craft Floor Rules */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Track assigned drawing tasks, revision requests, artwork submissions, and studio
            earnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/app/assistant/tasks"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
          >
            Open My Tasks <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Urgent Revision Alert Banner (If Any) */}
      {revisions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-900 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {revisions.length} Revision Request{revisions.length > 1 ? "s" : ""} Pending
              </p>
              <p className="text-[11px] text-rose-800 dark:text-rose-300">
                Mangaka requested revisions on your submitted page artwork. Please review feedback
                and reopen.
              </p>
            </div>
          </div>

          <Link
            to="/app/assistant/tasks/$taskId/studio"
            params={{ taskId: revisions[0].id }}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-800 transition-colors shadow-xs"
          >
            Review Feedback <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* 4-Grid SaaS Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">My Active Tasks</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400">
              <Layers className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{mine.length}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {mine.filter((t) => t.status === "IN_PROGRESS").length} currently in progress
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Revisions Needed
            </span>
            <div className="flex size-7 items-center justify-center rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400">
              <FileEdit className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {revisions.length}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {revisions.length > 0 ? "Requires artist action" : "All revisions clean"}
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Submissions</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-400">
              <FileCheck className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{mySubs.length}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {mySubs.filter((s) => s.status === "PENDING").length} awaiting Mangaka review
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Studio Earnings</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Coins className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {formatYen(earningSummary.confirmed || earningSummary.totalEarned)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Confirmed page work thù lao</p>
        </div>
      </div>

      {/* Main 2-Column Workbench Grid (2/3 Main Focus + 1/3 Sidebar Radar) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3): Today Focus & Recent Artwork Submissions */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Focus Queue */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Today's Focus Tasks</h3>
              </div>
              <Link
                to="/app/assistant/tasks"
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                All Tasks ({mine.length}) <ArrowRight className="size-3" />
              </Link>
            </div>

            {today.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="mx-auto size-6 text-emerald-500/60 mb-2" />
                No urgent tasks pending today. Great job!
              </div>
            ) : (
              <div className="mt-3 divide-y divide-border/60 text-xs">
                {today.map((t) => {
                  const ctx = buildTaskContext(t, chapters, seriesList);
                  const risk = deadlineRisk(t.dueAt);
                  const visualStatus = getVisualTaskStatus(t);

                  return (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getVisualTaskStatusClass(visualStatus)}`}
                          >
                            {getTaskStatusLabel(visualStatus)}
                          </span>
                          <p className="truncate font-bold text-foreground">{t.title}</p>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {ctx.series?.title ?? "Series"} · Ch.{ctx.chapter?.number ?? 1} · Due{" "}
                          {formatDate(t.dueAt)} ·{" "}
                          <span
                            className={risk.tone === "rose" ? "text-rose-600 font-semibold" : ""}
                          >
                            {risk.label}
                          </span>
                        </p>
                      </div>

                      <Link
                        to="/app/assistant/tasks/$taskId/studio"
                        params={{ taskId: t.id }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-2xs"
                      >
                        {visualStatus === "CANCELLED" ? "View" : "Open Studio"}{" "}
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Artwork Submissions Table */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-foreground">Recent Submissions</h3>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {mySubs.length} Submissions Total
              </span>
            </div>

            {recentSubs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No submissions submitted yet. Complete and submit a task to see history here.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-border/60 text-xs">
                {recentSubs.map((s) => {
                  const task = mine.find((t) => t.id === s.taskId);
                  return (
                    <div key={s.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0 pr-2">
                        <p className="truncate font-bold text-foreground">
                          {task?.title ?? `Task ID ${s.taskId}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Submitted {formatDateTime(s.submittedAt)} · {s.versionLabel ?? "v1"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SUBMISSION_STATUS_BADGE[s.status]}`}
                      >
                        {SUBMISSION_STATUS_LABEL[s.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 Sidebar Radar): Deadlines & Earnings Breakdown */}
        <div className="space-y-6">
          {/* Upcoming Deadlines Radar */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-foreground">Deadlines Radar</h3>
              </div>
            </div>

            {upcoming.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No upcoming deadlines.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-border/60 text-xs">
                {upcoming.map((t) => {
                  const ctx = buildTaskContext(t, chapters, seriesList);
                  const risk = deadlineRisk(t.dueAt);
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground">{t.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {ctx.series?.title ?? "Series"} · Ch.{ctx.chapter?.number ?? 1}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          risk.tone === "rose"
                            ? "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
                            : risk.tone === "amber"
                              ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {risk.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Earnings Breakdown */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-foreground">Thù Lao Studio</h3>
              </div>
              <Link
                to="/app/assistant/earnings"
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Details <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 border border-border/40">
                <span className="text-muted-foreground">Pending Approval</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatYen(earningSummary.pending)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 border border-border/40">
                <span className="text-muted-foreground">Confirmed Thù Lao</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatYen(earningSummary.confirmed)}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Notifications */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">
              Notifications & Activity
            </h3>
            {myNotifs.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No new notifications</p>
            ) : (
              <div className="mt-3 divide-y divide-border/60 text-xs">
                {myNotifs.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-foreground font-medium">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.readAt && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
