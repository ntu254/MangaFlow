import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileCheck2, User } from "lucide-react";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { refId, refLabel } from "@/shared/api/submissions";
import { useEditorFinalReviewQueue } from "@/shared/queries/useEditorReview";

export const Route = createFileRoute("/app/editor/final-reviews")({
  component: EditorFinalReviewQueue,
});

function EditorFinalReviewQueue() {
  const { data: queue = [], isLoading } = useEditorFinalReviewQueue();

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Final Review Queue"
        jp="最終レビューキュー"
        description="Task submissions approved by Mangaka and awaiting Editor final approval (Flow 07)."
      />

      <div className="rounded-md border border-foreground/10 bg-card overflow-hidden">
        {isLoading && (
          <div className="px-5 py-8 text-center text-sm text-foreground/55 animate-pulse">
            Loading final review queue...
          </div>
        )}
        {!isLoading && queue.length === 0 && (
          <EmptyState
            title="Queue clean!"
            hint="No task submissions are waiting for editor final approval at this time."
            icon={CheckCircle2}
          />
        )}
        {queue.map((sub: any) => {
          const seriesTitle = refLabel(sub.seriesId, "Unknown Series");
          const taskTitle = refLabel(sub.taskId, "Unknown Task");
          const assigneeName = sub.submittedBy?.name || "Assistant";

          return (
            <Link
              to="/app/editor/tasks/$id/final-review"
              params={{ id: refId(sub.taskId) }}
              key={sub.id}
              className="flex items-center gap-4 border-b border-foreground/10 px-5 py-4 last:border-0 hover:bg-foreground/5 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-sm font-bold hover:underline">
                    {seriesTitle} — {taskTitle}
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/55">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {assigneeName}
                  </span>
                  <span>·</span>
                  <span>Version {sub.version}</span>
                  <span>·</span>
                  <span>Submitted {new Date(sub.updatedAt).toLocaleDateString()}</span>
                </div>
                {sub.resultText && (
                  <p className="mt-1.5 text-xs text-foreground/70 line-clamp-1 italic">
                    &ldquo;{sub.resultText}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Mangaka Approved
                </span>
                <span className="text-[10px] text-foreground/40">
                  Review &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
