import { Link } from "@tanstack/react-router";
import { StatGrid } from "./StatGrid";
import { Panel } from "./Panel";
import { Row } from "./Row";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { useRole } from "@/shared/lib/role";
import { tasks, payroll, currentUserByRole, findChapter, findSeries } from "@/entities";
import { jpy } from "@/shared/lib/format";
import { ArrowRight } from "lucide-react";

export function AssistantDash() {
  const { role } = useRole();
  const me = currentUserByRole[role];
  const mine = tasks.filter((t) => t.assigneeId === me.id);
  const earnings = payroll
    .filter((p) => mine.some((t) => t.id === p.taskId))
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <StatGrid
        items={[
          {
            label: "Active tasks",
            value: String(mine.filter((t) => t.status !== "approved").length),
          },
          {
            label: "Submitted (waiting)",
            value: String(mine.filter((t) => t.status === "submitted").length),
          },
          {
            label: "Approved this month",
            value: String(mine.filter((t) => t.status === "approved").length),
          },
          { label: "Earnings (June)", value: jpy(earnings) },
        ]}
      />
      <Panel
        title="My tasks"
        action={
          <Link
            to="/app/tasks"
            className="text-xs text-foreground/60 hover:text-foreground inline-flex items-center gap-1"
          >
            Board <ArrowRight className="h-3 w-3" />
          </Link>
        }
      >
        {mine.map((t) => {
          const ch = findChapter(t.chapterId)!;
          const s = findSeries(ch.seriesId)!;
          return (
            <Row
              key={t.id}
              left={
                <>
                  <span className="font-medium">{s.title}</span> · {ch.number} ·{" "}
                  <span className="text-foreground/70">{t.type}</span> · {t.pageRange}
                </>
              }
              right={
                <div className="flex items-center gap-3">
                  <StatusBadge status={t.status} />
                  <span>{t.deadline}</span>
                </div>
              }
            />
          );
        })}
      </Panel>
    </div>
  );
}
