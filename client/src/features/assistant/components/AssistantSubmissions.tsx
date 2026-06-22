import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { useRole } from "@/shared/lib/role";
import { currentUserByRole } from "@/entities";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { Inbox, ArrowRight, Loader2 } from "lucide-react";
import { useAllSubmissions } from "@/shared/queries/useSubmissions";

const STATUS_FILTERS: { key: "all" | string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Waiting review" },
  { key: "revision-requested", label: "Revision" },
  { key: "mangaka-approved", label: "Mangaka approved" },
  { key: "editor-approved", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

const getNormalizedStatus = (status: string) => status.toLowerCase().replace(/_/g, "-");

export function AssistantSubmissions() {
  const { role, user } = useRole();
  const me = currentUserByRole[role];
  const currentUserId = user?.id || me.id;
  const [status, setStatus] = useState<string>("all");
  const { data: allSubs = [], isLoading } = useAllSubmissions();

  const mine = useMemo(
    () =>
      allSubs
        .filter((s: any) => {
          const userId = typeof s.submittedBy === "object" ? s.submittedBy?.id || s.submittedBy?._id : s.submittedBy;
          return userId === currentUserId;
        })
        .sort((a: any, b: any) => (a.createdAt > b.createdAt ? -1 : 1)),
    [allSubs, currentUserId],
  );

  const filtered = useMemo(() => {
    if (status === "all") return mine;
    return mine.filter((s: any) => getNormalizedStatus(s.status) === status);
  }, [mine, status]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My submissions"
        jp="提出履歴"
        description="Every version you've submitted. Each submit creates a new version — nothing is overwritten."
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-foreground/10 pb-2">
        {STATUS_FILTERS.map((f) => {
          const active = status === f.key;
          const count =
            f.key === "all"
              ? mine.length
              : mine.filter((s: any) => getNormalizedStatus(s.status) === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              {f.label}
              <span
                className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] tabular-nums ${
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-foreground/60"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-foreground/50">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading submissions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/15 bg-card py-16 text-foreground/55">
          <Inbox className="h-5 w-5" />
          <span className="text-[12px]">No submissions in this view.</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-muted text-[11px] uppercase tracking-wider text-foreground/55">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Task</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
                    Chapter
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Version</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
                    Submitted at
                  </th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Feedback / Note</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => {
                  const taskTitle = typeof s.taskId === "object" ? s.taskId?.title : s.taskId || "Task";
                  const seriesTitle = typeof s.seriesId === "object" ? s.seriesId?.title : s.seriesId || "—";
                  const chapterNum = typeof s.chapterId === "object" ? s.chapterId?.chapterNumber : "—";
                  const isRev = getNormalizedStatus(s.status) === "revision-requested";
                  const taskId = typeof s.taskId === "object" ? s.taskId?.id || s.taskId?._id : s.taskId;

                  return (
                    <tr
                      key={s.id}
                      className={`border-t border-foreground/10 transition hover:bg-muted/60 ${
                        isRev ? "bg-destructive/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground line-clamp-1">
                          {taskTitle}
                        </div>
                        <div className="text-[11px] text-foreground/55 line-clamp-1">
                          {seriesTitle}
                        </div>
                      </td>
                      <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">
                        Chapter {chapterNum}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-foreground/70">v{s.version}</td>
                      <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="hidden px-3 py-2 text-foreground/70 md:table-cell max-w-[200px] truncate" title={s.reviewerNote}>
                        {s.reviewerNote || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {taskId ? (
                          <Link
                            to="/app/assistant/tasks/$taskId/studio"
                            params={{ taskId }}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-foreground/15 bg-background px-2.5 text-[11px] font-medium text-foreground hover:bg-muted"
                          >
                            Open <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-foreground/45">View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
