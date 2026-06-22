import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, ScanLine } from "lucide-react";
import { useEditorProductionProgress } from "@/shared/queries/useEditorReview";
import {
  EditorEmpty,
  EditorInlineLoading,
  EditorPanel,
  EditorPill,
  EditorShell,
} from "@/features/editor/components/EditorWorkspace";

export const Route = createFileRoute("/app/editor/production-progress")({
  component: ProductionProgressPage,
});

function ProductionProgressPage() {
  const { data = [], isLoading } = useEditorProductionProgress();

  return (
    <EditorShell
      title="Production progress"
      description="Chapter, page, task, and readiness status for series under your editorial care."
    >
      <EditorPanel
        title="Chapter readiness"
        description="Open a series or page studio when a chapter needs intervention."
      >
        {isLoading ? (
          <EditorInlineLoading label="Loading production progress..." />
        ) : data.length === 0 ? (
          <EditorEmpty
            title="No production progress"
            hint="Ongoing series chapters will appear here."
          />
        ) : (
          <div className="divide-y divide-border">
            {data.map((group) => (
              <section key={group.series.id} className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">{group.series.title}</h2>
                    <p className="text-xs text-muted-foreground">{group.series.status}</p>
                  </div>
                  <Link
                    to="/app/series/$id"
                    params={{ id: group.series.id }}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Open hub
                  </Link>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {group.chapters.map((chapter) => (
                    <article
                      key={chapter.id}
                      className="rounded-md border border-border bg-background p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">
                            Ch. {chapter.chapterNumber} · {chapter.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {chapter.pagesApproved}/{chapter.pagesTotal} pages approved ·{" "}
                            {chapter.tasksApproved}/{chapter.tasksTotal} tasks final-approved
                          </div>
                        </div>
                        <EditorPill tone={chapter.pendingEditorReviews ? "warn" : "neutral"}>
                          {chapter.pendingEditorReviews} final
                        </EditorPill>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${chapter.readinessPercent}%` }}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(chapter.pages ?? []).map((page) => (
                          <Link
                            key={page.id}
                            to="/app/pages/$id/studio"
                            params={{ id: page.id }}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] transition hover:bg-foreground/5"
                          >
                            <ScanLine className="h-3 w-3" />P{page.pageNumber}
                          </Link>
                        ))}
                        {(chapter.pages ?? []).length === 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Layers className="h-3.5 w-3.5" />
                            No pages available
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </EditorPanel>
    </EditorShell>
  );
}
