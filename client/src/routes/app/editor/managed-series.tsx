import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, FileCheck2, TimerReset } from "lucide-react";
import type { EditorWorkspaceSeries } from "@/shared/api/editor";
import { useEditorManagedSeries } from "@/shared/queries/useEditorReview";
import {
  EditorEmpty,
  EditorInlineLoading,
  EditorMetric,
  EditorPanel,
  EditorPill,
  EditorShell,
} from "@/features/editor/components/EditorWorkspace";

export const Route = createFileRoute("/app/editor/managed-series")({
  component: ManagedSeriesPage,
});

function ManagedSeriesPage() {
  const { data = [], isLoading } = useEditorManagedSeries();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const finalReviews = data.reduce((sum, item) => sum + item.pendingFinalReviews, 0);
  const blockers = data.reduce((sum, item) => sum + item.blockers, 0);
  const dueSoon = data.reduce((sum, item) => sum + item.deadlineRisk, 0);

  const selected = useMemo(
    () => data.find((item) => item.series.id === selectedId) ?? data[0],
    [data, selectedId],
  );

  return (
    <EditorShell
      title="Managed series"
      description="A table-first view of assigned series, current chapter pressure, production progress, ranking signal, and next editorial action."
    >
      <section className="grid gap-4 md:grid-cols-4">
        <EditorMetric label="Assigned" value={String(data.length)} />
        <EditorMetric label="Final reviews" value={String(finalReviews)} tone="warn" />
        <EditorMetric label="Revision pressure" value={String(blockers)} tone="danger" />
        <EditorMetric label="Deadline risk" value={String(dueSoon)} tone="info" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <EditorPanel
          title="Series table"
          description="Select a row to inspect the editorial context without leaving the desk."
        >
          {isLoading ? (
            <EditorInlineLoading label="Loading managed series..." />
          ) : data.length === 0 ? (
            <EditorEmpty title="No managed series" hint="Assigned series will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[1.35fr_0.8fr_0.9fr_0.85fr_0.65fr_0.65fr_0.8fr_0.55fr] border-b border-border bg-foreground/[0.03] px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Series</span>
                  <span>Current chapter</span>
                  <span>Manuscript status</span>
                  <span>Production progress</span>
                  <span>Ranking</span>
                  <span>Risk</span>
                  <span>Next deadline</span>
                  <span className="text-right">Action</span>
                </div>
                <div className="divide-y divide-border">
                  {data.map((item) => (
                    <button
                      key={item.series.id}
                      type="button"
                      onClick={() => setSelectedId(item.series.id)}
                      className={`grid w-full grid-cols-[1.35fr_0.8fr_0.9fr_0.85fr_0.65fr_0.65fr_0.8fr_0.55fr] items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-foreground/5 ${
                        selected?.series.id === item.series.id ? "bg-foreground/[0.04]" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{item.series.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.series.genres?.slice(0, 2).join(", ") || "No genre set"}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.currentChapter
                          ? `Ch. ${item.currentChapter.chapterNumber}`
                          : "No chapter"}
                      </span>
                      <span>
                        <EditorPill>{item.series.status || "Unknown"}</EditorPill>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.activeTasks} active / {item.pendingFinalReviews} final
                      </span>
                      <span className="font-mono text-xs">
                        {item.latestRanking ? item.latestRanking.finalScore : "-"}
                      </span>
                      <span>
                        <EditorPill tone={riskTone(item)}>{riskLabel(item)}</EditorPill>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.deadlineRisk ? `${item.deadlineRisk} due soon` : "Clear"}
                      </span>
                      <span className="flex justify-end">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </EditorPanel>

        <SeriesDetailPanel item={selected} />
      </section>
    </EditorShell>
  );
}

function SeriesDetailPanel({ item }: { item?: EditorWorkspaceSeries }) {
  if (!item) {
    return (
      <EditorPanel title="Series detail" description="Select a series to inspect it.">
        <EditorEmpty title="No series selected" hint="Choose a row from the table." />
      </EditorPanel>
    );
  }

  return (
    <EditorPanel
      title="Detail drawer"
      description="Editorial snapshot for the selected managed series."
      action={
        <Link
          to="/app/series/$id"
          params={{ id: item.series.id }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          Open hub <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-foreground/5">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{item.series.title}</h2>
            <p className="mt-1 line-clamp-4 text-xs leading-5 text-muted-foreground">
              {item.series.synopsis || "No synopsis available."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Signal
            icon={<FileCheck2 className="h-3.5 w-3.5" />}
            label="Final"
            value={item.pendingFinalReviews}
          />
          <Signal
            icon={<TimerReset className="h-3.5 w-3.5" />}
            label="Due"
            value={item.deadlineRisk}
          />
          <Signal label="Block" value={item.blockers} />
        </div>

        <div className="rounded-md border border-border bg-background p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Current chapter
          </div>
          <div className="mt-2 text-sm font-semibold">
            {item.currentChapter
              ? `Chapter ${item.currentChapter.chapterNumber}: ${item.currentChapter.title}`
              : "No active chapter"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {item.currentChapter?.status ?? "No chapter status"}
          </div>
        </div>

        <div className="rounded-md border border-border bg-background p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Ranking signal
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">
              {item.latestRanking ? item.latestRanking.period : "No ranking yet"}
            </span>
            <EditorPill tone={riskTone(item)}>{riskLabel(item)}</EditorPill>
          </div>
          {item.latestRanking && (
            <p className="mt-1 text-xs text-muted-foreground">
              Score {item.latestRanking.finalScore} from {item.latestRanking.voteCount} votes.
            </p>
          )}
        </div>
      </div>
    </EditorPanel>
  );
}

function Signal({ icon, label, value }: { icon?: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}

function riskLabel(item: EditorWorkspaceSeries) {
  if (item.series.status === "AT_RISK") return "High";
  if (item.deadlineRisk || item.blockers || item.pendingFinalReviews) return "Watch";
  return "Stable";
}

function riskTone(item: EditorWorkspaceSeries): "success" | "warn" | "danger" {
  if (item.series.status === "AT_RISK") return "danger";
  if (item.deadlineRisk || item.blockers || item.pendingFinalReviews) return "warn";
  return "success";
}
