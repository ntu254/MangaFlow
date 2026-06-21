import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { seriesApi } from "@/shared/api";
import { useImportRanking } from "@/shared/queries/useRankings";
import { series as fallbackSeries } from "@/entities";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalCard,
} from "@/features/board/components/DecisionPortal";

export const Route = createFileRoute("/app/board/reader-votes")({
  component: ReaderVotesPage,
});

function ReaderVotesPage() {
  const { data: remoteSeries = [], isLoading } = useQuery({
    queryKey: ["series"],
    queryFn: seriesApi.list,
  });
  const importRanking = useImportRanking();
  const seriesOptions = useMemo(() => {
    if (remoteSeries.length)
      return remoteSeries.map((item) => ({ id: item.id, title: item.title }));
    return fallbackSeries.map((item) => ({ id: item.id, title: item.title }));
  }, [remoteSeries]);

  const [draft, setDraft] = useState({
    period: "2026-W25",
    seriesId: "",
    voteCount: "0",
    readerScore: "7.5",
  });

  const selectedSeriesId = draft.seriesId || seriesOptions[0]?.id || "";
  const canPersist = isObjectId(selectedSeriesId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const voteCount = Number(draft.voteCount);
    const readerScore = Number(draft.readerScore);
    if (!draft.period.trim()) return toast.error("Period is required.");
    if (!selectedSeriesId) return toast.error("Select a series.");
    if (!Number.isInteger(voteCount) || voteCount < 0)
      return toast.error("Votes must be a non-negative integer.");
    if (readerScore < 1 || readerScore > 10)
      return toast.error("Reader score must be between 1 and 10.");
    if (!canPersist) return toast.error("Mock series ids cannot be saved to the backend.");

    await importRanking.mutateAsync({
      period: draft.period.trim(),
      seriesId: selectedSeriesId,
      voteCount,
      readerScore,
    });
  }

  return (
    <DecisionPortalShell
      active="/app/rankings"
      title="Reader Vote Data"
      description="Select an issue period, enter reader vote data, validate it, and update ranking."
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={4} />

      <PortalCard
        title="Vote data intake"
        description="Validate reader signal before sending it to ranking analytics."
      >
        <form onSubmit={submit} className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Issue / period">
              <input
                value={draft.period}
                onChange={(event) => setDraft((prev) => ({ ...prev, period: event.target.value }))}
                className="board-input"
                placeholder="2026-W25"
              />
            </Field>
            <Field label="Series">
              <select
                value={selectedSeriesId}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, seriesId: event.target.value }))
                }
                className="board-input"
              >
                {seriesOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reader votes">
              <input
                type="number"
                min={0}
                value={draft.voteCount}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, voteCount: event.target.value }))
                }
                className="board-input"
              />
            </Field>
            <Field label="Reader score">
              <input
                type="number"
                min={1}
                max={10}
                step={0.1}
                value={draft.readerScore}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, readerScore: event.target.value }))
                }
                className="board-input"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading series...
                </span>
              ) : canPersist ? (
                "Validation ready. This entry can be saved to ranking API."
              ) : (
                "Using mock series ids. Connect backend series data before saving."
              )}
            </div>
            <button
              type="submit"
              disabled={importRanking.isPending}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save vote data
            </button>
          </div>
        </form>
      </PortalCard>

      <PortalCard
        title="Validation rules"
        description="Data must match the ranking period contract."
      >
        <div className="grid gap-2 p-4 text-sm text-muted-foreground sm:grid-cols-3">
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Votes must be a whole number.
          </span>
          <span>Reader score range is 1 to 10.</span>
          <span>Period must match the issue window used by rankings.</span>
        </div>
      </PortalCard>

      <style>{`
        .board-input {
          height: 38px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid color-mix(in oklab, var(--foreground) 14%, transparent);
          background: color-mix(in oklab, var(--card) 92%, var(--foreground) 4%);
          padding: 0 11px;
          font-size: 13px;
          outline: none;
        }
        .board-input:focus {
          border-color: color-mix(in oklab, var(--primary) 48%, transparent);
        }
      `}</style>
    </DecisionPortalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function isObjectId(value: string) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}
