import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { Progress } from "@/shared/ui/shadcn/progress";
import { FileCheck, CheckCircle2, AlertCircle, Upload, Calendar, Users, Send } from "lucide-react";
import { useSeriesSummary } from "@/shared/queries/useSeries";
import type {
  SeriesMember,
  SeriesStatus,
  SeriesSummaryChapter,
  SeriesSummarySubmission,
} from "@/shared/api/series";

export const Route = createFileRoute("/app/series/$id/overview")({
  component: SeriesOverview,
});

function SeriesOverview() {
  const { id } = Route.useParams();
  const { data: summary, isLoading } = useSeriesSummary(id);

  if (isLoading || !summary) {
    return <div className="p-8 text-center text-foreground/50 text-sm">Loading overview...</div>;
  }

  const chapterSummary = summary.chapterSummary ?? {
    total: 0,
    completed: 0,
    inProduction: 0,
    totalPages: 0,
    approvedPages: 0,
    readinessPercent: 0,
  };
  const taskSummary = summary.taskSummary ?? {
    total: 0,
    pending: 0,
    completed: 0,
    pendingReviews: 0,
  };
  const recentSubmissions = summary.recentSubmissions ?? [];
  const chapters = summary.chapters ?? [];
  const members = summary.members ?? [];
  const series = summary.series;
  const publicationSummary = summary.publicationSummary;
  const rankingSummary = summary.rankingSummary;
  const boardReview = summary.boardReview;

  // Calculate some simple display values based on summary
  const percentReady = chapterSummary.readinessPercent ?? 0;
  const lifecycle = getLifecycle(series?.status, {
    hasPages: chapterSummary.totalPages > 0,
    internalReady: percentReady === 100,
    submitted: Boolean(summary.currentManuscript),
    editorApproved: series?.status === "BOARD_REVIEW" || series?.status === "ONGOING",
    scheduled: (publicationSummary?.scheduled ?? 0) > 0,
    published: (publicationSummary?.published ?? 0) > 0,
    hasRanking: Boolean(rankingSummary),
    hasBoardDecision: Boolean(boardReview),
  });

  // Create a schedule list from chapters' draftSchedule
  const schedule = chapters
    .filter((ch): ch is SeriesSummaryChapter & { draftSchedule: string } =>
      Boolean(ch.draftSchedule),
    )
    .map((ch) => ({
      time: new Date(ch.draftSchedule).toLocaleDateString(),
      event: `Draft due: ${ch.title}`,
    }))
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 pt-6">
      {/* Left/Main Area (8 cols) */}
      <div className="xl:col-span-8 space-y-5">
        {/* Summary Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-foreground/10 bg-card p-4 hover:-translate-y-0.5 hover:shadow-sm transition-all">
            <FileCheck className="h-4 w-4 text-emerald-600 mb-2.5" />
            <div className="text-2xl font-extrabold text-emerald-600">
              {chapterSummary.approvedPages}{" "}
              <span className="text-lg text-emerald-600/50 font-medium">
                / {chapterSummary.totalPages}
              </span>
            </div>
            <div className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-wider mt-1.5">
              Pages approved
            </div>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-card p-4 hover:-translate-y-0.5 hover:shadow-sm transition-all">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mb-2.5" />
            <div className="text-2xl font-extrabold text-emerald-600">
              {taskSummary.completed}{" "}
              <span className="text-lg text-emerald-600/50 font-medium">/ {taskSummary.total}</span>
            </div>
            <div className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-wider mt-1.5">
              Tasks completed
            </div>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-card p-4 hover:-translate-y-0.5 hover:shadow-sm transition-all">
            <AlertCircle className="h-4 w-4 text-amber-600 mb-2.5" />
            <div className="text-2xl font-extrabold text-amber-600">
              {taskSummary.pendingReviews}
            </div>
            <div className="text-[10px] text-amber-600/80 font-bold uppercase tracking-wider mt-1.5">
              Pending review
            </div>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-card p-4 hover:-translate-y-0.5 hover:shadow-sm transition-all">
            <Upload className="h-4 w-4 text-sky-500 mb-2.5" />
            <div className="text-2xl font-extrabold text-sky-500">{percentReady}%</div>
            <div className="text-[10px] text-sky-500/80 font-bold uppercase tracking-wider mt-1.5">
              Ready
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[14px] font-extrabold tracking-tight text-foreground">
                Mangaka Production Flow
              </h2>
              <p className="mt-1 text-[11px] font-medium text-foreground/55">
                Track the chapter from internal completion through Editor, Board, publication, and
                reader response.
              </p>
            </div>
            <Link
              to="/app/series/$id/revisions"
              params={{ id }}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#061A2B] px-3 text-[11px] font-extrabold text-white hover:bg-[#0B2A43] dark:bg-blue-600"
            >
              <Send className="h-3.5 w-3.5" />
              Submit / revise
            </Link>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            {lifecycle.map((step) => (
              <div
                key={step.label}
                className={`rounded-md border px-3 py-2 ${
                  step.state === "done"
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : step.state === "active"
                      ? "border-sky-500/25 bg-sky-500/5"
                      : "border-foreground/10 bg-foreground/[0.02]"
                }`}
              >
                <div
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    step.state === "done"
                      ? "text-emerald-600"
                      : step.state === "active"
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-foreground/40"
                  }`}
                >
                  {step.state === "done" ? "Done" : step.state === "active" ? "Current" : "Next"}
                </div>
                <div className="mt-1 text-[12px] font-bold text-foreground">{step.label}</div>
                <div className="mt-0.5 text-[11px] text-foreground/55">{step.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Chapters */}
        <section className="rounded-xl border border-foreground/10 bg-card overflow-hidden shadow-sm hover:border-foreground/20 transition-all">
          <header className="flex items-center justify-between border-b border-foreground/5 px-5 py-3.5">
            <div>
              <h2 className="text-[14px] font-extrabold text-foreground tracking-tight">
                Recent Chapters
              </h2>
              <div className="text-[11px] font-medium text-foreground/50 mt-0.5">
                Latest updates across the series
              </div>
            </div>
            <Link
              to="/app/series/$id/chapters"
              params={{ id }}
              className="text-[13px] font-bold text-[#061A2B] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all &rarr;
            </Link>
          </header>
          <div className="divide-y divide-foreground/5 relative">
            {chapters.slice(0, 4).map((ch: SeriesSummaryChapter, idx: number) => {
              const chReady =
                ch.pageCount === 0 ? 0 : Math.round((ch.approvedPages / ch.pageCount) * 100);
              const isActive = idx === 0;

              return (
                <Link
                  to="/app/series/$id/chapters"
                  params={{ id }}
                  key={ch.id}
                  className={`flex items-start justify-between gap-3 px-5 py-3 transition-colors cursor-pointer group ${isActive ? "bg-sky-500/[0.04]" : "hover:bg-foreground/5"}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Chapter Number Icon */}
                    <div
                      className={`h-9 w-9 rounded-md flex items-center justify-center font-black text-[13px] shrink-0 ${isActive ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-foreground/70"}`}
                    >
                      {ch.chapterNumber}
                    </div>

                    <div className="flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="text-[13px] font-bold text-foreground">{ch.title}</div>
                        <StatusBadge
                          status={
                            ch.status === "PUBLISHED"
                              ? "published"
                              : ch.status === "DRAFT"
                                ? "draft"
                                : "ongoing"
                          }
                        />
                      </div>
                      <div className="text-[10px] font-semibold text-foreground/50 mt-0.5">
                        Updated {new Date(ch.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end w-36">
                    <div className="text-[12px] font-extrabold text-[#061A2B] dark:text-foreground">
                      {ch.approvedPages} / {ch.pageCount} pages
                    </div>
                    {chReady > 0 && (
                      <div className="flex items-center gap-2 w-full mt-1.5">
                        <Progress
                          value={chReady}
                          className={`h-1 flex-1 bg-foreground/10 ${chReady === 100 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-[#061A2B] dark:[&>div]:bg-blue-400"}`}
                        />
                        <span className="text-[9px] font-extrabold text-foreground/40 w-5 text-right">
                          {chReady}%
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
            {chapters.length === 0 && (
              <div className="p-5 text-center text-sm font-medium text-foreground/50">
                No chapters created yet
              </div>
            )}
          </div>
        </section>

        {/* Review Queue */}
        <section className="rounded-xl border border-foreground/10 bg-card overflow-hidden shadow-sm hover:border-foreground/20 transition-all">
          <header className="flex items-center justify-between border-b border-foreground/5 px-5 py-3.5">
            <h2 className="text-[14px] font-extrabold text-foreground tracking-tight">
              Recent Submissions
            </h2>
            <Link
              to="/app/series/$id/reviews"
              params={{ id }}
              className="text-[13px] font-bold text-[#061A2B] dark:text-blue-400 hover:underline"
            >
              View all &rarr;
            </Link>
          </header>
          <div className="divide-y divide-foreground/5">
            {recentSubmissions.map((r: SeriesSummarySubmission) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 hover:bg-foreground/5 transition cursor-pointer"
              >
                <div className="h-10 w-10 shrink-0 rounded bg-foreground/10 flex items-center justify-center text-[11px] text-foreground/50 font-black border border-foreground/5 relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                      backgroundSize: "3px 3px",
                    }}
                  />
                  <span className="relative z-10">v{r.version}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-foreground truncate">
                    Submission v{r.version}
                  </div>
                  <div className="text-[11px] font-medium text-foreground/60 mt-0.5">
                    {r.submittedBy ? `Submitted by ${r.submittedBy}` : "System"} &middot;{" "}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded w-fit ${
                    r.status === "REJECTED"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  }`}
                >
                  {r.status}
                </div>
              </div>
            ))}
            {recentSubmissions.length === 0 && (
              <div className="p-5 text-center text-sm font-medium text-foreground/50">
                No submissions yet
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Rail (4 cols) */}
      <div className="xl:col-span-4 space-y-5">
        {/* Task & Readiness Stats */}
        <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <h2 className="text-[11px] font-bold text-[#061A2B] dark:text-blue-400 mb-5 uppercase tracking-widest">
            Task & Readiness
          </h2>

          {/* Readiness Score */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <div className="text-[12px] font-bold text-foreground/70">Overall Readiness</div>
              <div className="text-[24px] font-extrabold text-emerald-600 leading-none">
                {percentReady}%
              </div>
            </div>
            <Progress
              value={percentReady}
              className="h-2 bg-foreground/10 [&>div]:bg-emerald-500"
            />
          </div>

          {/* Task Breakdown */}
          <div className="space-y-4">
            <div className="text-[12px] font-bold text-foreground/70 border-b border-foreground/5 pb-2 mb-3">
              Task Breakdown
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1.5">
                <span className="text-emerald-600">Completed</span>
                <span>
                  {taskSummary.completed} / {taskSummary.total}
                </span>
              </div>
              <Progress
                value={taskSummary.total ? (taskSummary.completed / taskSummary.total) * 100 : 0}
                className="h-1.5 bg-foreground/10 [&>div]:bg-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1.5">
                <span className="text-amber-600">Pending Review</span>
                <span>
                  {taskSummary.pendingReviews} / {taskSummary.total}
                </span>
              </div>
              <Progress
                value={
                  taskSummary.total ? (taskSummary.pendingReviews / taskSummary.total) * 100 : 0
                }
                className="h-1.5 bg-foreground/10 [&>div]:bg-amber-500"
              />
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-foreground/80 uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5" /> Schedule
          </div>
          <div className="space-y-4">
            {schedule.map((s, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-16 shrink-0 text-[11px] text-foreground/50 pt-0.5 font-bold uppercase tracking-wider">
                  {s.time}
                </div>
                <div className="text-[13px] text-foreground font-bold leading-tight">{s.event}</div>
              </div>
            ))}
            {schedule.length === 0 && (
              <div className="text-[11px] font-medium text-foreground/50">No schedule items</div>
            )}
          </div>
        </section>

        {/* Team */}
        <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4 text-[11px] font-bold text-foreground/80 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> Team
            </div>
            <Link
              to="/app/series/$id/team"
              params={{ id }}
              className="text-[10px] text-[#061A2B] dark:text-blue-400 hover:underline"
            >
              Manage
            </Link>
          </div>
          <div className="space-y-4">
            {members.map((t: SeriesMember, i: number) => {
              const name = t.user?.name || "Unknown";
              const initials = name.substring(0, 2).toUpperCase();
              return (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="relative shrink-0">
                    <div className="h-8 w-8 rounded-full bg-foreground/10 border border-foreground/5 flex items-center justify-center font-bold text-foreground/60 text-[11px]">
                      {initials}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="text-[13px] font-bold text-foreground truncate">{name}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function getLifecycle(
  status: SeriesStatus | undefined,
  state: {
    hasPages: boolean;
    internalReady: boolean;
    submitted: boolean;
    editorApproved: boolean;
    scheduled: boolean;
    published: boolean;
    hasRanking: boolean;
    hasBoardDecision: boolean;
  },
) {
  const raw = status ?? "DRAFT";
  const submitted = state.submitted || ["EDITOR_REVIEW", "BOARD_REVIEW", "ONGOING"].includes(raw);
  const needsRevision = raw === "REVISION_REQUESTED";
  const editorDone = state.editorApproved || raw === "BOARD_REVIEW" || raw === "ONGOING";
  const steps = [
    {
      label: "Page completion",
      detail: state.hasPages ? "Pages are being prepared." : "Upload chapter pages to start.",
      done: state.hasPages,
      active: !state.hasPages,
    },
    {
      label: "Internal complete",
      detail: state.internalReady
        ? "Ready to send to Tantou Editor."
        : "Resolve page/task blockers.",
      done: state.internalReady,
      active: state.hasPages && !state.internalReady,
    },
    {
      label: needsRevision ? "Revision required" : "Tantou Editor review",
      detail: needsRevision
        ? "Upload a revised version and resubmit."
        : submitted
          ? "Editor is reviewing or has reviewed."
          : "Submit the final internal version.",
      done: editorDone,
      active: state.internalReady && !editorDone,
    },
    {
      label: "Board / Publishing",
      detail: state.published
        ? "Published."
        : state.scheduled
          ? "Publication is scheduled."
          : state.hasBoardDecision
            ? "Board decision is available."
            : "Waiting for downstream decision.",
      done: state.published || state.hasRanking,
      active: editorDone && !state.published,
    },
  ];

  return steps.map((step) => ({
    label: step.label,
    detail: step.detail,
    state: step.done ? "done" : step.active ? "active" : "idle",
  }));
}
