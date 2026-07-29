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
  TaskStatusSummary,
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
import { useAuth } from "@/shared/auth";
import {
  ErrorState,
  PageHeader,
  PageSection,
  PageShell,
  SummaryGrid,
  TableSkeleton,
} from "@/shared/layout/page-layout";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatCard } from "@/shared/ui/stat-card";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Coins } from "lucide-react";
import { useMemo } from "react";

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
    () => (user ? notifItems.filter((n) => n.userId === user.id && !n.archivedAt) : []),
    [notifItems, user],
  );

  const myUnreadNotifs = useMemo(
    () =>
      user ? notifItems.filter((n) => n.userId === user.id && !n.archivedAt && !n.readAt) : [],
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
          visualStatus === "BLOCKED" ||
          visualStatus === "OVERDUE"
        );
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 5);
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
        .slice(0, 5),
    [mySubs],
  );

  const earningSummary = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return {
      pending: myEarnings.filter((e) => e.status === "PENDING").reduce((a, b) => a + b.amount, 0),
      confirmed: myEarnings
        .filter((e) => e.status === "CONFIRMED")
        .reduce((a, b) => a + b.amount, 0),
      paidMonth: myEarnings
        .filter((e) => e.status === "PAID" && e.month === monthKey)
        .reduce((a, b) => a + b.amount, 0),
    };
  }, [myEarnings]);

  if (!user) return null;

  if (tasksError) {
    return (
      <PageShell dashboardRole="assistant">
        <ErrorState
          title="Could not load assistant workspace"
          description={
            taskError instanceof Error
              ? taskError.message
              : "Please try again after the backend is available."
          }
        />
      </PageShell>
    );
  }

  if (tasksLoading) {
    return (
      <PageShell dashboardRole="assistant">
        <PageHeader
          eyebrow="Assistant workspace"
          title={`Today, ${user.name.split(" ")[0]}`}
          description="Loading data..."
        />
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <PageSection title="Today focus">
            <TableSkeleton rows={3} columns={1} />
          </PageSection>
          <PageSection title="Revision requests">
            <TableSkeleton rows={3} columns={1} />
          </PageSection>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell dashboardRole="assistant">
      <PageHeader
        eyebrow="Assistant workspace"
        title={`Today, ${user.name.split(" ")[0]}`}
        description={`${mine.length} tasks, ${revisions.length} revision requests, ${myNotifs.filter((n) => !n.readAt).length} new notifications.`}
        actions={
          <>
            {myUnreadNotifs.length > 0 ? (
              <button
                onClick={handleMarkAllAssistantNotifsRead}
                disabled={myUnreadNotifs.length === 0 || markAllReadMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40"
              >
                <Check className="size-3.5" /> Mark all as read
              </button>
            ) : null}
            <Link
              to="/app/assistant/tasks"
              aria-label="Open My Tasks"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
            >
              Open My Tasks <ArrowRight className="size-3.5" />
            </Link>
          </>
        }
      />

      <TaskStatusSummary tasks={mine} />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <PageSection title="Today focus">
          {today.length === 0 ? (
            <p className="text-xs text-muted-foreground">No urgent tasks today.</p>
          ) : (
            <ul className="space-y-2">
              {today.map((t) => {
                const ctx = buildTaskContext(t, chapters, seriesList);
                const risk = deadlineRisk(t.dueAt);
                const visualStatus = getVisualTaskStatus(t);
                const edgeSummary = getTaskEdgeSummary(t);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded border border-border bg-background/60 p-2.5 text-xs"
                  >
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getVisualTaskStatusClass(visualStatus)}`}
                    >
                      {getTaskStatusLabel(visualStatus)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{t.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {ctx.series?.title} · Ch.{ctx.chapter?.number} · {formatDate(t.dueAt)} ·{" "}
                        {risk.label}
                      </p>
                      {edgeSummary ? (
                        <p className="text-[10px] text-accent mt-0.5 truncate">{edgeSummary}</p>
                      ) : null}
                    </div>
                    <Link
                      to="/app/assistant/tasks/$taskId/studio"
                      params={{ taskId: t.id }}
                      aria-label={`Open task: ${t.title}`}
                      className="shrink-0 rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background hover:opacity-90"
                    >
                      {visualStatus === "CANCELLED" ? "View" : "Open"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </PageSection>

        <PageSection title="Revision requests">
          {revisions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No revision requests.</p>
          ) : (
            <ul className="space-y-2">
              {revisions.map((t) => {
                const c = comments.find((x) => x.pageId === t.pageId);
                return (
                  <li
                    key={t.id}
                    className="rounded border border-orange-200 bg-orange-50 p-2.5 text-[11px] text-orange-900"
                  >
                    <p className="font-semibold">{t.title}</p>
                    {c ? <p className="mt-0.5 line-clamp-2 text-orange-800">{c.text}</p> : null}
                    <Link
                      to="/app/assistant/tasks/$taskId/studio"
                      params={{ taskId: t.id }}
                      aria-label={`Open task studio for: ${t.title}`}
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-orange-900 underline-offset-2 hover:underline"
                    >
                      Open Task Studio →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </PageSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PageSection title="Upcoming deadlines">
          {upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">No upcoming deadlines.</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((t) => {
                const ctx = buildTaskContext(t, chapters, seriesList);
                const risk = deadlineRisk(t.dueAt);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{t.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {ctx.series?.title} · Ch.{ctx.chapter?.number} · P.
                        {String(ctx.pageIndex ?? 0).padStart(2, "0")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        risk.tone === "rose"
                          ? "bg-rose-100 text-rose-900"
                          : risk.tone === "amber"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {formatDate(t.dueAt)} · {risk.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </PageSection>

        <PageSection title="Recent submissions">
          {recentSubs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No submissions yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {recentSubs.map((s) => {
                const task = mine.find((t) => t.id === s.taskId);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{task?.title ?? s.taskId}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateTime(s.submittedAt)} · {s.versionLabel}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SUBMISSION_STATUS_BADGE[s.status]}`}
                    >
                      {SUBMISSION_STATUS_LABEL[s.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </PageSection>

        <PageSection title="Earning summary">
          {myEarnings.length === 0 ? (
            <EmptyState title="No earnings data yet" />
          ) : (
            <SummaryGrid className="grid-cols-3 gap-2">
              <StatCard
                tone="warning"
                icon={<Coins className="size-4" />}
                label="Pending"
                value={formatYen(earningSummary.pending)}
              />
              <StatCard
                tone="neutral"
                icon={<Coins className="size-4" />}
                label="Confirmed"
                value={formatYen(earningSummary.confirmed)}
              />
              <StatCard
                tone="success"
                icon={<Coins className="size-4" />}
                label="Paid (month)"
                value={formatYen(earningSummary.paidMonth)}
              />
            </SummaryGrid>
          )}
        </PageSection>
      </div>

      <PageSection title="Notifications">
        {myNotifs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No new notifications</p>
        ) : (
          <ul className="divide-y divide-border">
            {myNotifs.slice(0, 5).map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.readAt ? (
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </PageShell>
  );
}

function formatYen(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}
