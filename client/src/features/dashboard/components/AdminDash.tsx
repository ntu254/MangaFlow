import { StatGrid } from "./StatGrid";
import { Panel } from "./Panel";
import { Row } from "./Row";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import {
  series,
  chapters,
  ballots,
  submissions,
  findTask,
  findChapter,
  findSeries,
  findStaff,
} from "@/entities";
import { num } from "@/shared/lib/format";

export function AdminDash() {
  return (
    <div className="space-y-6">
      <StatGrid
        items={[
          { label: "Users", value: num(124), hint: "+4 this week" },
          {
            label: "Active series",
            value: String(series.filter((s) => s.status === "ongoing").length),
          },
          {
            label: "Chapters in-flight",
            value: String(
              chapters.filter((c) => c.status !== "published" && c.status !== ("ended" as never))
                .length,
            ),
          },
          {
            label: "Open ballots",
            value: String(ballots.filter((b) => b.status === "open").length),
          },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Recent activity">
          {submissions.slice(0, 4).map((sm) => {
            const t = findTask(sm.taskId)!;
            const ch = findChapter(t.chapterId)!;
            const s = findSeries(ch.seriesId)!;
            return (
              <Row
                key={sm.id}
                left={
                  <>
                    <span className="font-medium">{s.title}</span> · {ch.number} — submission by{" "}
                    {findStaff(t.assigneeId)?.name}
                  </>
                }
                right={sm.submittedAt}
              />
            );
          })}
        </Panel>
        <Panel title="At-risk series">
          {series
            .filter((s) => s.status === "at-risk")
            .map((s) => (
              <Row
                key={s.id}
                left={
                  <>
                    <span className="font-medium">{s.title}</span> ·{" "}
                    <span className="font-jp text-foreground/55">{s.jp}</span>
                  </>
                }
                right={<StatusBadge status={s.status} />}
              />
            ))}
        </Panel>
      </div>
    </div>
  );
}
