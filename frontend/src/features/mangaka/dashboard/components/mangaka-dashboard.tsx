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
import { useAuth } from "@/shared/auth";
import {
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
import { ArrowRight, BookOpen, ClipboardList, Layers, Users } from "lucide-react";
import { useMemo } from "react";

export function MangakaDashboard() {
  const user = useAuth((s) => s.user);

  const { data: seriesList = [], isLoading: seriesLoading } = useMySeriesQuery();
  const { data: chapters = [], isLoading: chaptersLoading } = useMyChaptersQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useStudioTasksQuery({});
  const { data: mangakaQueue = [], isLoading: queueLoading } = useMangakaReviewQueueQuery();

  const isLoading = seriesLoading || chaptersLoading || tasksLoading || queueLoading;

  const activeSeriesCount = seriesList.filter((series) => series.status !== "ARCHIVED").length;

  const productionChapterCount = useMemo(
    () =>
      chapters.filter(
        (chapter) => !["PLANNED", "PUBLISHED", "ARCHIVED", "SCHEDULED"].includes(chapter.status),
      ).length,
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
        return visualStatus !== "EDITOR_APPROVED" && visualStatus !== "CANCELLED";
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 7);
  }, [tasks]);

  if (!user) return null;

  const firstName = user.name.split(" ")[0];

  if (isLoading) {
    return (
      <PageShell dashboardRole="mangaka">
        <PageHeader
          eyebrow="Mangaka workspace"
          title={`Today, ${firstName}`}
          description="Loading workspace data..."
        />
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <PageSection title="Review queue">
            <TableSkeleton rows={3} columns={1} />
          </PageSection>
          <PageSection title="Production status">
            <TableSkeleton rows={3} columns={1} />
          </PageSection>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell dashboardRole="mangaka">
      <PageHeader
        eyebrow="Mangaka workspace"
        title={`Today, ${firstName}`}
        description={`${mangakaQueue.length} submissions need review, ${inProgressTasks.length} tasks are active.`}
        actions={
          <Link
            to="/app/mangaka/submissions/review"
            aria-label="Open review queue"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
          >
            Review queue <ArrowRight className="size-3.5" />
          </Link>
        }
      />

      <SummaryGrid className="sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="neutral"
          icon={<BookOpen className="size-4" />}
          label="Active series"
          value={String(activeSeriesCount)}
        />
        <StatCard
          tone="neutral"
          icon={<Layers className="size-4" />}
          label="Chapters in production"
          value={String(productionChapterCount)}
        />
        <StatCard
          tone="neutral"
          icon={<Users className="size-4" />}
          label="Active tasks"
          value={String(inProgressTasks.length)}
        />
        <StatCard
          tone="warning"
          icon={<ClipboardList className="size-4" />}
          label="Needs review"
          value={String(mangakaQueue.length)}
        />
      </SummaryGrid>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4 flex flex-col min-h-0">
          <PageSection title="Submissions needing review" className="flex-1">
            {mangakaQueue.length === 0 ? (
              <EmptyState
                title="All submissions are reviewed"
                description="No new Assistant work is waiting for review."
              />
            ) : (
              <ul className="space-y-2">
                {mangakaQueue.slice(0, 10).map((submission) => {
                  const task = tasks.find((item) => item.id === submission.taskId);
                  const context = task ? buildTaskContext(task, chapters, seriesList) : undefined;
                  const reviewLabel = task?.title ?? submission.taskId;

                  return (
                    <li
                      key={submission.id}
                      className="flex items-center gap-3 rounded border border-amber-200 bg-amber-50 p-2.5 text-xs"
                    >
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SUBMISSION_STATUS_BADGE[submission.status]}`}
                      >
                        {SUBMISSION_STATUS_LABEL[submission.status]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-amber-900">
                          {context?.series?.title ?? "Series"} Ch.
                          {context?.chapter?.number ?? "?"} - {reviewLabel}
                        </p>
                        <p className="truncate text-[11px] text-amber-800/80">
                          {submission.assistantId} / {formatDateTime(submission.submittedAt)} /{" "}
                          {submission.versionLabel}
                        </p>
                      </div>
                      <Link
                        to="/app/editor/review/$submissionId"
                        params={{ submissionId: submission.id }}
                        aria-label={`Review ${reviewLabel}`}
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

          <PageSection title="Production status" className="flex-1">
            {inProgressTasks.length === 0 ? (
              <EmptyState title="No active tasks" />
            ) : (
              <ul className="space-y-2">
                {inProgressTasks.slice(0, 5).map((task) => {
                  const context = buildTaskContext(task, chapters, seriesList);
                  const visualStatus = getVisualTaskStatus(task);

                  return (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 rounded border border-border bg-background/60 p-2.5 text-xs"
                    >
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getVisualTaskStatusClass(visualStatus)}`}
                      >
                        {getTaskStatusLabel(visualStatus)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{task.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {context.series?.title} / Ch.{context.chapter?.number} /{" "}
                          {task.assigneeName} / {formatDate(task.dueAt)}
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
          <PageSection title="Upcoming deadlines" className="flex-1">
            {upcomingDeadlines.length === 0 ? (
              <EmptyState title="No upcoming deadlines" />
            ) : (
              <ul className="divide-y divide-border">
                {upcomingDeadlines.map((task) => {
                  const context = buildTaskContext(task, chapters, seriesList);
                  const risk = deadlineRisk(task.dueAt);

                  return (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-2 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{task.title}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {context.series?.title} / Ch.{context.chapter?.number}
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
                        {formatDate(task.dueAt)}
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
