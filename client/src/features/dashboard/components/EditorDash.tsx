import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, CalendarClock, FileCheck2, Inbox } from "lucide-react";
import { useDashboard } from "@/shared/queries/useDashboard";
import { useRole } from "@/shared/lib/role";
import { useEditorActivity, useEditorManagedSeries } from "@/shared/queries/useEditorReview";
import {
  EditorEmpty,
  EditorInlineLoading,
  EditorMetric,
  EditorPanel,
  EditorPill,
  EditorShell,
} from "@/features/editor/components/EditorWorkspace";

export function EditorDash() {
  const { role } = useRole();
  const { data, isLoading } = useDashboard(role);
  const { data: managedSeries = [], isLoading: isLoadingSeries } = useEditorManagedSeries();
  const { data: activity = [], isLoading: isLoadingActivity } = useEditorActivity();

  const manuscriptReviewCount: number = data?.reviewQueue?.manuscripts ?? 0;
  const finalReviewCount: number = data?.quickStats?.pendingApprovals ?? 0;
  const assignedSeries: number = data?.quickStats?.assignedSeries ?? managedSeries.length;
  const deadlineSoon: number = data?.quickStats?.deadlineSoon ?? 0;
  const revisionRequired = managedSeries.reduce((sum, item) => sum + item.blockers, 0);
  const atRiskCount: number =
    (data?.atRiskItems ?? []).length ||
    managedSeries.filter((item) => item.series.status === "AT_RISK").length;
  const boardReportsNeeded = manuscriptReviewCount;

  if (isLoading || isLoadingSeries) {
    return <EditorInlineLoading label="Loading Editorial Review Workspace..." />;
  }

  const prioritySeries = [...managedSeries]
    .sort(
      (a, b) =>
        b.pendingFinalReviews +
        b.deadlineRisk +
        b.blockers -
        (a.pendingFinalReviews + a.deadlineRisk + a.blockers),
    )
    .slice(0, 5);

  return (
    <EditorShell
      title="Editorial Review Workspace"
      description="A focused Tantou desk for manuscript review, page feedback, production pressure, Board recommendations, and managed-series risk."
      actions={
        <>
          <Link
            to="/app/editor/series-review"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition hover:bg-foreground/5 active:translate-y-px"
          >
            <Inbox className="h-4 w-4" />
            Manuscript review
          </Link>
          <Link
            to="/app/editor/final-reviews"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition hover:opacity-90 active:translate-y-px"
          >
            <FileCheck2 className="h-4 w-4" />
            Final reviews
          </Link>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <EditorMetric label="Managed series" value={String(assignedSeries)} />
        <EditorMetric
          label="Pending manuscript reviews"
          value={String(manuscriptReviewCount)}
          tone="info"
        />
        <EditorMetric label="Revision required" value={String(revisionRequired)} tone="warn" />
        <EditorMetric label="Upcoming deadlines" value={String(deadlineSoon)} tone="danger" />
        <EditorMetric label="High-risk series" value={String(atRiskCount)} tone="warn" />
        <EditorMetric label="Board reports needed" value={String(boardReportsNeeded)} tone="info" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <EditorPanel
          title="Pending review list"
          description="Manuscripts and final submissions waiting for an Editor decision."
          action={
            <Link
              to="/app/editor/production-progress"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View progress <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-border">
            <QueueRow
              icon={<Inbox className="h-4 w-4" />}
              title="Proposal and manuscript packages"
              detail="Review evidence, add notes, ask for revision, reject, or forward to Board."
              count={manuscriptReviewCount}
              to="/app/editor/series-review"
            />
            <QueueRow
              icon={<FileCheck2 className="h-4 w-4" />}
              title="Final submissions at quality gate"
              detail="Only Mangaka-approved submissions appear here."
              count={finalReviewCount}
              to="/app/editor/final-reviews"
            />
            <QueueRow
              icon={<CalendarClock className="h-4 w-4" />}
              title="Production items near deadline"
              detail="Active work due within the next three days."
              count={deadlineSoon}
              to="/app/editor/production-progress"
            />
          </div>
        </EditorPanel>

        <EditorPanel
          title="Deadline and ranking alerts"
          description="Series that need intervention before review or Board escalation."
          action={
            <Link
              to="/app/editor/ranking-risk"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Open risk board <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {prioritySeries.length === 0 ? (
            <EditorEmpty
              title="No assigned series yet"
              hint="Assigned series will appear here once you are added as an active Editor member."
            />
          ) : (
            <div className="divide-y divide-border">
              {prioritySeries.map((item) => (
                <Link
                  key={item.series.id}
                  to="/app/series/$id"
                  params={{ id: item.series.id }}
                  className="block px-4 py-3 transition hover:bg-foreground/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{item.series.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.currentChapter
                          ? `Ch. ${item.currentChapter.chapterNumber} - ${item.currentChapter.status}`
                          : "No active chapter"}
                      </div>
                    </div>
                    <EditorPill tone={item.deadlineRisk || item.blockers ? "warn" : "success"}>
                      {item.deadlineRisk || item.blockers ? "Watch" : "Stable"}
                    </EditorPill>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                    <span>{item.pendingFinalReviews} final</span>
                    <span>{item.blockers} blockers</span>
                    <span>{item.deadlineRisk} due soon</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </EditorPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <EditorPanel title="Managed series" description="Assigned active series and current load.">
          <div className="divide-y divide-border">
            {managedSeries.slice(0, 6).map((item) => (
              <Link
                key={item.series.id}
                to="/app/series/$id"
                params={{ id: item.series.id }}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-foreground/5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground/5">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{item.series.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {item.series.status} - {item.activeTasks} active tasks
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {managedSeries.length === 0 && (
              <EditorEmpty
                title="No managed series"
                hint="Nothing is assigned to this Editor yet."
              />
            )}
          </div>
        </EditorPanel>

        <EditorPanel
          title="Recent editor activity"
          description="Editor-safe comments, production events, and Board-related updates."
        >
          {isLoadingActivity ? (
            <EditorInlineLoading label="Loading activity..." />
          ) : activity.length === 0 ? (
            <EditorEmpty title="No activity yet" hint="Production events will appear here." />
          ) : (
            <div className="divide-y divide-border">
              {activity.slice(0, 8).map((event) => (
                <div key={event.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-foreground/35" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{event.type}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {event.seriesTitle}
                      {event.detail ? ` - ${event.detail}` : ""}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {event.at ? new Date(event.at).toLocaleDateString() : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </EditorPanel>
      </section>
    </EditorShell>
  );
}

function QueueRow({
  icon,
  title,
  detail,
  count,
  to,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  count: number;
  to: string;
}) {
  return (
    <Link
      to={to as never}
      className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-foreground/5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
        </div>
      </div>
      <div className="font-mono text-2xl font-semibold">{count}</div>
    </Link>
  );
}
