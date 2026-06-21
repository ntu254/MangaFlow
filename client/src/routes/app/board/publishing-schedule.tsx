import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/layouts/AppShell";
import { seriesApi, type PublicationType } from "@/shared/api/series";
import { series as fallbackSeries } from "@/entities";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalCard,
  PortalLoadingRows,
  PortalNotice,
} from "@/features/board/components/DecisionPortal";

export const Route = createFileRoute("/app/board/publishing-schedule")({
  component: PublishingSchedulePage,
});

type ScheduleType = PublicationType | "SPECIAL";

function PublishingSchedulePage() {
  const { data: remoteSeries = [], isLoading } = useQuery({
    queryKey: ["series"],
    queryFn: seriesApi.list,
  });
  const [selected, setSelected] = useState<Record<string, ScheduleType>>({});

  const approvedSeries = useMemo(() => {
    const remote = remoteSeries.filter((item) => ["ONGOING", "COMPLETED"].includes(item.status));
    if (remote.length)
      return remote.map((item) => ({ id: item.id, title: item.title, type: item.publicationType }));
    return fallbackSeries
      .filter((item) => ["ongoing", "completed"].includes(item.status))
      .map((item) => ({
        id: item.id,
        title: item.title,
        type: item.publicationType === "monthly" ? "MONTHLY" : "WEEKLY",
      }));
  }, [remoteSeries]);

  function confirmSchedule(seriesId: string) {
    const type = selected[seriesId];
    if (!type) return toast.error("Choose a release type first.");
    if (type === "SPECIAL") {
      return toast.error("Special release needs backend enum support before saving.");
    }
    toast.success(`Schedule intent confirmed as ${type}`);
  }

  return (
    <DecisionPortalShell
      active="/app/board/publishing-schedule"
      title="Publishing Schedule"
      description="Review approved series and confirm the release cadence requested by Board."
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={3} />

      <PortalNotice>
        Current backend scheduling endpoints are Editor-owned. Board can confirm weekly/monthly
        intent here; special release is shown as a required API extension.
      </PortalNotice>

      <PortalCard
        title="Approved series"
        description="Choose the release cadence that should follow an approved decision."
      >
        <div className="grid grid-cols-[1.4fr_0.8fr_1.1fr_auto] gap-3 border-b border-border bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Approved series</span>
          <span>Current</span>
          <span>Release choice</span>
          <span />
        </div>

        {isLoading ? (
          <PortalLoadingRows count={4} />
        ) : approvedSeries.length === 0 ? (
          <EmptyState
            title="No approved series"
            hint="Series will appear here after Board approval."
            icon={CalendarClock}
          />
        ) : (
          approvedSeries.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1.4fr_0.8fr_1.1fr_auto] items-center gap-3 border-b border-border px-4 py-3 text-[13px] last:border-b-0"
            >
              <span className="font-semibold">{item.title}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {item.type ?? "Unassigned"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(["WEEKLY", "MONTHLY", "SPECIAL"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelected((prev) => ({ ...prev, [item.id]: type }))}
                    className={`h-7 rounded-md px-2.5 text-xs font-medium transition active:translate-y-px ${
                      selected[item.id] === type
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-foreground/5"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => confirmSchedule(item.id)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-foreground/5"
              >
                Confirm
              </button>
            </div>
          ))
        )}
      </PortalCard>
    </DecisionPortalShell>
  );
}
