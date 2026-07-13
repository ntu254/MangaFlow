import { useState } from "react";
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

const CADENCE_INTERVAL_LABEL: Record<ChapterCadence, string> = {
  weekly: "+1 week",
  biweekly: "+2 weeks",
  monthly: "+1 month",
};

const TODAY = toDateTimeInputValue(new Date().toISOString());

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
        onError: () => toast.error("Could not schedule publication."),
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

  const run = (act: "POSTPONE" | "PUBLISH", successMsg: string) =>
    action.mutate(
      { action: act },
      {
        onSuccess: () => toast.success(successMsg),
        onError: () => toast.error("Action failed."),
      },
    );

  if (chapter.status === "PUBLISHED") {
    return <span className="text-[10px] font-semibold text-emerald-700">Published</span>;
  }

  const publishBtn = (
    <button
      type="button"
      disabled={action.isPending}
      onClick={() => run("PUBLISH", "Chapter published.")}
      className="rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background hover:opacity-90 disabled:opacity-40"
    >
      Publish
    </button>
  );

  if (chapter.publication?.status === "SCHEDULED") {
    const scheduledAt = chapter.publication.scheduledAt ?? chapter.scheduledAt;
    const overdue = isOverdue(scheduledAt);
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
        {publishBtn}
      </div>
    );
  }

  // EDITOR_APPROVED / READY_FOR_PUBLICATION → schedule a publish date
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
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Series</th>
            <th className="px-3 py-2 text-left">Chapter</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Ready at</th>
            <th className="px-3 py-2 text-left">Schedule</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((c) => {
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
                <td className="px-3 py-2 text-right">
                  <PublicationActions
                    chapter={c}
                    cadence={cadence}
                    publicationType={publicationType}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
