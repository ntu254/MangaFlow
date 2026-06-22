import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { BookOpen, PenTool, TrendingUp } from "lucide-react";
import { useSeriesSummary } from "@/shared/queries/useSeries";

export const Route = createFileRoute("/app/series/$id/activity")({
  loader: ({ params }) => {
    return { id: params.id };
  },
  component: ActivityPage,
});

function ActivityPage() {
  const { id } = Route.useLoaderData();
  const { data: summary, isLoading } = useSeriesSummary(id);

  if (isLoading) {
    return <div className="p-8 text-sm text-foreground/55 animate-pulse">Loading activity...</div>;
  }

  if (!summary?.series) {
    return <div className="p-8 text-sm text-foreground/55">Series not found.</div>;
  }

  const { series } = summary;
  const members = summary.members ?? [];
  const ranking = summary.rankingSummary;
  const board = summary.boardReview;
  const mangakaMember = members.find((m) => m.role === "MANGAKA");
  const editorMember = members.find((m) => m.role === "EDITOR");
  const mangaka = mangakaMember?.user;
  const editor = editorMember?.user;

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <PageHeader
        title={`${series.title} · Activity`}
        jp="アクティビティ"
        description={
          <Link
            to="/app/series/$id"
            params={{ id: series.id }}
            className="underline-offset-2 hover:underline"
          >
            ← Back to series
          </Link>
        }
      />

      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-[#E5DFD3] bg-card p-6 shadow-sm dark:border-border">
          <SafeActivityTimeline
            tasks={summary.recentTasks ?? []}
            submissions={summary.recentSubmissions ?? []}
            comments={summary.recentComments ?? []}
          />
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-[#E5DFD3] bg-card p-5 shadow-sm dark:border-border">
            <h3 className="mb-4 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              Key Personnel
            </h3>
            <div className="flex flex-col gap-4">
              {mangaka && (
                <Person name={mangaka.name ?? "Mangaka"} label="Mangaka" icon="mangaka" />
              )}
              {editor && (
                <Person name={editor.name ?? "Editor"} label="Tantou Editor" icon="editor" />
              )}
              {!mangaka && !editor && (
                <p className="text-sm text-muted-foreground">No active personnel found.</p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#E5DFD3] bg-card shadow-sm dark:border-border">
            <div className="border-b border-[#E5DFD3] p-5 dark:border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Ranking / Reader Vote</h3>
                  <p className="text-[12px] text-muted-foreground">Board decision monitoring</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {ranking || board ? (
                <div className="space-y-4">
                  <Info label="Board result" value={board?.result ?? board?.status ?? "Pending"} />
                  <Info label="Ranking period" value={ranking?.period ?? "Not published"} />
                  <Info label="Reader votes" value={ranking?.voteCount ?? 0} />
                  <Info label="Reader score" value={ranking?.readerScore ?? "—"} />
                  <Info label="Final score" value={ranking?.finalScore ?? "—"} />
                  <Info label="Status" value={ranking?.status ?? "Waiting for publication"} />
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <p className="text-[13px] font-medium text-foreground">No data available</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Ranking and vote data will appear after publication.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SafeActivityTimeline({
  tasks,
  submissions,
  comments,
}: {
  tasks: Array<{ id: string; title: string; assignee?: string | null; createdAt?: string }>;
  submissions: Array<{
    id: string;
    status: string;
    submittedBy?: string | null;
    createdAt?: string;
  }>;
  comments: Array<{
    id: string;
    body: string;
    author?: string | null;
    updatedAt?: string;
    isBlocking?: boolean;
  }>;
}) {
  const submissionLabel: Record<string, string> = {
    SUBMITTED: "Submission submitted",
    MANGAKA_APPROVED: "Submission approved by Mangaka",
    EDITOR_APPROVED: "Submission final-approved by Editor",
    REJECTED: "Submission rejected",
    REVISION_REQUESTED: "Revision requested",
  };
  const events = [
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      label: "Task created and assigned",
      detail: [task.title, task.assignee].filter(Boolean).join(" · "),
      at: task.createdAt,
    })),
    ...submissions
      .filter((submission) => submissionLabel[submission.status])
      .map((submission) => ({
        id: `submission-${submission.id}`,
        label: submissionLabel[submission.status],
        detail: submission.submittedBy ?? "Production team",
        at: submission.createdAt,
      })),
    ...comments.map((comment) => ({
      id: `comment-${comment.id}`,
      label: comment.isBlocking ? "Blocking comment added" : "Comment updated",
      detail: [comment.author, comment.body].filter(Boolean).join(" · "),
      at: comment.updatedAt,
    })),
  ].sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")));

  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity</h2>
      <div className="mt-4 divide-y divide-border">
        {events.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No production activity yet.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="py-3">
              <p className="text-sm font-semibold text-foreground">{event.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Person({
  name,
  label,
  icon,
}: {
  name: string;
  label: string;
  icon: "mangaka" | "editor";
}) {
  const Icon = icon === "mangaka" ? PenTool : BookOpen;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[13px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
        {name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="font-bold text-foreground">{name}</div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[12px] font-bold text-muted-foreground">{label}</div>
      <div className="text-right text-sm font-extrabold text-foreground">{value}</div>
    </div>
  );
}
