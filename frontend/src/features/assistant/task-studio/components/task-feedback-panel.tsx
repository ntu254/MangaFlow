import type { StudioComment, StudioTask } from "@/entities/series/model/studio-types";
import { formatDateTime } from "@/shared/lib/format-date";
import { MessageSquare } from "lucide-react";

export function TaskFeedbackPanel({
  task,
  comments,
  highlight,
  readOnly = false,
}: {
  task: StudioTask;
  comments: StudioComment[];
  highlight: boolean;
  readOnly?: boolean;
}) {
  const taskComments = comments.filter((c) => c.taskId === task.id || c.pageId === task.pageId);

  if (taskComments.length === 0) {
    return <div className="p-3 text-xs text-muted-foreground">No feedback for this task yet.</div>;
  }

  return (
    <div className={`space-y-2 p-3 ${highlight ? "bg-orange-50/60" : ""}`}>
      {highlight ? (
        <div className="flex items-start gap-2 rounded border border-orange-300 bg-orange-100 p-2 text-[11px] text-orange-900">
          <MessageSquare className="mt-0.5 size-3.5" />
          <span>
            Mangaka has requested revisions. Review the feedback below and mark it addressed when
            done.
          </span>
        </div>
      ) : null}
      <ul className="space-y-2">
        {taskComments.map((c) => (
          <li key={c.id} className="rounded border border-border bg-card p-2.5 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{c.authorName}</p>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  c.status === "ADDRESSED"
                    ? "bg-emerald-100 text-emerald-900"
                    : c.status === "RESOLVED"
                      ? "bg-zinc-200 text-zinc-700"
                      : "bg-orange-100 text-orange-900"
                }`}
              >
                {c.status}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">{c.text}</p>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {formatDateTime(c.createdAt)}
            </p>
            {c.status === "OPEN" && !readOnly ? (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Addressing and resolving feedback follow the canonical comment workflow.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
