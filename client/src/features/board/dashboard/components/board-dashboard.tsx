import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { useBoardQueueQuery, useVotingSessionsQuery } from "../../api/board-queries";
import type { AtRiskQueueItem, BoardQueueItem } from "../../model/board-adapters";
import { PageHeader } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatCard } from "@/shared/ui/stat-card";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, Scale, TriangleAlert } from "lucide-react";
import { Panel } from "@/shared/ui";

export function BoardDashboard() {
  const { data: queueItems = [], isLoading } = useBoardQueueQuery();
  const { data: sessions = [] } = useVotingSessionsQuery();

  const proposalItems = queueItems.filter(
    (item): item is BoardQueueItem => item.seriesStatus !== "AT_RISK",
  );
  const atRiskItems = queueItems.filter(
    (item): item is AtRiskQueueItem => item.seriesStatus === "AT_RISK",
  );

  const pending = proposalItems.filter((item) => item.decisionStatus === "PENDING");
  const tieBreak = proposalItems.filter((item) => item.decisionStatus === "TIE_BREAK_REQUIRED");
  const needsFinalize = proposalItems.filter((item) => item.canFinalize);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Board dashboard"
        description="Final proposal governance and at-risk review focus."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FileText className="size-4" />}
          tone="blue"
          label="Pending Review"
          value={pending.length}
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
          label="Needs Finalize"
          value={needsFinalize.length}
        />
        <StatCard
          icon={<Scale className="size-4" />}
          tone="violet"
          label="Tie-break"
          value={tieBreak.length}
        />
        <StatCard
          icon={<TriangleAlert className="size-4" />}
          tone="rose"
          label="At-risk"
          value={atRiskItems.length}
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Decision Focus"
          description="Proposals awaiting board review and decision."
          action={
            <Link to="/app/board/queue" className="text-xs font-semibold underline">
              Open queue
            </Link>
          }
        >
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Đang tải...</p>
          ) : pending.length === 0 ? (
            <EmptyState
              title="Không có proposal chờ vote"
              description="Board queue hiện đang trống."
            />
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to="/app/board/$id"
                  params={{ id: item.seriesId }}
                  className="block rounded border border-border bg-background p-3 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.seriesTitle || item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.genres?.slice(0, 2).join(" / ")}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {item.decisionStatus}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span>
                      Approve {item.voteSummary?.approve ?? 0} · Reject{" "}
                      {item.voteSummary?.reject ?? 0}
                    </span>
                    <span>
                      {item.voteCount ?? 0}/{BOARD_TOTAL}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel
            title="At-risk preview"
            description="Series flagged for potential cancellation risk."
          >
            <div className="space-y-2">
              {atRiskItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">Không có series nào đang at-risk.</p>
              ) : (
                atRiskItems.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    to="/app/board/at-risk"
                    className="flex items-center justify-between rounded border border-border bg-background px-3 py-2 text-xs hover:bg-muted"
                  >
                    <span className="font-medium">{item.seriesTitle}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {item.decisionStatus}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Recent sessions" description="Latest board voting sessions.">
            <div className="mt-3 space-y-2 text-xs">
              {sessions.length === 0 ? (
                <p className="text-muted-foreground">Chưa có phiên vote nào.</p>
              ) : (
                sessions.slice(0, 3).map((session) => (
                  <Link
                    key={session.id}
                    to="/app/board/sessions/$sid"
                    params={{ sid: session.id }}
                    className="block rounded border border-border bg-background px-3 py-2 hover:bg-muted"
                  >
                    {session.title}
                  </Link>
                ))
              )}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
