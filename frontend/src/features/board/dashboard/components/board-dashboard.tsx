import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { useBoardQueueQuery, useVotingSessionsQuery } from "../../api/board-queries";
import type { BoardQueueItem } from "../../model/board-adapters";
import { PageHeader } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatCard } from "@/shared/ui/stat-card";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, FileText } from "lucide-react";
import { PageSection, PageShell, SummaryGrid } from "@/shared/layout/page-layout";

export function BoardDashboard() {
  const { data: queueItems = [], isLoading } = useBoardQueueQuery();
  const { data: sessions = [] } = useVotingSessionsQuery();

  const proposalItems = queueItems.filter(
    (item): item is BoardQueueItem => item.riskStatus !== "AT_RISK",
  );

  const pending = proposalItems.filter((item) => item.decisionStatus === "PENDING");
  const needsFinalize = proposalItems.filter((item) => item.canFinalize);

  return (
    <PageShell maxWidth="6xl" dashboardRole="board">
      <PageHeader
        eyebrow="Governance"
        title="Board dashboard"
        description="Final proposal governance and at-risk review focus."
      />

      <SummaryGrid className="gap-3 md:grid-cols-2">
        <StatCard
          icon={<FileText className="size-4" />}
          label="Pending Review"
          value={pending.length}
          tone="warning"
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          label="Needs Finalize"
          value={needsFinalize.length}
          tone="warning"
        />
      </SummaryGrid>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <PageSection
          title="Decision Focus"
          description="Proposals awaiting board review and decision."
          contentClassName="p-5"
          action={
            <Link to="/app/board/queue" className="text-xs font-semibold underline">
              Open queue
            </Link>
          }
        >
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : pending.length === 0 ? (
            <EmptyState
              title="No proposals awaiting vote"
              description="The board queue is currently empty."
            />
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to="/app/board/proposals/$proposalId"
                  params={{ proposalId: item.id }}
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
        </PageSection>

        <div className="space-y-4">
          <PageSection
            title="Recent sessions"
            description="Latest board voting sessions."
            contentClassName="p-5"
          >
            <div className="mt-3 space-y-2 text-xs">
              {sessions.length === 0 ? (
                <p className="text-muted-foreground">No voting sessions yet.</p>
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
          </PageSection>
        </div>
      </section>
    </PageShell>
  );
}
