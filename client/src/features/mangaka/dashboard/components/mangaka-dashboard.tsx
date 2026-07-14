import {
  buildTaskContext,
  deadlineRisk,
  getTaskEdgeSummary,
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
import { useAuth } from "@/shared/auth";
import { PageHeader, PageSection, PageShell, TableSkeleton } from "@/shared/layout/page-layout";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatCard } from "@/shared/ui/stat-card";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, BookOpen, Layers, Users, ClipboardList } from "lucide-react";
import { useMemo } from "react";

export function MangakaDashboard() {
  const user = useAuth((s) => s.user);

  const { data: seriesList = [], isLoading: seriesLoading } = useMySeriesQuery();
  const seriesIds = useMemo(() => seriesList.map((series) => series.id), [seriesList]);

  const { data: chapters = [], isLoading: chaptersLoading } = useMyChaptersQuery();

  const { data: tasks = [], isLoading: tasksLoading } = useStudioTasksQuery({});
  const { data: mangakaQueue = [], isLoading: queueLoading } = useMangakaReviewQueueQuery();

  const isLoading = seriesLoading || chaptersLoading || tasksLoading || queueLoading;

  const activeSeriesCount = seriesList.filter((s) => s.status !== "COMPLETED").length;

  const inProgressTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === "IN_PROGRESS" || t.status === "TODO")
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [tasks]);

  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((t) => {
        const visualStatus = getVisualTaskStatus(t);
        return visualStatus !== "EDITOR_APPROVED" && visualStatus !== "CANCELLED";
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 7);
  }, [tasks]);

  if (!user) return null;

  if (isLoading) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Mangaka workspace"
          title={`Today, ${user.name.split(" ")[0]}`}
          description="Loading data..."
        />
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <PageSection title="Review Queue">
            <TableSkeleton rows={3} columns={1} />
          </PageSection>
          <PageSection title="Production Status">
            <TableSkeleton rows={3} columns={1} />
          </PageSection>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Mangaka workspace"
        title={`Today, ${user.name.split(" ")[0]}`}
        description={`${mangakaQueue.length} submissions need review, ${inProgressTasks.length} tasks in progress.`}
        actions={
          <Link
            to="/app/dashboard"
            aria-label="Open Review Queue"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
          >
            Review Queue <ArrowRight className="size-3.5" />
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4 sm:grid-cols-2">
        <StatCard
          tone="neutral"
          icon={<BookOpen className="size-4" />}
          label="Series being drawn"
          value={String(activeSeriesCount)}
        />
        <StatCard
          tone="blue"
          icon={<Layers className="size-4" />}
          label="Chapters in production"
          value={String(
            chapters.filter((c) =>
              [
                "DRAFTING",
                "ASSISTANT_WORKING",
                "MANGAKA_REVIEW",
                "EDITOR_REVIEW",
                "REVISION",
              ].includes(c.status),
            ).length,
          )}
        />
        <StatCard
          tone="emerald"
          icon={<Users className="size-4" />}
          label="Tasks in progress"
          value={String(inProgressTasks.length)}
        />
        <StatCard
          tone="amber"
          icon={<ClipboardList className="size-4" />}
          label="Needs Review"
          value={String(mangakaQueue.length)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4 flex flex-col min-h-0">
          <PageSection title="Submissions needing review" className="flex-1">
            {mangakaQueue.length === 0 ? (
              <EmptyState
                title="You have reviewed all submissions"
                description="There are no new drawings from Assistants."
              />
            ) : (
              <ul className="space-y-2">
                {mangakaQueue.slice(0, 10).map((sub) => {
                  const task = tasks.find((t) => t.id === sub.taskId);
                  const ctx = task ? buildTaskContext(task, chapters, seriesList) : undefined;
                  return (
                    <li
                      key={sub.id}
                      className="flex items-center gap-3 rounded border border-amber-200 bg-amber-50 p-2.5 text-xs"
                    >
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SUBMISSION_STATUS_BADGE[sub.status]}`}
                      >
                        {SUBMISSION_STATUS_LABEL[sub.status]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-amber-900">
                          {ctx?.series?.title ?? "Series"} Ch.{ctx?.chapter?.number ?? "?"} —{" "}
                          {task?.title ?? sub.taskId}
                        </p>
                        <p className="truncate text-[11px] text-amber-800/80">
                          {sub.assistantId} · {formatDateTime(sub.submittedAt)} · {sub.versionLabel}
                        </p>
                      </div>
                      <Link
                        to="/app/editor/review/$submissionId"
                        params={{ submissionId: sub.id }}
                        aria-label={`Review ${task?.title}`}
                        className="shrink-0 rounded bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-700"
                      >
                        Review
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </PageSection>

          <PageSection title="Production Status (In Progress)" className="flex-1">
            {inProgressTasks.length === 0 ? (
              <EmptyState title="No tasks in progress" />
            ) : (
              <ul className="space-y-2">
                {inProgressTasks.slice(0, 5).map((t) => {
                  const ctx = buildTaskContext(t, chapters, seriesList);
                  const risk = deadlineRisk(t.dueAt);
                  const visualStatus = getVisualTaskStatus(t);
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
                          {ctx.series?.title} · Ch.{ctx.chapter?.number} · {t.assigneeName} ·{" "}
                          {formatDate(t.dueAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </PageSection>
        </div>

        <div className="space-y-4 flex flex-col min-h-0">
          <PageSection title="Upcoming Deadlines" className="flex-1">
            {upcomingDeadlines.length === 0 ? (
              <EmptyState title="No upcoming deadlines" />
            ) : (
              <ul className="divide-y divide-border">
                {upcomingDeadlines.map((t) => {
                  const ctx = buildTaskContext(t, chapters, seriesList);
                  const risk = deadlineRisk(t.dueAt);
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{t.title}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {ctx.series?.title} · Ch.{ctx.chapter?.number}
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
                        {formatDate(t.dueAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </PageSection>
        </div>
      </div>
    </PageShell>
  );
}
