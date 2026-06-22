import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine } from "lucide-react";
import { useEditorProductionProgress } from "@/shared/queries/useEditorReview";
import {
  EditorEmpty,
  EditorInlineLoading,
  EditorPanel,
  EditorPill,
  EditorShell,
} from "@/features/editor/components/EditorWorkspace";

export const Route = createFileRoute("/app/editor/page-annotation")({
  component: PageAnnotationPage,
});

function PageAnnotationPage() {
  const { data = [], isLoading } = useEditorProductionProgress();
  const chapters = data.flatMap((group) =>
    group.chapters.map((chapter) => ({ ...chapter, series: group.series })),
  );

  return (
    <EditorShell
      title="Page annotation"
      description="Review-mode entry point for page feedback: inspect working files, highlight regions, add issue notes, and prepare revision requests."
    >
      <EditorPanel
        title="Review mode canvas queue"
        description="Open pages from production progress. Editor feedback should stay scoped to the page, region, task, or submission being reviewed."
      >
        {isLoading ? (
          <EditorInlineLoading label="Loading pages..." />
        ) : chapters.length === 0 ? (
          <EditorEmpty
            title="No pages to annotate"
            hint="Pages appear after production chapters are uploaded."
          />
        ) : (
          <div className="divide-y divide-border">
            {chapters.map((chapter) => (
              <section key={chapter.id} className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {chapter.series.title} · Ch. {chapter.chapterNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">{chapter.status}</div>
                  </div>
                  <EditorPill tone={chapter.pendingEditorReviews ? "warn" : "neutral"}>
                    {chapter.pendingEditorReviews} reviews
                  </EditorPill>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {(chapter.pages ?? []).map((page) => (
                    <Link
                      key={page.id}
                      to="/app/pages/$id/studio"
                      params={{ id: page.id }}
                      className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm transition hover:bg-foreground/5"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ScanLine className="h-4 w-4 text-muted-foreground" />
                        Page {page.pageNumber}
                      </span>
                      <EditorPill tone={page.hasWorkingFile ? "success" : "warn"}>
                        {page.status}
                      </EditorPill>
                    </Link>
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
