import {
  buildTaskContext,
  deadlineRisk,
  getTaskStatusLabel,
  getVisualTaskStatus,
  getVisualTaskStatusClass,
} from "@/entities/task";
import {
  SUBMISSION_STATUS_BADGE,
  SUBMISSION_STATUS_LABEL,
} from "@/entities/submission/model/assistant-types";
import {
  useMangakaReviewQueueQuery,
  useMyChaptersQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
} from "@/features/series";
import { useProposalsQuery } from "@/features/proposals";
import { useAuth } from "@/shared/auth";
import { PageShell } from "@/shared/layout/page-layout";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileEdit,
  FileText,
  Filter,
  Layers,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

export function MangakaDashboard() {
  const user = useAuth((s) => s.user);

  const { data: seriesList = [], isLoading: seriesLoading } = useMySeriesQuery();
  const { data: chapters = [], isLoading: chaptersLoading } = useMyChaptersQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useStudioTasksQuery({});
  const { data: mangakaQueue = [], isLoading: queueLoading } = useMangakaReviewQueueQuery();
  const { data: proposals = [], isLoading: proposalsLoading } = useProposalsQuery(
    user?.id ? { authorId: user.id } : undefined,
  );

  const [activeTab, setActiveTab] = useState<
    "all" | "queue" | "production" | "tasks" | "proposals"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  const isLoading =
    seriesLoading || chaptersLoading || tasksLoading || queueLoading || proposalsLoading;

  const activeSeries = useMemo(
    () => seriesList.filter((series) => series.status !== "ARCHIVED"),
    [seriesList],
  );

  const productionChapters = useMemo(
    () =>
      chapters.filter((chapter) => !["PLANNED", "PUBLISHED", "SCHEDULED"].includes(chapter.status)),
    [chapters],
  );

  const inProgressTasks = useMemo(() => {
    return tasks
      .filter((task) => task.status === "IN_PROGRESS" || task.status === "TODO")
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [tasks]);

  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((task) => {
        const visualStatus = getVisualTaskStatus(task);
        return visualStatus !== "MANGAKA_APPROVED" && visualStatus !== "CANCELLED";
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [tasks]);

  const urgentTasks = useMemo(() => {
    return upcomingDeadlines.filter((task) => deadlineRisk(task.dueAt).tone === "rose");
  }, [upcomingDeadlines]);

  if (!user) return null;

  const firstName = user.name.split(" ")[0];

  if (isLoading) {
    return (
      <PageShell dashboardRole="mangaka">
        <div className="space-y-6 animate-pulse p-2">
          <div className="h-16 rounded-xl bg-muted/50" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-28 rounded-xl bg-muted/40" />
            <div className="h-28 rounded-xl bg-muted/40" />
            <div className="h-28 rounded-xl bg-muted/40" />
            <div className="h-28 rounded-xl bg-muted/40" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-96 rounded-xl bg-muted/30 lg:col-span-2" />
            <div className="h-96 rounded-xl bg-muted/30" />
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell dashboardRole="mangaka">
      <div className="space-y-6">
        {/* SaaS Studio Header & Command Bar */}
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
                Welcome back, {firstName} 👋
              </h1>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Mangaka Studio
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage your ongoing manga series, review assistant work, and monitor production
              deadlines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/app/mangaka/submissions/review"
              className="relative inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
            >
              <ClipboardList className="size-4" />
              Review Queue
              {mangakaQueue.length > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm">
                  {mangakaQueue.length}
                </span>
              )}
            </Link>

            <Link
              to="/app/proposals/new"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-all"
            >
              <Plus className="size-4" />
              New Proposal
            </Link>
          </div>
        </div>

        {/* Urgent Attention Alert Banner (if needed) */}
        {mangakaQueue.length > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Action Required: Assistant Submissions</h4>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                  You have{" "}
                  <span className="font-semibold">{mangakaQueue.length} submission(s)</span> waiting
                  for review. Approving unlocks task slots and generates assistant earnings.
                </p>
              </div>
            </div>
            <Link
              to="/app/mangaka/submissions/review"
              className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
            >
              Process Queue
            </Link>
          </div>
        )}

        {/* SaaS Metrics Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Active Series</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {activeSeries.length}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3" /> Live Production
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Ongoing manga titles</p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">In Production</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Layers className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {productionChapters.length}
              </span>
              <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                Chapters
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Drafts & Review cycles</p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Active Tasks</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {inProgressTasks.length}
              </span>
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                Assigned
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Assistant page tasks</p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">My Proposals</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileText className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {proposals.length}
              </span>
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                Pipeline
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Proposals & Board votes</p>
          </div>
        </div>

        {/* Main Dashboard Layout (2 Columns: Left 2/3 Main Workbench, Right 1/3 Sidebar Radar) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Left Column (2 Cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Filter Tabs Header */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground">Studio Workbench</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Quick View:</span>
                  <div className="flex rounded-lg bg-muted p-0.5 text-xs font-medium">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`rounded-md px-2.5 py-1 text-[11px] transition-all ${
                        activeTab === "all"
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("queue")}
                      className={`rounded-md px-2.5 py-1 text-[11px] transition-all ${
                        activeTab === "queue"
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Queue ({mangakaQueue.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("production")}
                      className={`rounded-md px-2.5 py-1 text-[11px] transition-all ${
                        activeTab === "production"
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Chapters ({productionChapters.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Submissions Queue Table Section */}
              {(activeTab === "all" || activeTab === "queue") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="size-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-xs font-bold text-foreground">
                        Submissions Pending Review
                      </h4>
                    </div>
                    {mangakaQueue.length > 0 && (
                      <Link
                        to="/app/mangaka/submissions/review"
                        className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View All <ArrowUpRight className="size-3" />
                      </Link>
                    )}
                  </div>

                  {mangakaQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-8 text-center bg-muted/20">
                      <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
                      <p className="mt-2 text-xs font-semibold text-foreground">
                        Review Queue is Clear
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        All submitted assistant work has been reviewed.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border bg-background">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5">Series / Chapter</th>
                            <th className="px-3 py-2.5">Task & Version</th>
                            <th className="px-3 py-2.5">Submitted</th>
                            <th className="px-3 py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {mangakaQueue.slice(0, 5).map((submission) => {
                            const task = tasks.find((item) => item.id === submission.taskId);
                            const context = task
                              ? buildTaskContext(task, chapters, seriesList)
                              : undefined;
                            const reviewLabel = task?.title ?? submission.taskId;

                            return (
                              <tr
                                key={submission.id}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                <td className="whitespace-nowrap px-3 py-2.5">
                                  <span
                                    className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SUBMISSION_STATUS_BADGE[submission.status]}`}
                                  >
                                    {SUBMISSION_STATUS_LABEL[submission.status]}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 font-medium">
                                  <div className="font-semibold text-foreground">
                                    {context?.series?.title ?? "Series"}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    Ch.{context?.chapter?.number ?? "?"}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="font-semibold text-foreground">{reviewLabel}</div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {task?.assigneeName ?? submission.assistantId} ·{" "}
                                    {submission.versionLabel}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                                  {formatDateTime(submission.submittedAt)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                  <Link
                                    to="/app/editor/review/$submissionId"
                                    params={{ submissionId: submission.id }}
                                    className="inline-flex items-center gap-1 rounded bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
                                  >
                                    Review <ChevronRight className="size-3" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Chapters In Production Section */}
              {(activeTab === "all" || activeTab === "production") && (
                <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-purple-600 dark:text-purple-400" />
                      <h4 className="text-xs font-bold text-foreground">
                        Active Chapters Register
                      </h4>
                    </div>
                  </div>

                  {productionChapters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-8 text-center bg-muted/20">
                      <Layers className="size-8 text-muted-foreground/60" />
                      <p className="mt-2 text-xs font-semibold text-foreground">
                        No Active Chapters
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Select a series to begin chapter production.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {productionChapters.slice(0, 4).map((chapter) => {
                        const series = seriesList.find((s) => s.id === chapter.seriesId);

                        return (
                          <div
                            key={chapter.id}
                            className="flex flex-col justify-between rounded-lg border border-border bg-background p-3 shadow-xs hover:border-primary/50 transition-all"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span
                                  className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    chapter.status === "TANTOU_REVIEW"
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300"
                                      : chapter.status === "REVISION_REQUIRED"
                                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                                  }`}
                                >
                                  {chapter.status.replace("_", " ")}
                                </span>
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  {chapter.pages?.length ?? 0} Pages
                                </span>
                              </div>
                              <h5 className="mt-2 font-bold text-foreground">
                                Ch.{chapter.number} {chapter.title ? `— ${chapter.title}` : ""}
                              </h5>
                              <p className="text-[11px] text-muted-foreground">
                                {series?.title ?? "Series"}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
                              <span className="text-muted-foreground">Studio Workspace</span>
                              <Link
                                to="/app/series/$slug/$tab"
                                params={{
                                  slug: series?.slug ?? series?.id ?? chapter.seriesId,
                                  tab: "episodes",
                                }}
                                className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                Enter Workspace <ChevronRight className="size-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* My Series Quick Overview */}
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">My Series</h3>
                </div>
                <Link
                  to="/app/series"
                  className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  All Series ({activeSeries.length}) <ChevronRight className="size-3" />
                </Link>
              </div>

              {activeSeries.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No active series found. Approved proposals automatically create series.
                </div>
              ) : (
                <div className="mt-3 divide-y divide-border/60 text-xs">
                  {activeSeries.map((series) => (
                    <div key={series.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="font-bold text-foreground">{series.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Status:{" "}
                          <span className="font-medium text-foreground uppercase">
                            {series.status}
                          </span>{" "}
                          · Cadence: {series.publicationType ?? series.cadence ?? "WEEKLY"}
                        </p>
                      </div>
                      <Link
                        to="/app/series/$slug/$tab"
                        params={{ slug: series.slug ?? series.id, tab: "overview" }}
                        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:bg-muted transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Column (1 Col: Deadlines Radar & Shortcuts) */}
          <div className="space-y-6">
            {/* Upcoming Deadlines Radar */}
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-rose-600 dark:text-rose-400" />
                  <h3 className="text-sm font-bold text-foreground">Deadlines Radar</h3>
                </div>
                {urgentTasks.length > 0 && (
                  <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                    {urgentTasks.length} Urgent
                  </span>
                )}
              </div>

              {upcomingDeadlines.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto size-6 text-emerald-600 dark:text-emerald-400" />
                  <p className="mt-1 font-semibold text-foreground">No Urgent Deadlines</p>
                  <p className="text-[11px]">All studio tasks are up to date.</p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-border/60 text-xs">
                  {upcomingDeadlines.slice(0, 6).map((task) => {
                    const context = buildTaskContext(task, chapters, seriesList);
                    const risk = deadlineRisk(task.dueAt);

                    return (
                      <div key={task.id} className="flex items-center justify-between py-2.5">
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-semibold text-foreground">{task.title}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {context.series?.title} · Ch.{context.chapter?.number}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                            risk.tone === "rose"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                              : risk.tone === "amber"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {formatDate(task.dueAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Proposal Pipeline */}
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <FileEdit className="size-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-foreground">Proposal Pipeline</h3>
                </div>
                <Link
                  to="/app/proposals/new"
                  className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Draft <Plus className="size-3" />
                </Link>
              </div>

              {proposals.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No active proposals in review.
                </div>
              ) : (
                <div className="mt-3 space-y-2.5 text-xs">
                  {proposals.slice(0, 4).map((proposal) => (
                    <div
                      key={proposal.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-2.5"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate font-semibold text-foreground">{proposal.title}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {proposal.genres?.join(", ") ?? "Manga"} ·{" "}
                          {proposal.chaptersPlanned ?? 12} Chapters
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          proposal.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : proposal.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                              : proposal.status === "BOARD_REVIEW"
                                ? "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {proposal.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
