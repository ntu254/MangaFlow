import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/layouts/AppShell";
import { seriesApi } from "@/shared/api";
import { useCreateAtRiskDecision } from "@/shared/queries/useBoardReview";
import { series as fallbackSeries } from "@/entities";
import type { AtRiskDecisionValue } from "@/shared/api/board";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalCard,
  PortalLoadingRows,
  PortalPill,
} from "@/features/board/components/DecisionPortal";

export const Route = createFileRoute("/app/board/cancellation-review")({
  component: CancellationReviewPage,
});

const decisionOptions: Array<{ label: string; value: AtRiskDecisionValue; hint: string }> = [
  { label: "Continue", value: "CONTINUE", hint: "Keep production running" },
  { label: "Hold", value: "WARNING", hint: "Backend maps hold to warning" },
  { label: "Cancel", value: "CANCEL", hint: "Stop the series" },
  { label: "Finalize", value: "COMPLETE", hint: "Close the review" },
];

function CancellationReviewPage() {
  const { data: remoteSeries = [], isLoading } = useQuery({
    queryKey: ["series"],
    queryFn: seriesApi.list,
  });
  const items = useMemo(() => {
    const remote = remoteSeries.filter((item) => item.status === "AT_RISK");
    if (remote.length) {
      return remote.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        synopsis: item.synopsis,
        canPersist: isObjectId(item.id),
      }));
    }
    return fallbackSeries
      .filter((item) => item.status === "at-risk")
      .map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        synopsis: item.synopsis,
        canPersist: false,
      }));
  }, [remoteSeries]);

  const [selectedId, setSelectedId] = useState("");
  const selected = items.find((item) => item.id === (selectedId || items[0]?.id));

  return (
    <DecisionPortalShell
      active="/app/board/cancellation-review"
      title="Cancellation review cases"
      description="Open low-ranking series, review performance evidence, choose continue, hold, cancel, or finalize, then save the Board decision."
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={5} />

      <section className="grid gap-4 lg:grid-cols-[0.42fr_0.58fr]">
        <PortalCard
          title="Case queue"
          description="Series marked at risk by ranking or production review."
        >
          {isLoading ? (
            <PortalLoadingRows count={4} />
          ) : items.length === 0 ? (
            <EmptyState
              title="No cancellation reviews"
              hint="At-risk series will appear here."
              icon={ShieldAlert}
            />
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-foreground/5 ${
                    selected?.id === item.id ? "bg-foreground/5" : ""
                  }`}
                >
                  <span className="font-medium">{item.title}</span>
                  <PortalPill tone="warn">
                    <AlertTriangle className="h-3.5 w-3.5" /> risk
                  </PortalPill>
                </button>
              ))}
            </div>
          )}
        </PortalCard>

        {selected ? <DecisionPanel item={selected} /> : null}
      </section>
    </DecisionPortalShell>
  );
}

function DecisionPanel({
  item,
}: {
  item: { id: string; title: string; status: string; synopsis?: string; canPersist: boolean };
}) {
  const [decision, setDecision] = useState<AtRiskDecisionValue>("CONTINUE");
  const [note, setNote] = useState("");
  const mutation = useCreateAtRiskDecision(item.id);

  async function submit() {
    if (!note.trim()) return toast.error("Add a decision note.");
    if (!item.canPersist) return toast.error("Mock series ids cannot save Board decisions.");
    await mutation.mutateAsync({ decision, note: note.trim() });
    setNote("");
  }

  return (
    <PortalCard
      title={item.title}
      description={item.synopsis || "No synopsis provided."}
      action={<PortalPill tone="warn">{item.status}</PortalPill>}
    >
      <div className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-background p-3">
            <div className="text-[11px] text-muted-foreground">Reader signal</div>
            <div className="mt-1 font-mono text-lg font-semibold">Low</div>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <div className="text-[11px] text-muted-foreground">Case status</div>
            <div className="mt-1 font-mono text-lg font-semibold">Open</div>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <div className="text-[11px] text-muted-foreground">Decision</div>
            <div className="mt-1 font-mono text-lg font-semibold">{decision}</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {decisionOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDecision(option.value)}
              className={`rounded-md border p-3 text-left transition active:translate-y-px ${
                decision === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-foreground/5"
              }`}
            >
              <div className="text-sm font-semibold">{option.label}</div>
              <div
                className={`mt-1 text-xs ${decision === option.value ? "opacity-80" : "text-muted-foreground"}`}
              >
                {option.hint}
              </div>
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="Performance evidence, ranking movement, and final recommendation..."
          className="mt-4 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary/60"
        />

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            {item.canPersist
              ? "Ready to save to Board decision API."
              : "Waiting for backend series id."}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={mutation.isPending}
            className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Finalize decision
          </button>
        </div>
      </div>
    </PortalCard>
  );
}

function isObjectId(value: string) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}
