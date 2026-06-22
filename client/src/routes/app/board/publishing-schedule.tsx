import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/layouts/AppShell";
import type { BoardPublishingScheduleItem } from "@/shared/api/board";
import type { PublicationType } from "@/shared/api/series";
import {
  useBoardPublishingSchedule,
  useSaveBoardPublishingSchedule,
} from "@/shared/queries/useBoardReview";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalCard,
  PortalLoadingRows,
  PortalPill,
} from "@/features/board/components/DecisionPortal";

export const Route = createFileRoute("/app/board/publishing-schedule")({
  component: PublishingSchedulePage,
});

function PublishingSchedulePage() {
  const { data: items = [], isLoading, error } = useBoardPublishingSchedule();
  const scheduledCount = items.filter((item) => item.publishAt).length;

  return (
    <DecisionPortalShell
      active="/app/board/publishing-schedule"
      title="Publishing Schedule"
      description="Set the real publish time and cadence for Board-approved series."
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={3} />

      <section className="grid gap-3 md:grid-cols-3">
        <ScheduleMetric label="Approved series" value={items.length} />
        <ScheduleMetric label="Scheduled" value={scheduledCount} />
        <ScheduleMetric label="Unscheduled" value={Math.max(0, items.length - scheduledCount)} />
      </section>

      <PortalCard
        title="Approved series schedule"
        description="Choose weekly or monthly cadence and save an exact publish datetime."
      >
        <div className="grid grid-cols-[1.25fr_0.7fr_1fr_1.2fr_1fr_auto] gap-3 border-b border-border bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Series</span>
          <span>Status</span>
          <span>Cadence</span>
          <span>Publish time</span>
          <span>Note</span>
          <span />
        </div>

        {isLoading ? (
          <PortalLoadingRows count={4} />
        ) : error ? (
          <div className="px-4 py-8 text-sm text-destructive">
            Unable to load Board publishing schedule.
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No approved series"
            hint="Approved series will appear here after Board finalization."
            icon={CalendarClock}
          />
        ) : (
          items.map((item) => <ScheduleRow key={item.seriesId} item={item} />)
        )}
      </PortalCard>
    </DecisionPortalShell>
  );
}

function ScheduleMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold">{value}</div>
    </div>
  );
}

function ScheduleRow({ item }: { item: BoardPublishingScheduleItem }) {
  const initialPublishAt = useMemo(() => toDatetimeLocal(item.publishAt), [item.publishAt]);
  const [publicationType, setPublicationType] = useState<PublicationType>(
    item.publicationType === "MONTHLY" ? "MONTHLY" : "WEEKLY",
  );
  const [publishAt, setPublishAt] = useState(initialPublishAt);
  const [note, setNote] = useState(item.note ?? "");
  const mutation = useSaveBoardPublishingSchedule(item.seriesId);

  async function save() {
    if (!publishAt) return toast.error("Choose a publish datetime.");
    const iso = new Date(publishAt).toISOString();
    await mutation.mutateAsync({
      publicationType,
      publishAt: iso,
      note: note.trim() || undefined,
    });
  }

  return (
    <div className="grid grid-cols-[1.25fr_0.7fr_1fr_1.2fr_1fr_auto] items-center gap-3 border-b border-border px-4 py-3 text-[13px] last:border-b-0">
      <div className="min-w-0">
        <div className="truncate font-semibold">{item.title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {item.publishAt
            ? "Scheduled " + new Date(item.publishAt).toLocaleString()
            : "No publish time set"}
        </div>
      </div>
      <PortalPill tone="success">{item.status}</PortalPill>
      <select
        value={publicationType}
        onChange={(event) => setPublicationType(event.target.value as PublicationType)}
        className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary/60"
      >
        <option value="WEEKLY">WEEKLY</option>
        <option value="MONTHLY">MONTHLY</option>
      </select>
      <input
        type="datetime-local"
        value={publishAt}
        onChange={(event) => setPublishAt(event.target.value)}
        className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary/60"
      />
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional note"
        className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary/60"
      />
      <button
        type="button"
        onClick={save}
        disabled={mutation.isPending}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
      >
        <Save className="h-3.5 w-3.5" /> Save
      </button>
    </div>
  );
}

function toDatetimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
