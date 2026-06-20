import { Link } from "@tanstack/react-router";
import { StatGrid } from "./StatGrid";
import { Panel } from "./Panel";
import { Row } from "./Row";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import {
  series,
  chapters,
  submissions,
  publications,
  findChapter,
  findSeries,
} from "@/entities";
import { ArrowRight } from "lucide-react";

export function EditorDash() {
  const reviewQueue = chapters.filter((c) => c.status === "in-review");
  const upcoming = publications.filter((p) => p.state === "scheduled").slice(0, 4);
  const atRisk = series.filter((s) => s.status === "at-risk");

  return (
    <div className="space-y-6">
      <StatGrid
        items={[
          { label: "Review queue", value: String(reviewQueue.length) },
          { label: "Scheduled publish", value: String(upcoming.length) },
          { label: "At-risk series", value: String(atRisk.length) },
          {
            label: "Round-2 submissions",
            value: String(
              submissions.filter((s) => s.mangakaApproved && !s.editorApproved && !s.rejected)
                .length,
            ),
          },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Review queue"
          action={
            <Link
              to="/app/review"
              className="text-xs text-foreground/60 hover:text-foreground inline-flex items-center gap-1"
            >
              Open <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {reviewQueue.map((c) => {
            const s = findSeries(c.seriesId)!;
            return (
              <Row
                key={c.id}
                left={
                  <>
                    <span className="font-medium">{s.title}</span> · {c.number} — {c.title}
                  </>
                }
                right={<StatusBadge status={c.status} />}
              />
            );
          })}
        </Panel>
        <Panel
          title="Upcoming publications"
          action={
            <Link
              to="/app/publications"
              className="text-xs text-foreground/60 hover:text-foreground inline-flex items-center gap-1"
            >
              Calendar <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {upcoming.map((p) => {
            const ch = findChapter(p.chapterId)!;
            const s = findSeries(ch.seriesId)!;
            return (
              <Row
                key={p.id}
                left={
                  <>
                    <span className="font-medium">{s.title}</span> · {ch.number}
                  </>
                }
                right={p.scheduledAt}
              />
            );
          })}
        </Panel>
      </div>
    </div>
  );
}
