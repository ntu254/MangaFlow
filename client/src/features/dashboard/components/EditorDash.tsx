import { Link } from "@tanstack/react-router";
import { StatGrid } from "./StatGrid";
import { Panel } from "./Panel";
import { Row } from "./Row";
import { ArrowRight, Loader2, Inbox, FileCheck2, BookOpen } from "lucide-react";
import { useDashboard } from "@/shared/queries/useDashboard";
import { useRole } from "@/shared/lib/role";

export function EditorDash() {
  const { role } = useRole();
  const { data, isLoading } = useDashboard(role);

  const seriesReviewCount: number = data?.reviewQueue?.manuscripts ?? 0;
  const finalReviewCount: number = data?.quickStats?.pendingApprovals ?? 0;
  const assignedSeries: number = data?.quickStats?.assignedSeries ?? 0;
  const atRiskCount: number = (data?.atRiskItems ?? []).length;

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-foreground/40">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatGrid
        items={[
          {
            label: "Series review queue",
            value: String(seriesReviewCount),
          },
          {
            label: "Final review (Flow 07)",
            value: String(finalReviewCount),
          },
          {
            label: "Assigned series",
            value: String(assignedSeries),
          },
          {
            label: "At-risk series",
            value: String(atRiskCount),
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Panel 1 — Series Proposal Review (Flow 01) */}
        <Panel
          title="Series proposal review"
          action={
            <Link
              to="/app/editor/series-review"
              className="text-xs text-foreground/60 hover:text-foreground inline-flex items-center gap-1"
            >
              Open queue <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {seriesReviewCount === 0 ? (
            <Row
              left={<span className="text-foreground/45">No series waiting for review.</span>}
              right={null}
            />
          ) : (
            <Row
              left={
                <span className="font-medium">
                  {seriesReviewCount} series pending Editor review
                </span>
              }
              right={
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  {seriesReviewCount} pending
                </span>
              }
            />
          )}
        </Panel>

        {/* Panel 2 — Final Review (Flow 07) */}
        <Panel
          title="Final review queue"
          action={
            <Link
              to="/app/editor/final-reviews"
              className="text-xs text-foreground/60 hover:text-foreground inline-flex items-center gap-1"
            >
              Open <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {finalReviewCount === 0 ? (
            <Row
              left={<span className="text-foreground/45">No submissions awaiting final review.</span>}
              right={null}
            />
          ) : (
            <Row
              left={
                <span className="font-medium">
                  {finalReviewCount} submission(s) pending Editor final approval
                </span>
              }
              right={
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  {finalReviewCount} to review
                </span>
              }
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
