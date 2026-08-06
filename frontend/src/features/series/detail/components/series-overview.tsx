import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Pencil,
  Share2,
  MoreHorizontal,
  Upload,
  ListPlus,
  PencilRuler,
  ClipboardCheck,
  Send,
  Trash2,
  FileText,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowRight,
  MessageSquare,
  Clock,
  Rocket,
  Plus,
} from "lucide-react";
import { useAuth } from "@/shared/auth";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ResolvedImage } from "@/shared/ui";
import {
  mapApiError,
  useChapterReadinessQuery,
  useSendChapterToEditorReviewMutation,
  useCommentsQuery,
  useDeleteSeriesMutation,
  useSeriesActivityQuery,
  useSeriesLifecycleMutation,
  useStudioTasksQuery,
  type SeriesActivityEntry,
} from "../../api/series-queries";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioComment, StudioTask } from "@/entities/series/model/studio-types";
import { checkChapterAction } from "../model/chapter-machine";
import { ChapterStatusPill } from "@/entities/chapter";
import { formatDate, formatDateTime, daysFromNow } from "@/shared/lib/format-date";

const TARGET_PAGES = 24;

type ChapterReadiness = {
  chapterId: string;
  chapterStatus: string;
  ready: boolean;
  items: Array<{ key: string; passed: boolean; reason: string }>;
};

type Tab = "overview" | "chapters" | "calendar" | "team";

export function SeriesOverview({
  series,
  chapters,
  setTab,
}: {
  series: ProductionSeries;
  chapters: Chapter[];
  setTab: (t: Tab) => void;
}) {
  const currentChapter = pickCurrentChapter(chapters);
  const { data: tasks = [] } = useStudioTasksQuery({ seriesId: series.id });
  const { data: comments = [] } = useCommentsQuery({ seriesId: series.id });
  const { data: readiness } = useChapterReadinessQuery(currentChapter?.id ?? "") as {
    data?: ChapterReadiness;
  };
  const { data: activity = [] } = useSeriesActivityQuery(series.id);
  const currentChapterTasks = currentChapter
    ? tasks.filter((task) => task.chapterId === currentChapter.id)
    : [];
  const overallPct = Math.round(
    (chapters.filter((c) => c.status === "PUBLISHED").length / series.targetChapters) * 100,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <CurrentProductionCard
          chapter={currentChapter}
          series={series}
          overallPct={overallPct}
          tasks={currentChapterTasks}
          comments={comments}
        />
        <SeriesProgressCard chapter={currentChapter} overallPct={overallPct} setTab={setTab} />
        <RecentFeedbackCard chapters={chapters} comments={comments} setTab={setTab} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <QuickActionsCard
          chapter={currentChapter}
          series={series}
          readiness={readiness}
          setTab={setTab}
        />
        <ChecklistCard chapter={currentChapter} readiness={readiness} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChaptersMiniList chapters={chapters} setTab={setTab} />
        <TasksMiniList tasks={tasks} setTab={setTab} />
        <ActivityMiniList activity={activity} />
      </div>
    </div>
  );
}

/* ───────────────────── header actions ───────────────────── */

