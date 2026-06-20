import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { series, proposalBySeries, manuscriptBySeries, findStaff } from "@/entities";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/app/editor/series-review")({
  component: EditorReviewQueue,
});

function EditorReviewQueue() {
  const queue = series.filter((s) => s.status === "editor-review");

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Editor Review Queue"
        jp="編集レビューキュー"
        description="Series waiting for Editor decision (Flow 01)."
      />
      <div className="rounded-md border border-foreground/10 bg-card">
        {queue.length === 0 && (
          <EmptyState title="Inbox zero 🎉" hint="No series are waiting for editor review right now. Check back later." icon={Inbox} />
        )}
        {queue.map((s) => {
          const proposal = proposalBySeries(s.id);
          const ms = manuscriptBySeries(s.id);
          const author = findStaff(s.mangakaId);
          return (
            <Link
              to="/app/editor/series/$id/review"
              params={{ id: s.id }}
              key={s.id}
              className="flex items-center gap-4 border-b border-foreground/10 px-5 py-4 last:border-0 hover:bg-foreground/5"
            >
              <img src={s.cover} alt="" className="h-16 w-12 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-sm font-bold">{s.title}</div>
                  <div className="font-jp text-xs text-foreground/55">{s.jp}</div>
                </div>
                <div className="mt-0.5 text-xs text-foreground/65">
                  {author?.name} · requested {proposal?.requestedPublicationType} ·{" "}
                  {ms ? `${ms.status}` : "no manuscript"}
                </div>
                <div className="mt-1 line-clamp-1 text-xs text-foreground/55">
                  {proposal?.synopsis ?? s.synopsis}
                </div>
              </div>
              <Inbox className="h-4 w-4 text-foreground/40" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
