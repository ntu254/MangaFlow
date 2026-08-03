import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import type {
  Chapter,
  ChapterCadence,
  ProductionSeries,
  SeriesPublicationType,
} from "@/entities/series/model/series-types";
import { useChapterActionMutation } from "@/entities/series";
import { formatDate, isOverdue } from "@/shared/lib/format-date";
import { ReviewStatusPill } from "@/entities/submission";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataPagination, SortableHeader } from "@/shared/ui";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { ApiRequestError } from "@/shared/api/client";
import { ChapterPublicationDetailSheet } from "./chapter-publication-detail-sheet";

const PAGE_SIZE = 10;

const CADENCE_INTERVAL_LABEL: Record<ChapterCadence, string> = {
  weekly: "+1 week",
  monthly: "+1 month",
};

const TODAY = toDateTimeInputValue(new Date().toISOString());

function publicationErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === "PUBLICATION_NOT_DUE") {
      return "This chapter is scheduled for later. Publish becomes available at the scheduled time.";
    }
    if (error.code === "PUBLICATION_NOT_SCHEDULED") {
      return "Schedule this chapter before publishing.";
    }
    if (error.code === "INVALID_TRANSITION") {
      return "The chapter is no longer ready for publication. Refresh the list and review its status.";
    }
    if (error.requestId) return `${error.message} Reference: ${error.requestId}`;
  }
  return error instanceof Error ? error.message : "Operation failed.";
}

function toDateTimeInputValue(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromScheduleInputValue(value: string): string {
  return new Date(value).toISOString();
}

function nextSuggestedSchedule(publicationType?: SeriesPublicationType) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
  date.setDate(date.getDate() + (publicationType === "WEEKLY" ? 7 : 30));
  return toDateTimeInputValue(date.toISOString());
}

