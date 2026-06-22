import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Send } from "lucide-react";
import { useEditorReviewQueue } from "@/shared/queries/useEditorReview";
import {
  EditorEmpty,
  EditorInlineLoading,
  EditorPanel,
  EditorPill,
  EditorShell,
} from "@/features/editor/components/EditorWorkspace";

export const Route = createFileRoute("/app/editor/board-reports")({
  component: BoardReportsPage,
});

function BoardReportsPage() {
  const { data = [], isLoading } = useEditorReviewQueue();
  const selected = data[0];

  return (
    <EditorShell
      title="Board reports"
      description="Report builder for Editor recommendation, feasibility note, suggested cadence, risk note, and defense context before Board handoff."
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <EditorPanel
          title="Recommendation cases"
          description="Proposal packages still in Editor review and eligible for Board preparation."
        >
          {isLoading ? (
            <EditorInlineLoading label="Loading proposal packages..." />
          ) : data.length === 0 ? (
            <EditorEmpty
              title="No Board reports pending"
              hint="Proposal packages appear here while they are in Editor review."
            />
          ) : (
            <div className="divide-y divide-border">
              {data.map(({ series, manuscript }) => (
                <Link
                  key={series.id}
                  to="/app/editor/series/$id/review"
                  params={{ id: series.id }}
                  className="grid gap-4 px-4 py-4 transition hover:bg-foreground/5 lg:grid-cols-[1fr_auto]"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-foreground/5">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{series.title}</div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {series.synopsis}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <EditorPill>{series.requestedPublicationType ?? "No cadence"}</EditorPill>
                        <EditorPill tone={manuscript ? "info" : "warn"}>
                          {manuscript ? `Manuscript v${manuscript.version}` : "Missing manuscript"}
                        </EditorPill>
                        <EditorPill>{manuscript?.status ?? "No manuscript status"}</EditorPill>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 self-center text-xs font-medium text-muted-foreground">
                    Open report builder
                    <Send className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </EditorPanel>

        <EditorPanel
          title="Defense note outline"
          description="Fields prepared in manuscript review before Forward to Board."
        >
          {selected ? (
            <div className="space-y-3 p-4 text-sm">
              <OutlineRow label="Series" value={selected.series.title} />
              <OutlineRow
                label="Recommendation"
                value={selected.manuscript?.editorRecommendation || "Draft in manuscript review"}
              />
              <OutlineRow
                label="Feasibility note"
                value={
                  selected.manuscript?.feasibilityNote ||
                  "Production feasibility, staffing, cadence"
                }
              />
              <OutlineRow
                label="Suggested cadence"
                value={selected.manuscript?.suggestedPublicationType || "WEEKLY or MONTHLY"}
              />
              <OutlineRow
                label="Risk note"
                value={selected.manuscript?.riskNote || "Reader risk, deadline risk, revision risk"}
              />
              <Link
                to="/app/editor/series/$id/review"
                params={{ id: selected.series.id }}
                className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition hover:opacity-90 active:translate-y-px"
              >
                Continue report
                <Send className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <EditorEmpty
              title="No active report"
              hint="Open a manuscript review when a package is ready for Board."
            />
          )}
        </EditorPanel>
      </section>
    </EditorShell>
  );
}

function OutlineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xs leading-5 text-foreground">{value}</div>
    </div>
  );
}
