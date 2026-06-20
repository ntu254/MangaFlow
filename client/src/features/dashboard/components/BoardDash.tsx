import { Link } from "@tanstack/react-router";
import { StatGrid } from "./StatGrid";
import { Panel } from "./Panel";
import { Row } from "./Row";
import { series, ballots, findSeries } from "@/entities";
import { ArrowRight } from "lucide-react";

export function BoardDash() {
  const open = ballots.filter((b) => b.status === "open");
  return (
    <div className="space-y-6">
      <StatGrid
        items={[
          { label: "Open ballots", value: String(open.length) },
          {
            label: "At-risk series",
            value: String(series.filter((s) => s.status === "at-risk").length),
          },
          { label: "Rankings to lock", value: "1" },
          { label: "My votes pending", value: String(open.length) },
        ]}
      />
      <Panel
        title="Open ballots"
        action={
          <Link
            to="/app/board"
            className="text-xs text-foreground/60 hover:text-foreground inline-flex items-center gap-1"
          >
            Open <ArrowRight className="h-3 w-3" />
          </Link>
        }
      >
        {open.map((b) => {
          const s = findSeries(b.seriesId)!;
          return (
            <Row
              key={b.id}
              left={
                <>
                  <span className="font-medium">{s.title}</span> ·{" "}
                  <span className="text-foreground/55">{b.reason}</span>
                </>
              }
              right={`${b.votes.length} votes`}
            />
          );
        })}
      </Panel>
    </div>
  );
}