function SchedulePopover({
  chapterId,
  seriesId,
  current,
  suggested,
  label,
}: {
  chapterId: string;
  seriesId: string;
  current?: string;
  suggested: string;
  label: string;
}) {
  const action = useChapterActionMutation(chapterId, seriesId);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => toDateTimeInputValue(current) || suggested || TODAY);

  const submit = () => {
    if (!value) return;
    action.mutate(
      { action: "SCHEDULE", payload: { scheduledAt: fromScheduleInputValue(value) } },
      {
        onSuccess: () => {
          toast.success("Publication scheduled.");
          setOpen(false);
        },
        onError: (error) => toast.error(publicationErrorMessage(error)),
      },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted"
        >
          <CalendarClock className="size-3" /> {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 space-y-2 p-3">
        <p className="text-[11px] font-semibold text-foreground">Select publication date</p>
        <input
          type="datetime-local"
          min={TODAY}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
        />
        <button
          type="button"
          disabled={!value || action.isPending}
          onClick={submit}
          className="w-full rounded bg-foreground px-2 py-1.5 text-[11px] font-semibold text-background hover:opacity-90 disabled:opacity-40"
        >
          {action.isPending ? "Saving..." : "Confirm"}
        </button>
      </PopoverContent>
    </Popover>
  );
}

function PublicationActions({
  chapter,
  cadence,
  publicationType,
}: {
  chapter: Chapter;
  cadence: ChapterCadence;
  publicationType?: SeriesPublicationType;
}) {
  const action = useChapterActionMutation(chapter.id, chapter.seriesId);
  const suggested = nextSuggestedSchedule(publicationType);

  const run = (act: "POSTPONE" | "PUBLISH" | "PUBLISH_EARLY", successMsg: string) =>
    action.mutate(
      { action: act },
      {
        onSuccess: () => toast.success(successMsg),
        onError: (error) => toast.error(publicationErrorMessage(error)),
      },
    );

  if (chapter.status === "PUBLISHED") {
    return <span className="text-[10px] font-semibold text-emerald-700">Published</span>;
  }

  if (chapter.publication?.status === "SCHEDULED") {
    const scheduledAt = chapter.publication.scheduledAt ?? chapter.scheduledAt;
    const overdue = isOverdue(scheduledAt);
    const scheduledTime = scheduledAt ? new Date(scheduledAt).getTime() : Number.NaN;
    const isDue = Number.isFinite(scheduledTime) && scheduledTime <= Date.now();
    return (
      <div className="inline-flex items-center justify-end gap-1.5">
        {overdue ? (
          <button
            type="button"
            disabled={action.isPending}
            onClick={() => run("POSTPONE", "Publication schedule postponed.")}
            className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-40"
          >
            Postpone ({CADENCE_INTERVAL_LABEL[cadence]})
          </button>
        ) : (
          <SchedulePopover
            chapterId={chapter.id}
            seriesId={chapter.seriesId}
            current={scheduledAt}
            suggested={suggested}
            label="Reschedule"
          />
        )}
        {isDue ? (
          <span className="rounded bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
            Auto-publish due
          </span>
        ) : (
          <>
            <button
              type="button"
              disabled={action.isPending}
              title={scheduledAt ? `Publish before ${formatDate(scheduledAt)}.` : undefined}
              onClick={() => {
                if (
                  window.confirm(
                    "Publish this chapter now? This will release it before the scheduled time.",
                  )
                ) {
                  run("PUBLISH_EARLY", "Chapter published early.");
                }
              }}
              className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-40"
            >
              Publish early
            </button>
          </>
        )}
      </div>
    );
  }

  // Ready-for-publication chapters can be scheduled.
  return (
    <SchedulePopover
      chapterId={chapter.id}
      seriesId={chapter.seriesId}
      current={chapter.publication?.scheduledAt ?? chapter.scheduledAt}
      suggested={suggested}
      label="Schedule"
    />
  );
}

export function PublicationTable({
  rows,
  series,
  emptyText,
}: {
  rows: Chapter[];
  series: ProductionSeries[];
  emptyText: string;
}) {
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailChapter = rows.find((chapter) => chapter.id === detailId);
  const detailSeries = series.find((item) => item.id === detailChapter?.seriesId);
  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(rows, {
    series: (c) => series.find((s) => s.id === c.seriesId)?.title ?? "",
    chapter: (c) => c.number,
    status: (c) => c.status,
    readyAt: (c) => (c.updatedAt ? new Date(c.updatedAt) : undefined),
    schedule: (c) => {
      const scheduledAt = c.publication?.scheduledAt ?? c.scheduledAt;
      return scheduledAt ? new Date(scheduledAt) : undefined;
    },
  });

  useEffect(() => {
    setPage(1);
  }, [rows]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [page, sorted.length]);

  const paged = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">
                <SortableHeader
                  label="Series"
                  sortKey="series"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-3 py-2 text-left">
                <SortableHeader
                  label="Chapter"
                  sortKey="chapter"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-3 py-2 text-left">
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-3 py-2 text-left">
                <SortableHeader
                  label="Ready at"
                  sortKey="readyAt"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-3 py-2 text-left">
                <SortableHeader
                  label="Schedule"
                  sortKey="schedule"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.map((c) => {
              const s = series.find((x) => x.id === c.seriesId);
              const cadence: ChapterCadence = s?.cadence ?? "monthly";
              const publicationType = s?.publicationType;
              const scheduledAt = c.publication?.scheduledAt ?? c.scheduledAt;
              const overdue = c.publication?.status === "SCHEDULED" && isOverdue(scheduledAt);
              return (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-semibold">{s?.title ?? "—"}</td>
                  <td className="px-3 py-2">
                    Ch.{c.number} {c.title}
                  </td>
                  <td className="px-3 py-2">
                    <ReviewStatusPill status={c.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(c.updatedAt)}</td>
                  <td
                    className={`px-3 py-2 ${overdue ? "font-semibold text-rose-600" : "text-muted-foreground"}`}
                  >
                    {scheduledAt ? formatDate(scheduledAt) : "—"}
                    {overdue ? " · overdue" : ""}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailId(c.id)}
                        className="rounded border border-border bg-background px-2 py-1 text-[10px] font-semibold hover:bg-muted"
                      >
                        Details
                      </button>
                      <PublicationActions
                        chapter={c}
                        cadence={cadence}
                        publicationType={publicationType}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <DataPagination
        total={sorted.length}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        itemName="chapters"
      />
      <ChapterPublicationDetailSheet
        chapter={detailChapter}
        series={detailSeries}
        open={!!detailChapter}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </div>
  );
}
