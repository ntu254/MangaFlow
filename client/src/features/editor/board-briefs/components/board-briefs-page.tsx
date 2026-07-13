import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { seriesForEditor } from "../../model/editor-access";
import { useMySeriesQuery, useRankingsListQuery } from "@/entities/series";
import { useCreateAtRiskReportMutation, useLatestAtRiskReportQuery } from "@/features/board";
import { formatDateTime } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader, StateBlock } from "@/shared/ui";

const RECOMMENDATIONS = [
  { value: "CONTINUE", label: "Continue" },
  { value: "RESCHEDULE", label: "Reschedule" },
  { value: "HIATUS", label: "Hiatus" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

type Recommendation = (typeof RECOMMENDATIONS)[number]["value"];

function isAtRiskRanking(row: { atRisk?: boolean; status?: string }) {
  return row.atRisk || row.status === "AT_RISK";
}

export function AtRiskReportsPage() {
  const user = useAuth((s) => s.user);
  const {
    data: series = [],
    isLoading: seriesLoading,
    error: seriesError,
  } = useMySeriesQuery();
  const {
    data: rankings = [],
    isLoading: rankingsLoading,
    error: rankingsError,
  } = useRankingsListQuery();

  const myAtRiskSeries = useMemo(() => {
    if (!user) return [];
    const assigned = seriesForEditor(series, user.id);
    return assigned.filter((item) =>
      rankings.some((ranking) => ranking.seriesId === item.id && isAtRiskRanking(ranking)),
    );
  }, [rankings, series, user]);

  const [seriesId, setSeriesId] = useState("");
  const [rankingSummary, setRankingSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState<Recommendation>("CONTINUE");
  const createReport = useCreateAtRiskReportMutation();
  const latestRanking = rankings.find(
    (ranking) => ranking.seriesId === seriesId && isAtRiskRanking(ranking),
  );
  const {
    data: latestReport,
    isLoading: reportLoading,
    error: reportError,
  } = useLatestAtRiskReportQuery(seriesId);

  useEffect(() => {
    if (!seriesId && myAtRiskSeries[0]?.id) setSeriesId(myAtRiskSeries[0].id);
  }, [myAtRiskSeries, seriesId]);

  useEffect(() => {
    if (!latestRanking) return;
    setRankingSummary(
      `${latestRanking.period}: final ${latestRanking.finalScore}, reader ${latestRanking.readerScore}, votes ${latestRanking.voteCount}, status ${latestRanking.status}`,
    );
  }, [latestRanking, seriesId]);

  if (!user) return null;

  const isLoading = seriesLoading || rankingsLoading;
  const loadError = seriesError ?? rankingsError;

  const onSubmit = async () => {
    if (!seriesId || !rankingSummary.trim()) {
      toast.error("Ranking summary is required.");
      return;
    }
    try {
      await createReport.mutateAsync({
        seriesId,
        body: {
          rankingSummary: rankingSummary.trim(),
          recommendation,
          notes: notes.trim() || undefined,
        },
      });
      toast.success("At-risk report submitted.");
      setNotes("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit report.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        eyebrow="Tantou Editor"
        title="At-risk Reports"
        description="Submit the Tantou report required before the Board can decide an at-risk Series."
      />

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-md border border-border bg-card">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : loadError ? (
        <StateBlock
          tone="danger"
          title="Could not load at-risk series"
          description={loadError instanceof Error ? loadError.message : "Please try again."}
        />
      ) : myAtRiskSeries.length === 0 ? (
        <EmptyState
          title="No assigned at-risk series"
          description="Only series flagged AT_RISK by ranking and assigned to you as Tantou Editor appear here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4 rounded-md border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  At-risk series
                </span>
                <select
                  value={seriesId}
                  onChange={(event) => {
                    setSeriesId(event.target.value);
                    setNotes("");
                  }}
                  className="h-9 w-full rounded border border-border bg-background px-2 text-sm"
                >
                  {myAtRiskSeries.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommendation
                </span>
                <select
                  value={recommendation}
                  onChange={(event) => setRecommendation(event.target.value as Recommendation)}
                  className="h-9 w-full rounded border border-border bg-background px-2 text-sm"
                >
                  {RECOMMENDATIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Field
              label="Ranking summary"
              value={rankingSummary}
              onChange={setRankingSummary}
              multiline
            />
            <Field label="Tantou notes" value={notes} onChange={setNotes} multiline />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onSubmit}
                disabled={createReport.isPending}
                className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
              >
                {createReport.isPending ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </section>

          <aside className="space-y-3 rounded-md border border-border bg-card p-4 text-xs">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Ranking
            </p>
            {latestRanking ? (
              <dl className="grid grid-cols-2 gap-2">
                <Metric label="Period" value={latestRanking.period} />
                <Metric label="Status" value={latestRanking.status} />
                <Metric label="Reader" value={latestRanking.readerScore.toFixed(1)} />
                <Metric label="Votes" value={latestRanking.voteCount.toLocaleString()} />
                <Metric label="Final" value={latestRanking.finalScore.toFixed(1)} />
                <Metric label="Risk" value="At risk" />
              </dl>
            ) : (
              <p className="text-muted-foreground">No at-risk ranking data yet.</p>
            )}
            <div className="border-t border-border pt-3">
              <p className="font-semibold">Latest submitted report</p>
              {reportLoading ? (
                <p className="mt-1 text-muted-foreground">Loading report...</p>
              ) : reportError ? (
                <p className="mt-1 text-rose-600">Could not load report.</p>
              ) : latestReport ? (
                <>
                  <p className="mt-1 text-muted-foreground">{latestReport.recommendation}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDateTime(latestReport.createdAt)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-muted-foreground">No report submitted yet.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export const BoardBriefsPage = AtRiskReportsPage;

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="space-y-1 text-xs">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full rounded border border-border bg-background p-2 text-sm"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded border border-border bg-background px-2 text-sm"
        />
      )}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
