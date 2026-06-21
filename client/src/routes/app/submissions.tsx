import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { useAllSubmissions } from "@/shared/queries/useSubmissions";
import { refLabel } from "@/shared/api/submissions";
import { Loader2, FolderOpen } from "lucide-react";

export const Route = createFileRoute("/app/submissions")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { data: list = [], isLoading } = useAllSubmissions();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Submissions"
        jp="提出物"
        description="Task submissions tracking for assigned series."
      />

      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55 font-bold">
          <span>Series</span>
          <span>Task</span>
          <span>Assistant</span>
          <span>Status</span>
          <span>Submitted</span>
        </div>

        {isLoading && (
          <div className="flex h-32 items-center justify-center text-foreground/50">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading submissions…
          </div>
        )}

        {!isLoading && list.length === 0 && (
          <div className="py-12">
            <EmptyState
              title="No submissions found"
              hint="Any task submissions submitted by assistants will appear here."
              icon={FolderOpen}
            />
          </div>
        )}

        {!isLoading &&
          list.map((sm: any) => {
            const seriesTitle = refLabel(sm.seriesId, "Unknown Series");
            const taskTitle = refLabel(sm.taskId, "Unknown Task");
            const assistantName = sm.submittedBy?.name || "Assistant";

            return (
              <div
                key={sm.id}
                className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3.5 text-[13px] hover:bg-accent/40 last:border-b-0 transition-colors"
              >
                <div>
                  <div className="font-semibold text-foreground">{seriesTitle}</div>
                  <div className="text-[10px] text-foreground/45 uppercase tracking-wider mt-0.5">
                    Version {sm.version}
                  </div>
                </div>
                <span className="font-medium text-foreground/80">{taskTitle}</span>
                <span className="text-foreground/70">{assistantName}</span>
                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      sm.status === "EDITOR_APPROVED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : sm.status === "MANGAKA_APPROVED"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : sm.status === "REVISION_REQUESTED"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : sm.status === "REJECTED"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-foreground/5 text-foreground/60"
                    }`}
                  >
                    {sm.status.replace("_", " ")}
                  </span>
                </div>
                <span className="text-[11px] text-foreground/55">
                  {new Date(sm.createdAt).toLocaleDateString()}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
