import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { StudioTask } from "@/entities/series/model/studio-types";
import {
  SUBMISSION_STATUS_BADGE,
  SUBMISSION_STATUS_LABEL,
  type AssistantSubmission,
  type SubmissionStatus,
} from "@/entities/submission/model/assistant-types";
import { buildTaskContext } from "@/entities/task";
import {
  useChaptersForSeriesQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
  useSubmissionsQuery,
} from "../../api/assistant-queries";
import { useAuth } from "@/shared/auth";
import { formatDateTime } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui";
import { StatCard } from "@/shared/ui/stat-card";
import { Link } from "@tanstack/react-router";
import { AlertOctagon, CheckCircle2, ExternalLink, Send, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

export function SubmissionsPage() {
  const user = useAuth((s) => s.user);
  const { data: seriesList = [] } = useMySeriesQuery();
  const seriesIds = useMemo(() => seriesList.map((series) => series.id), [seriesList]);
  const { data: chapters = [] } = useChaptersForSeriesQuery(seriesIds);
  const { data: tasks = [] } = useStudioTasksQuery({
    assigneeId: user?.id ?? "",
  });
  const { data: items = [] } = useSubmissionsQuery({ assistantId: user?.id ?? "" });
  const [status, setStatus] = useState<"ALL" | SubmissionStatus>("ALL");
  const [seriesFilter, setSeriesFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mine = items;

  const count = (s: SubmissionStatus) => mine.filter((m) => m.status === s).length;

  const filtered = useMemo(() => {
    return mine
      .filter((m) => status === "ALL" || m.status === status)
      .filter((m) => {
        if (seriesFilter === "ALL") return true;
        const t = tasks.find((t) => t.id === m.taskId);
        if (t?.seriesId === seriesFilter) return true;
        const c = chapters.find((c) => c.id === t?.chapterId);
        return c?.seriesId === seriesFilter;
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [mine, status, seriesFilter, tasks, chapters]);

  const selected = selectedId ? mine.find((m) => m.id === selectedId) : undefined;

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Workspace"
        title="Submissions"
        description={`${mine.length} submission của bạn.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          tone="sky"
          icon={<Send className="size-4" />}
          label="Submitted"
          value={count("SUBMITTED")}
        />
        <StatCard
          tone="orange"
          icon={<AlertOctagon className="size-4" />}
          label="Revision"
          value={count("MANGAKA_REVISION_REQUESTED") + count("EDITOR_REVISION_REQUESTED")}
        />
        <StatCard
          tone="emerald"
          icon={<CheckCircle2 className="size-4" />}
          label="Approved"
          value={count("APPROVED")}
        />
        <StatCard
          tone="rose"
          icon={<XCircle className="size-4" />}
          label="Rejected"
          value={count("REJECTED")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
        >
          <option value="ALL">Tất cả status</option>
          {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) => (
            <option key={s} value={s}>
              {SUBMISSION_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={seriesFilter}
          onChange={(e) => setSeriesFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
        >
          <option value="ALL">Tất cả series</option>
          {seriesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Bạn chưa nộp submission nào"
          description="Submit work từ Task Studio để theo dõi tại đây."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-semibold">Version</th>
                <th className="px-3 py-2 text-left font-semibold">Task</th>
                <th className="px-3 py-2 text-left font-semibold">Series</th>
                <th className="px-3 py-2 text-left font-semibold">Ch / Page</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Submitted</th>
                <th className="px-3 py-2 text-left font-semibold">Reviewer</th>
                <th className="px-3 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const t = tasks.find((tt) => tt.id === m.taskId);
                const ctx = t ? buildTaskContext(t, chapters, seriesList) : undefined;
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2.5 font-semibold">{m.versionLabel}</td>
                    <td className="px-3 py-2.5">{t?.title ?? "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {ctx?.series?.title ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      Ch.{ctx?.chapter?.number ?? "—"} / P.
                      {String(ctx?.pageIndex ?? 0).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SUBMISSION_STATUS_BADGE[m.status]}`}
                      >
                        {SUBMISSION_STATUS_LABEL[m.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatDateTime(m.submittedAt)}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{m.reviewedByName ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      {t ? (
                        <Link
                          to="/app/assistant/tasks/$taskId/studio"
                          params={{ taskId: t.id }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background hover:opacity-90"
                        >
                          Studio
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SubmissionDetailDrawer
        submission={selected}
        getTask={(id) => tasks.find((t) => t.id === id)}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />
    </div>
  );
}

function SubmissionDetailDrawer({
  submission,
  getTask,
  open,
  onOpenChange,
}: {
  submission?: AssistantSubmission;
  getTask: (id: string) => StudioTask | undefined;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!submission) return null;
  const t = getTask(submission.taskId);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto p-0 sm:max-w-md">
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {submission.versionLabel} · {SUBMISSION_STATUS_LABEL[submission.status]}
            </p>
            <p className="mt-1 font-serif text-xl">{t?.title ?? submission.taskId}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 p-4 text-xs">
          <Row k="File" v={submission.fileName ?? "—"} />
          <Row
            k="Kích thước"
            v={submission.fileSizeKB ? `${submission.fileSizeKB.toLocaleString()} KB` : "—"}
          />
          <Row k="Submitted" v={formatDateTime(submission.submittedAt)} />
          <Row k="Reviewer" v={submission.reviewedByName ?? "—"} />
          {submission.note ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Note
              </p>
              <p className="mt-1 whitespace-pre-line">{submission.note}</p>
            </div>
          ) : null}
          {submission.feedback ? (
            <div className="rounded border border-orange-200 bg-orange-50 p-2 text-orange-900">
              <p className="text-[10px] font-bold uppercase tracking-widest">Feedback</p>
              <p className="mt-1">{submission.feedback}</p>
            </div>
          ) : null}
          {t ? (
            <Link
              to="/app/assistant/tasks/$taskId/studio"
              params={{ taskId: t.id }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90"
            >
              <ExternalLink className="size-3.5" /> View Task Studio
            </Link>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {k}
      </span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}
