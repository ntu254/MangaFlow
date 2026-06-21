import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { refId, refLabel } from "@/shared/api/submissions";
import { useReviewQueue } from "@/shared/queries/useSubmissions";

function ReviewRoute() {
  const { data: queue = [] } = useReviewQueue();
  return (
    <div>
      <PageHeader
        title="Review queue"
        jp="査読待ち"
        description="Manuscripts awaiting editorial review or revision."
      />
      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
          <span>Series</span>
          <span>Chapter</span>
          <span>Mangaka</span>
          <span>Status</span>
          <span>Pages</span>
          <span />
        </div>
        {queue.map((sm) => {
          const seriesId = refId(sm.seriesId);
          const seriesLabel = refLabel(sm.seriesId, "Unknown Series");
          const chapterLabel = refLabel(sm.chapterId, "Unknown Chapter");

          return (
            <div
              key={sm.id}
              className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] hover:bg-accent/40 last:border-b-0"
            >
              <span className="font-medium">{seriesLabel}</span>
              <span>{chapterLabel}</span>
              <span className="text-foreground/70">{sm.submittedBy.name}</span>
              <StatusBadge status={sm.status as any} />
              <span className="text-foreground/70">-</span>
              <Link
                to="/app/series/$id/reviews"
                params={{ id: seriesId }}
                className="rounded border border-foreground/15 px-2 py-1 text-[11px] hover:bg-foreground/5"
              >
                Open
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/app/review")({
  component: ReviewRoute,
});
