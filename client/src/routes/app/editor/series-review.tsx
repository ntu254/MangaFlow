import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { useEditorReviewQueue } from "@/shared/queries/useEditorReview";

export const Route = createFileRoute("/app/editor/series-review")({
  component: EditorReviewQueue,
});

function EditorReviewQueue() {
  const { data: queue = [], isLoading } = useEditorReviewQueue();

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Editor Review Queue"
        jp="編集レビューキュー"
        description="Series waiting for Editor decision (Flow 01)."
      />
      <div className="rounded-md border border-foreground/10 bg-card">
        {isLoading && (
          <div className="px-5 py-8 text-center text-sm text-foreground/55">
            Loading editor review queue...
          </div>
        )}
        {!isLoading && queue.length === 0 && (
          <EmptyState
            title="Inbox zero"
            hint="No series are waiting for editor review right now. Check back later."
            icon={Inbox}
          />
        )}
        {queue.map(({ series, manuscript }) => (
          <Link
            to="/app/editor/series/$id/review"
            params={{ id: series.id }}
            key={series.id}
            className="flex items-center gap-4 border-b border-foreground/10 px-5 py-4 last:border-0 hover:bg-foreground/5"
          >
            <div className="flex h-16 w-12 items-center justify-center rounded bg-foreground/5 text-xs font-bold text-foreground/45">
              {series.title.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <div className="text-sm font-bold">{series.title}</div>
                <div className="text-xs text-foreground/55">{series.status}</div>
              </div>
              <div className="mt-0.5 text-xs text-foreground/65">
                requested {series.requestedPublicationType ?? "unspecified"} ·{" "}
                {manuscript
                  ? `manuscript v${manuscript.version} ${manuscript.status}`
                  : "no manuscript"}
              </div>
              <div className="mt-1 line-clamp-1 text-xs text-foreground/55">{series.synopsis}</div>
            </div>
            <Inbox className="h-4 w-4 text-foreground/40" />
          </Link>
        ))}
      </div>
    </div>
  );
}
