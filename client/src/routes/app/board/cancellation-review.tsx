import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/layouts/AppShell";
import {
  useAtRiskDecisionHistory,
  useCancellationCases,
  useCreateAtRiskDecision,
} from "@/shared/queries/useBoardReview";
import type { AtRiskDecisionValue, CancellationCaseItem } from "@/shared/api/board";
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
  { label: "Hold", value: "WARNING", hint: "Keep at-risk status with warning" },
  { label: "Cancel", value: "CANCEL", hint: "Stop the series" },
  { label: "Finalize", value: "COMPLETE", hint: "Close the review" },
];

function CancellationReviewPage() {
  const { data: items = [], isLoading, error } = useCancellationCases();
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!selectedId && items[0]?.seriesId) setSelectedId(items[0].seriesId);
  }, [items, selectedId]);

  const selected = items.find((item) => item.seriesId === selectedId) ?? items[0];

  return (
    <DecisionPortalShell
      active="/app/board/cancellation-review"
      title="Cancellation review cases"
      description="Review real at-risk and cancellation-requested series, then record the Board decision through the API."
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={5} />

      <section className="grid gap-4 lg:grid-cols-[0.4fr_0.6fr]">
        <PortalCard title="Case queue" description="Live cases from Board review data.">
          {isLoading ? (
            <PortalLoadingRows count={4} />
          ) : error ? (
            <div className="px-4 py-8 text-sm text-destructive">
              Unable to load cancellation review cases.
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No cancellation reviews"
              hint="At-risk or cancellation-requested series will appear here."
              icon={ShieldAlert}
            />
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <button
                  key={item.seriesId}
                  type="button"
                  onClick={() => setSelectedId(item.seriesId)}
                  className={
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-foreground/5 " +
                    (selected?.seriesId === item.seriesId ? "bg-foreground/5" : "")
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.latestRanking
                        ? item.latestRanking.period +
                          " / score " +
                          item.latestRanking.finalScore.toFixed(1)
                        : "No ranking signal"}
                    </span>
                  </span>
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

function DecisionPanel({ item }: { item: CancellationCaseItem }) {
  const [decision, setDecision] = useState<AtRiskDecisionValue>("CONTINUE");
  const [note, setNote] = useState("");
  const mutation = useCreateAtRiskDecision(item.seriesId);
  const { data: history = [] } = useAtRiskDecisionHistory(item.seriesId);

  async function submit() {
    if (!note.trim()) return toast.error("Add a decision note.");
    await mutation.mutateAsync({ decision, note: note.trim() });
    setNote("");
  }

  return (
    <PortalCard
      title={item.title}
      description={item.synopsis || "No synopsis provided."}
      action={<PortalPill tone="warn">{item.status}</PortalPill>}
    >
      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricBox
            label="Reader score"
            value={item.latestRanking ? item.latestRanking.finalScore.toFixed(1) : "None"}
          />
          <MetricBox label="Case status" value={item.latestDecision?.decision || "Open"} />
          <MetricBox label="Selected" value={decision} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {decisionOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDecision(option.value)}
              className={
                "rounded-md border p-3 text-left transition active:translate-y-px " +
                (decision === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-foreground/5")
              }
            >
              <div className="text-sm font-semibold">{option.label}</div>
              <div
                className={
                  "mt-1 text-xs " +
                  (decision === option.value ? "opacity-80" : "text-muted-foreground")
                }
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
          className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary/60"
        />

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            Decisions are recorded to the Board at-risk API.
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

        <div className="rounded-md border border-border bg-background">
          <div className="border-b border-border px-3 py-2 text-sm font-semibold">
            Decision history
          </div>
          <div className="divide-y divide-border">
            {history.length ? (
              history.map((record) => (
                <div key={record.id} className="px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{record.decision}</span>
                    <span className="text-xs text-muted-foreground">
                      {record.createdAt ? new Date(record.createdAt).toLocaleString() : "No date"}
                    </span>
                  </div>
                  {record.note ? (
                    <div className="mt-1 text-xs text-muted-foreground">{record.note}</div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-sm text-muted-foreground">No prior decisions.</div>
            )}
          </div>
        </div>
      </div>
    </PortalCard>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}
