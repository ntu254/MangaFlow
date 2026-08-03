import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
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
import {
  DataPagination,
  PageHeader,
  SearchToolbar,
  FilterSelect,
  SortableHeader,
} from "@/shared/ui";
import { SelectItem } from "@/components/ui/select";
import { StatCard } from "@/shared/ui/stat-card";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { Link } from "@tanstack/react-router";
import { AlertOctagon, CheckCircle2, ExternalLink, Eye, Send, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useResolvedFileUrl } from "@/shared/lib/use-resolved-file-url";

const PAGE_SIZE = 10;

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
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const mine = items;

  const count = (s: SubmissionStatus) => mine.filter((m) => m.status === s).length;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return mine
      .filter((m) => status === "ALL" || m.status === status)
      .filter((m) => {
        if (seriesFilter === "ALL") return true;
        const t = tasks.find((t) => t.id === m.taskId);
        if (t?.seriesId === seriesFilter) return true;
        const c = chapters.find((c) => c.id === t?.chapterId);
        return c?.seriesId === seriesFilter;
      })
      .filter((m) => {
        if (!needle) return true;
        const t = tasks.find((tt) => tt.id === m.taskId);
        return (
          (t?.title ?? "").toLowerCase().includes(needle) ||
          m.versionLabel.toLowerCase().includes(needle)
        );
      });
  }, [mine, status, seriesFilter, query, tasks, chapters]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(
    filtered,
    {
      versionLabel: (m) => m.versionLabel,
      status: (m) => m.status,
      submittedAt: (m) => new Date(m.submittedAt),
    },
    { key: "submittedAt", direction: "desc" },
  );

  const selected = selectedId ? mine.find((m) => m.id === selectedId) : undefined;

  useEffect(() => {
    setPage(1);
  }, [status, seriesFilter, query]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [page, sorted.length]);

  const paged = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Workspace"
        title="Submissions"
        description={`${mine.length} submissions.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          tone="sky"
          icon={<Send className="size-4" />}
          label="Submitted"
          value={count("PENDING")}
        />
        <StatCard
          tone="orange"
          icon={<AlertOctagon className="size-4" />}
          label="Revision"
          value={count("REVISION_REQUESTED")}
        />
        <StatCard
          tone="emerald"
          icon={<CheckCircle2 className="size-4" />}
          label="Approved"
          value={count("MANGAKA_APPROVED")}
        />
        <StatCard
          tone="rose"
          icon={<XCircle className="size-4" />}
          label="Rejected"
          value={count("REJECTED")}
        />
      </div>

      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search task or version"
        filters={
          <>
            <FilterSelect
              value={status}
              onValueChange={(value) => setStatus(value as typeof status)}
            >
              <SelectItem value="ALL">All statuses</SelectItem>
              {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SUBMISSION_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </FilterSelect>
            <FilterSelect value={seriesFilter} onValueChange={setSeriesFilter}>
              <SelectItem value="ALL">All series</SelectItem>
              {seriesList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </FilterSelect>
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Submit work from Task Studio to track it here."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-semibold">
                  <SortableHeader
                    label="Version"
                    sortKey="versionLabel"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-3 py-2 text-left font-semibold">Task</th>
                <th className="px-3 py-2 text-left font-semibold">Series</th>
                <th className="px-3 py-2 text-left font-semibold">Ch / Page</th>
                <th className="px-3 py-2 text-left font-semibold">
                  <SortableHeader
                    label="Status"
                    sortKey="status"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-3 py-2 text-left font-semibold">
                  <SortableHeader
                    label="Submitted"
                    sortKey="submittedAt"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-3 py-2 text-left font-semibold">Reviewer</th>
                <th className="px-3 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((m) => {
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
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedId(m.id)}
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted"
                        >
                          <Eye className="size-3" /> View submission
                        </button>
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > 0 ? (
        <DataPagination
          total={sorted.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemName="submissions"
        />
      ) : null}

      <SubmissionDetailModal
        submission={selected}
        getTask={(id) => tasks.find((t) => t.id === id)}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />
    </div>
  );
}

function SubmissionDetailModal({
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
  const { url: submittedFileUrl, loading: fileLoading } = useResolvedFileUrl(
    submission?.fileKey,
    submission?.fileUrl,
  );

  if (!submission) return null;
  const t = getTask(submission.taskId);
  const isImage = isImageFile(submission);
  const isPdf =
    submission.mimeType === "application/pdf" ||
    submission.fileName?.toLowerCase().endsWith(".pdf");
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {submission.versionLabel} · {SUBMISSION_STATUS_LABEL[submission.status]}
          </p>
          <ModalTitle className="text-xl font-bold font-serif">
            {t?.title ?? submission.taskId}
          </ModalTitle>
          <ModalDescription className="sr-only">Submission detail view</ModalDescription>
        </ModalHeader>

        <div className="space-y-3 pt-2 text-xs">
          <section className="overflow-hidden rounded-md border border-border bg-muted/20">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Submitted file
              </p>
              <a
                href={submittedFileUrl || "#"}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!submittedFileUrl || fileLoading}
                className="text-[10px] font-semibold underline-offset-2 hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-40"
              >
                Open submitted file
              </a>
            </div>
            <div className="aspect-[4/3] w-full bg-muted/30">
              {fileLoading ? (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">
                  Loading submitted file…
                </div>
              ) : !submittedFileUrl ? (
                <div className="grid h-full place-items-center px-6 text-center text-xs text-muted-foreground">
                  This submission has no accessible file. The file metadata is still shown below.
                </div>
              ) : isImage ? (
                <img
                  src={submittedFileUrl}
                  alt={submission.fileName ?? submission.versionLabel}
                  className="h-full w-full object-contain"
                />
              ) : isPdf ? (
                <iframe
                  src={submittedFileUrl}
                  title={submission.fileName ?? submission.versionLabel}
                  className="h-full w-full"
                />
              ) : (
                <div className="grid h-full place-items-center px-6 text-center text-xs text-muted-foreground">
                  Preview is not available for this file type. Use “Open submitted file” above.
                </div>
              )}
            </div>
          </section>
          <Row k="File" v={submission.fileName ?? "—"} />
          <Row
            k="Size"
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
      </ModalContent>
    </Modal>
  );
}

function isImageFile(submission: AssistantSubmission) {
  const mimeType = submission.mimeType?.toLowerCase();
  const fileName = submission.fileName?.toLowerCase() ?? "";
  return Boolean(mimeType?.startsWith("image/") || /\.(?:png|jpe?g|webp|gif|bmp)$/.test(fileName));
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