export function SeriesHeaderActions({
  series,
  chapters,
  setTab,
}: {
  series: ProductionSeries;
  chapters: Chapter[];
  setTab: (t: Tab) => void;
}) {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const lifecycle = useSeriesLifecycleMutation(series.id);
  const deleteSeries = useDeleteSeriesMutation(series.id);
  const isPublic = ["ONGOING", "COMPLETED", "PUBLISHED", "PUBLIC"].includes(series.status);
  const hasPublishedChapters = chapters.some((chapter) => chapter.status === "PUBLISHED");
  const isOwner = !!user && user.role === "mangaka" && user.id === series.authorId;
  const isAssignedTantou = !!user && user.role === "editor" && user.id === series.editorId;
  // Active series are only ever cancelled by the Board through an At-risk CANCEL
  // decision; Archive/Unpublish are not available to Mangaka or Tantou.
  const canArchive = false;
  const canUnpublish = false;
  const canDelete =
    !!user && ["PRE_PRODUCTION", "PLANNING"].includes(series.status) && isOwner && !hasPublishedChapters;
  // Production can start only by the owner or the currently assigned Tantou.
  const canStartProduction =
    !!user &&
    ["PRE_PRODUCTION", "PLANNING"].includes(series.status) &&
    (isOwner || isAssignedTantou);
  const busy = lifecycle.isPending || deleteSeries.isPending;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleStartProduction = () => {
    lifecycle.mutate("start_production", {
      onSuccess: () =>
        toast.success("Series is now ONGOING — chapters can be sent to editor review."),
      onError: (err) => toast.error(mapApiError(err)),
    });
  };

  const handleDelete = () => {
    deleteSeries.mutate(undefined, {
      onSuccess: () => {
        toast.success("Series deleted.");
        setDeleteDialogOpen(false);
        navigate({ to: "/app/series" });
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Cannot delete series."),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canStartProduction ? (
        <button
          type="button"
          disabled={busy}
          onClick={handleStartProduction}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-40"
          title="Activate production so chapters can be sent to Editor Review."
        >
          <Rocket className="h-3.5 w-3.5" />{" "}
          {lifecycle.isPending ? "Starting..." : "Start production"}
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setDeleteDialogOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
          aria-label="Delete series"
          title="Delete draft series"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        disabled
        className="hidden h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
        aria-label="More actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTab("chapters")}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition-all hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5" /> New Chapter
      </button>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Series"
        description="This draft series will be soft-deleted. It can be restored by an administrator."
        impactExplanation="The series will be hidden from all views. All data will be preserved and can be recovered."
        confirmLabel="Soft Delete"
        variant="danger"
        onConfirm={handleDelete}
        isLoading={deleteSeries.isPending}
      />
    </div>
  );
}

export function EditTitleButton() {
  return (
    <button
      type="button"
      onClick={() => toast("Rename series will be available when you have permission.")}
      className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
      aria-label="Rename"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}

/* ───────────────────── current production ───────────────────── */

function pickCurrentChapter(chapters: Chapter[]): Chapter | undefined {
  const inflight = chapters
    .filter((c) =>
      [
        "IN_PRODUCTION",
        "TANTOU_REVIEW",
        "REVISION_REQUIRED",
        "READY_FOR_PUBLICATION",
        "SCHEDULED",
      ].includes(c.status),
    )
    .sort((a, b) => a.number - b.number);
  if (inflight.length > 0) return inflight[0];
  return chapters.find((c) => c.status === "PLANNED") ?? chapters[0];
}

function CurrentProductionCard({
  chapter,
  series,
  overallPct,
  tasks,
  comments,
}: {
  chapter?: Chapter;
  series: ProductionSeries;
  overallPct: number;
  tasks: StudioTask[];
  comments: StudioComment[];
}) {
  if (!chapter) {
    return (
      <Card title="Current Production" dot>
        <p className="py-12 text-center text-xs text-muted-foreground">
          No chapters currently in production.
        </p>
      </Card>
    );
  }

  const pageRatio = `${chapter.pages.length} / ${TARGET_PAGES}`;
  const blocking = comments.filter(
    (comment) =>
      comment.chapterId === chapter.id && comment.status !== "RESOLVED" && comment.isBlocking,
  ).length;
  const openTasks = tasks.filter(
    (task) =>
      !["EDITOR_APPROVED", "COMPLETED", "REJECTED", "CANCELLED"].includes(task.status),
  ).length;
  const deadlineIso = chapter.scheduledAt ?? chapter.reviewDueAt ?? chapter.draftDueAt;
  const deadlineDays = daysFromNow(deadlineIso);
  const pct = Math.min(100, Math.round((chapter.pages.length / TARGET_PAGES) * 100));

  return (
    <Card title="Current Production" dot>
      <div className="flex gap-4">
        <ResolvedImage
          fileKey={series.coverFileKey}
          fallbackUrl={series.coverUrl}
          alt=""
          className="h-32 w-24 flex-shrink-0 rounded object-cover ring-1 ring-border"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-serif text-xl leading-tight">
              Chapter {String(chapter.number).padStart(3, "0")}
            </p>
            <ChapterStatusPill status={chapter.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{series.synopsis}</p>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Overall progress</span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <ProgressBar value={pct} tone="dark" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
            <Metric icon={<FileText className="h-3.5 w-3.5" />} label="Pages" value={pageRatio} />
            <Metric
              icon={<ClipboardCheck className="h-3.5 w-3.5" />}
              label="Tasks"
              value={String(tasks.length)}
              sub={blocking ? `${blocking} blocking` : openTasks ? `${openTasks} open` : undefined}
            />
            <Metric
              icon={<CalendarIcon className="h-3.5 w-3.5" />}
              label="Deadline"
              value={
                deadlineDays == null
                  ? "—"
                  : deadlineDays < 0
                    ? `Overdue ${-deadlineDays}d`
                    : deadlineDays === 0
                      ? "Today"
                      : `${deadlineDays} days left`
              }
              sub={deadlineIso ? formatDate(deadlineIso) : undefined}
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Overall series: {overallPct}%</p>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background/60 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 font-serif text-sm leading-none">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-amber-600">{sub}</p> : null}
    </div>
  );
}

/* ───────────────────── series progress ───────────────────── */

function SeriesProgressCard({
  chapter,
  overallPct,
  setTab,
}: {
  chapter?: Chapter;
  overallPct: number;
  setTab: (t: Tab) => void;
}) {
  const storyboard = chapter && chapter.status !== "PLANNED" ? 100 : chapter ? 40 : 0;
  const manuscript = chapter
    ? chapter.status === "PLANNED"
      ? 10
      : chapter.status === "IN_PRODUCTION"
        ? 60
        : 100
    : 0;
  const chapterPct = chapter
    ? Math.min(100, Math.round((chapter.pages.length / TARGET_PAGES) * 100))
    : 0;

  return (
    <Card
      title="Series Progress"
      action={
        <button
          onClick={() => setTab("chapters")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
        >
          View details <ArrowRight className="h-3 w-3" />
        </button>
      }
    >
      <div className="space-y-3">
        <Bar label="Script / Storyboard" value={storyboard} tone="emerald" />
        <Bar label="Manuscript" value={manuscript} tone="emerald" />
        <Bar
          label={chapter ? `Chapter ${String(chapter.number).padStart(3, "0")}` : "Current chapter"}
          value={chapterPct}
          tone="dark"
        />
        <Bar label="Overall" value={overallPct} tone="indigo" />
      </div>
    </Card>
  );
}

function Bar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "dark" | "emerald" | "indigo";
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}

function ProgressBar({ value, tone }: { value: number; tone: "dark" | "emerald" | "indigo" }) {
  const fill =
    tone === "emerald" ? "bg-emerald-500" : tone === "indigo" ? "bg-indigo-500" : "bg-foreground";
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full ${fill}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ───────────────────── recent feedback ───────────────────── */

function RecentFeedbackCard({
  chapters,
  comments,
  setTab,
}: {
  chapters: Chapter[];
  comments: StudioComment[];
  setTab: (t: Tab) => void;
}) {
  const notes = comments
    .map((comment) => {
      const chapter = chapters.find((item) => item.id === comment.chapterId);
      return {
        id: comment.id,
        authorName: comment.authorName,
        text: comment.text,
        createdAt: comment.createdAt,
        status: comment.status,
        isBlocking: comment.isBlocking,
        chapterNumber: chapter?.number,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <Card
      title="Recent Feedback"
      action={
        <button
          onClick={() => setTab("chapters")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      }
    >
      {notes.length === 0 ? (
        <EmptyMini icon={<MessageSquare className="h-4 w-4" />}>No feedback yet.</EmptyMini>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <span className="rounded-full border border-border bg-background px-1.5 py-0.5 font-bold">
                  {n.isBlocking ? "BLOCKING" : n.status}
                </span>
                <span className="font-semibold">{n.authorName}</span>
                <span className="ml-auto text-muted-foreground normal-case tracking-normal">
                  {relativeDay(n.createdAt)}
                </span>
              </div>
              <p className="text-xs text-foreground line-clamp-3">
                Ch.{n.chapterNumber ?? "—"}: {n.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ───────────────────── quick actions ───────────────────── */

function QuickActionsCard({
  chapter,
  series,
  readiness,
  setTab,
}: {
  chapter?: Chapter;
  series: ProductionSeries;
  readiness?: ChapterReadiness;
  setTab: (t: Tab) => void;
}) {
  const user = useAuth((s) => s.user);
  const sendEditorReviewMutation = useSendChapterToEditorReviewMutation(
    chapter?.id ?? "",
    series.id,
  );
  const navigate = useNavigate();

  const submitCheck =
    chapter && user ? checkChapterAction("SUBMIT_REVIEW", user, chapter, series) : { ok: false };
  const submissionKeys = new Set([
    "allPagesUploaded",
    "allTasksApproved",
    "allSubmissionsApproved",
    "allCommentsResolved",
  ]);
  const readinessBlocker = readiness?.items.find(
    (item) => submissionKeys.has(item.key) && !item.passed,
  );
  const canSubmit = submitCheck.ok && !readinessBlocker;

  const actions = [
    {
      icon: <PencilRuler className="h-5 w-5" />,
      label: "Open Studio",
      onClick: () => toast("Studio will open in the next version."),
      disabled: false,
    },
    {
      icon: <ListPlus className="h-5 w-5" />,
      label: "Create Task",
      onClick: () => setTab("chapters"),
      disabled: false,
    },
    {
      icon: <ClipboardCheck className="h-5 w-5" />,
      label: "Review submissions",
      onClick: () => setTab("chapters"),
      disabled: false,
    },
    {
      icon: <Upload className="h-5 w-5" />,
      label: "Upload pages",
      onClick: () => setTab("chapters"),
      disabled: !chapter,
    },
    {
      icon: <Send className="h-5 w-5" />,
      label: "Send to Editor Review",
      onClick: () => {
        if (!chapter || !user) return;
        sendEditorReviewMutation.mutate(undefined, {
          onSuccess: () => toast.success("Chapter sent for Editor Review."),
          onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to submit."),
        });
      },
      disabled: !canSubmit || sendEditorReviewMutation.isPending,
      disabledReason: submitCheck.reason ?? readinessBlocker?.reason,
    },
  ];

  return (
    <Card title="Quick Actions">
      <div className="grid grid-cols-5 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            disabled={a.disabled}
            title={a.disabled ? a.disabledReason : undefined}
            className="group flex flex-col items-center gap-1.5 rounded-md border border-border bg-background p-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="grid h-9 w-9 place-items-center rounded-md bg-muted group-hover:bg-foreground group-hover:text-background">
              {a.icon}
            </span>
            <span className="leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
      {submitCheck.reason && !submitCheck.ok ? (
        <p className="mt-2 text-xs text-muted-foreground">{submitCheck.reason}</p>
      ) : null}
    </Card>
  );
}

/* ───────────────────── checklist ───────────────────── */

function ChecklistCard({
  chapter,
  readiness,
}: {
  chapter?: Chapter;
  readiness?: ChapterReadiness;
}) {
  const liveItems = readiness?.items.map((item) => ({
    label: readinessLabel(item.key),
    ok: item.passed,
    warn: !item.passed,
    reason: item.reason,
  }));
  const items =
    liveItems ??
    (chapter
      ? [
          {
            label: "Canonical readiness checks unavailable",
            ok: false,
            warn: true,
          },
          {
            label: "Editor final review",
            ok: ["READY_FOR_PUBLICATION", "SCHEDULED", "PUBLISHED"].includes(
              chapter.status,
            ),
          },
          {
            label: "Ready for publication",
            ok: ["SCHEDULED", "PUBLISHED"].includes(chapter.status),
          },
          { label: "Publish date set", ok: !!chapter.scheduledAt },
        ]
      : []);

  const done = items.filter((i) => i.ok).length;

  return (
    <Card
      title="Chapter Completion Checklist"
      action={
        <span className="text-[11px] font-semibold text-muted-foreground">
          {done} / {items.length || 0}
        </span>
      }
    >
      {chapter ? (
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {items.map((i) => (
            <li key={i.label} className="flex items-center gap-2 text-xs">
              {i.warn ? (
                <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
              ) : i.ok ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )}
              <span className={i.ok ? "text-foreground" : "text-muted-foreground"}>{i.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyMini icon={<ClipboardCheck className="h-4 w-4" />}>No chapters to check.</EmptyMini>
      )}
    </Card>
  );
}

/* ───────────────────── chapters mini list ───────────────────── */

function readinessLabel(key: string): string {
  const labels: Record<string, string> = {
    allPagesUploaded: "Pages uploaded",
    allTasksApproved: "Tasks approved",
    allSubmissionsApproved: "Submissions approved",
    allCommentsResolved: "Comments resolved",
    editorFinalApprovalExists: "Editor final approval",
    publicationDateExists: "Publication date exists",
  };
  return labels[key] ?? key;
}

function ChaptersMiniList({ chapters, setTab }: { chapters: Chapter[]; setTab: (t: Tab) => void }) {
  const rows = [...chapters].sort((a, b) => b.number - a.number).slice(0, 5);

  return (
    <Card
      title="Chapter List"
      action={
        <button
          onClick={() => setTab("chapters")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      }
    >
      {rows.length === 0 ? (
        <EmptyMini icon={<FileText className="h-4 w-4" />}>No chapters.</EmptyMini>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="pb-2 font-semibold">Chapter</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 font-semibold">Progress</th>
              <th className="pb-2 text-right font-semibold">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const pct =
                c.status === "PUBLISHED"
                  ? 100
                  : Math.min(100, Math.round((c.pages.length / TARGET_PAGES) * 100));
              return (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="py-2 font-semibold">
                    Chapter {String(c.number).padStart(3, "0")}
                  </td>
                  <td className="py-2">
                    <ChapterStatusPill status={c.status} />
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-[10px] tabular-nums text-muted-foreground">
                        {pct}%
                      </span>
                      <div className="h-1 w-full max-w-[80px] overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-right text-[10px] text-muted-foreground">
                    {formatDate(c.publishedAt ?? c.scheduledAt ?? c.draftDueAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ───────────────────── tasks mini list ───────────────────── */

function TasksMiniList({ tasks, setTab }: { tasks: StudioTask[]; setTab: (t: Tab) => void }) {
  const rows = [...tasks]
    .filter((task) => !["EDITOR_APPROVED", "COMPLETED", "REJECTED", "CANCELLED"].includes(task.status))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      label: task.title,
      assignee: task.assigneeName,
      due: task.dueAt,
      status: task.status,
    }));

  return (
    <Card
      title="Pending Tasks"
      action={
        <button
          onClick={() => setTab("chapters")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      }
    >
      {rows.length === 0 ? (
        <EmptyMini icon={<ClipboardCheck className="h-4 w-4" />}>No pending tasks.</EmptyMini>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.assignee}</p>
              </div>
              <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {t.status}
              </span>
              <span className="w-16 text-right text-[10px] text-muted-foreground">
                {formatDate(t.due)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function labelForTask(c: Chapter): string {
  switch (c.status) {
    case "PLANNED":
      return `Start drawing Ch.${c.number}`;
    case "IN_PRODUCTION":
      return `Complete draft Ch.${c.number}`;
    case "TANTOU_REVIEW":
      return `Editor review Ch.${c.number}`;
    case "REVISION_REQUIRED":
      return `Revise Ch.${c.number}`;
    default:
      return `Ch.${c.number} — ${c.title}`;
  }
}

/* ───────────────────── activity mini list ───────────────────── */

function ActivityMiniList({ activity }: { activity: SeriesActivityEntry[] }) {
  const items = activity.slice(0, 5);

  return (
    <Card title="Recent Activity">
      {items.length === 0 ? (
        <EmptyMini icon={<Clock className="h-4 w-4" />}>No activity yet.</EmptyMini>
      ) : (
        <ul className="space-y-2.5">
          {items.map((a) => (
            <li key={a.id} className="flex items-start gap-2">
              <Circle className="mt-1 h-2 w-2 flex-shrink-0 fill-foreground text-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-xs">
                  <span className="font-semibold">{a.actorId}</span>{" "}
                  <span className="text-muted-foreground">
                    {actionPhrase(a.action)}
                    {a.entityType ? ` - ${a.entityType}/${a.entityId}` : ""}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">{formatDateTime(a.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function actionPhrase(action: string): string {
  const map: Record<string, string> = {
    CREATE: "created",
    EDIT: "updated",
    UPLOAD: "uploaded",
    SUBMIT_REVIEW: "submitted review",
    APPROVE: "approved",
    REQUEST_REVISION: "requested revision",
    RESUBMIT: "resubmitted",
    SCHEDULE: "scheduled",
    PUBLISH: "published",
    REASSIGN: "reassigned",
    ADD_MATERIAL: "added material",
    REMOVE_MATERIAL: "removed material",
    ADD_ASSISTANT: "added assistant",
    REMOVE_ASSISTANT: "removed assistant",
  };
  return map[action] ?? action.toLowerCase();
}

/* ───────────────────── shared bits ───────────────────── */

function Card({
  title,
  children,
  action,
  dot,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-foreground">
          {dot ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : null}
          {title}
        </h3>
        {action}
      </header>
      {children}
    </section>
  );
}

function EmptyMini({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 py-6 text-center text-[11px] text-muted-foreground">
      <span className="opacity-60">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function relativeDay(iso: string): string {
  const d = daysFromNow(iso);
  if (d == null) return "";
  if (d === 0) return "today";
  if (d < 0) return `${-d} days ago`;
  return `${d} days from now`;
}

// Re-export Link so consumers can keep tree-shaking happy.
export { Link };
