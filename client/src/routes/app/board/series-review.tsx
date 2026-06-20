import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { series, votesBySeries, findStaff } from "@/entities";
import { Vote } from "lucide-react";

export const Route = createFileRoute("/app/board/series-review")({
  component: BoardReviewQueue,
});

function BoardReviewQueue() {
  const queue = series.filter((s) => s.status === "board-review");
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Board Review"
        jp="編集会議"
        description="Series forwarded by Editor — finalize Approve/Reject + publicationType."
      />
      <div className="rounded-md border border-foreground/10 bg-card divide-y divide-foreground/10">
        {queue.length === 0 && (
          <EmptyState title="Nothing to vote on" hint="All forwarded series have been decided. New proposals will appear here once the Editor forwards them." icon={Vote} />
        )}
        {queue.map((s) => {
          const votes = votesBySeries(s.id);
          const author = findStaff(s.mangakaId);
          return (
            <Link
              to="/app/board/series/$id/vote"
              params={{ id: s.id }}
              key={s.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-foreground/5"
            >
              <img src={s.cover} alt="" className="h-16 w-12 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-sm font-bold">{s.title}</div>
                  <div className="font-jp text-xs text-foreground/55">{s.jp}</div>
                </div>
                <div className="mt-0.5 text-xs text-foreground/65">
                  {author?.name} · {votes.length} vote(s) cast
                </div>
              </div>
              <Vote className="h-4 w-4 text-foreground/40" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
