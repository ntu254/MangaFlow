import { useReviewQueue } from "@/shared/queries/useSubmissions";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function ReviewQueueList() {
  const { data: submissions = [] } = useReviewQueue();
  const awaitingMe = submissions;

  return (
    <div className="flex-1 rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-foreground">Review Queue</h2>
          <span className="flex h-5 items-center justify-center rounded-full bg-destructive/10 px-2 text-[10px] font-bold text-destructive">
            {awaitingMe.length}
          </span>
        </div>
        <Link
          to="/app/review"
          className="flex items-center gap-1 text-[12px] font-medium text-foreground/60 hover:text-foreground"
        >
          View all reviews <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {awaitingMe.map((sm) => {
          return (
            <div key={sm.id} className="flex gap-3 group">
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-foreground/50">
                <span className="text-[10px] font-bold uppercase">IMG</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate text-[13px] font-medium text-foreground">
                    <span className="font-bold">Series {sm.seriesId}</span> - Chapter {sm.chapterId}
                  </div>
                  <span className="shrink-0 rounded bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-red-600 dark:text-red-400">
                    {sm.status}
                  </span>
                </div>
                <div className="text-[12px] text-foreground/70 truncate">Task {sm.taskId}</div>
                <div className="mt-0.5 flex justify-between text-[11px] text-foreground/50">
                  <span>Submitted by: {sm.submittedBy.name}</span>
                  <span>{new Date(sm.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
