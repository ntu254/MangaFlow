import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Gavel,
  ShieldAlert,
  Users,
  Plus,
  Clock,
  Check,
  Crown,
  History,
  AlertTriangle,
  BookOpen,
  ChevronRight,
} from "lucide-react";

import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import {
  useBoardQueueQuery,
  useVotingSessionsQuery,
  useFinalizeDecisionMutation,
} from "../../api/board-queries";
import { useBoardDecisionHistoryQuery } from "../../decisions/api/decisions.queries";
import type { BoardQueueItem, AtRiskQueueItem } from "../../model/board-adapters";
import { PageHeader, PageSection, PageShell, SummaryGrid } from "@/shared/layout/page-layout";
import { StatCard } from "@/shared/ui/stat-card";
import { StatusPill } from "@/shared/ui/status-pill";
import { EmptyState } from "@/shared/ui/empty-state";

export function BoardDashboard() {
  const { data: queueItems = [], isLoading } = useBoardQueueQuery();
  const { data: sessions = [] } = useVotingSessionsQuery();
  const { data: historyItems = [] } = useBoardDecisionHistoryQuery();

  const finalizeMutation = useFinalizeDecisionMutation();

  // Split queue items into proposal items and at-risk items based on riskStatus
  const proposalItems = useMemo(
    () => queueItems.filter((item): item is BoardQueueItem => item.riskStatus !== "AT_RISK"),
    [queueItems],
  );

  const atRiskItems = useMemo(
    () => queueItems.filter((item): item is AtRiskQueueItem => item.riskStatus === "AT_RISK"),
    [queueItems],
  );

  const pending = useMemo(
    () => proposalItems.filter((item) => item.decisionStatus === "PENDING"),
    [proposalItems],
  );

  const needsFinalize = useMemo(
    () => proposalItems.filter((item) => item.canFinalize),
    [proposalItems],
  );

  const handleFinalize = async (item: BoardQueueItem) => {
    if (!item.votingSessionId) return;
    try {
      await finalizeMutation.mutateAsync({
        seriesId: item.seriesId,
        sessionId: item.votingSessionId,
        body: {
          decision: "APPROVED",
          note: "Finalized by Board Chair via Dashboard desk.",
        },
      });
    } catch (err) {
      console.error("Failed to finalize session:", err);
    }
  };

  return (
    <PageShell maxWidth="6xl" dashboardRole="board">
      <PageHeader
        eyebrow="Publishing Governance Desk"
        title="Board Dashboard"
        description="Executive proposal greenlights, at-risk series interventions, and quorum voting focus."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/app/board/sessions/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 transition-opacity"
            >
              <Plus className="size-3.5" /> New session
            </Link>
            <Link
              to="/app/board/queue"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
            >
              Open queue <ArrowRight className="size-3.5" />
            </Link>
            <Link
              to="/app/board/decisions"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <History className="size-3.5" /> Ledger
            </Link>
          </div>
        }
      />

      {/* Summary KPI Grid */}
      <SummaryGrid className="grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<FileText className="size-4" />}
          tone="warning"
          label="Pending Review"
          value={pending.length}
          hint={`${needsFinalize.length} ready to finalize`}
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
          label="Ready to Finalize"
          value={needsFinalize.length}
          hint="Quorum met"
        />
        <StatCard
          icon={<ShieldAlert className="size-4" />}
          tone={atRiskItems.length > 0 ? "danger" : "neutral"}
          label="At-Risk Series"
          value={atRiskItems.length}
          hint="Requires board action"
        />
        <StatCard
          icon={<Gavel className="size-4" />}
          tone="neutral"
          label="Active Sessions"
          value={sessions.length}
          hint="Quorum live"
        />
      </SummaryGrid>

      {/* Main 2-Column Operational Grid */}
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column: Decision Focus & At-Risk Reviews */}
        <div className="space-y-5">
          {/* Decision Focus */}
          <PageSection
            title="Decision Focus"
            description="Proposals awaiting board review, vote allocation, and greenlight finalization."
            contentClassName="p-4 space-y-3"
            action={
              <Link to="/app/board/queue" className="text-xs font-semibold underline text-muted-foreground hover:text-foreground">
                View queue ({pending.length})
              </Link>
            }
          >
            {isLoading ? (
              <p className="text-xs text-muted-foreground py-2 animate-pulse">Loading governance queue...</p>
            ) : pending.length === 0 ? (
              <EmptyState
                title="No proposals awaiting vote"
                description="The board queue is currently empty. All pitches have been processed."
              />
            ) : (
              <div className="space-y-2.5">
                {pending.slice(0, 5).map((item) => {
                  const summary = item.voteSummary || { approve: 0, reject: 0 };
                  const approveCount = summary.approve ?? 0;
                  const rejectCount = summary.reject ?? 0;
                  const voteCount = item.voteCount ?? approveCount + rejectCount;
                  const approvePct = voteCount > 0 ? Math.round((approveCount / BOARD_TOTAL) * 100) : 0;
                  const rejectPct = voteCount > 0 ? Math.round((rejectCount / BOARD_TOTAL) * 100) : 0;

                  return (
                    <div
                      key={item.id}
                      className={`rounded border p-3.5 transition-colors space-y-2.5 ${
                        item.canFinalize
                          ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {item.canFinalize ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-500/20">
                                <Check className="size-2.5" /> Quorum Met
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-500/20">
                                Awaiting Votes
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-muted-foreground uppercase truncate">
                              {item.genres?.slice(0, 2).join(" / ") || "Proposal"}
                            </span>
                          </div>

                          <Link
                            to="/app/board/proposals/$proposalId"
                            params={{ proposalId: item.id }}
                            className="font-serif font-semibold text-sm text-foreground hover:underline block truncate mt-1"
                          >
                            {item.seriesTitle || item.title}
                          </Link>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.canFinalize ? (
                            <button
                              onClick={() => handleFinalize(item)}
                              disabled={finalizeMutation.isPending}
                              className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-2xs"
                            >
                              <Check className="size-3.5" /> Finalize
                            </button>
                          ) : (
                            <Link
                              to="/app/board/proposals/$proposalId"
                              params={{ proposalId: item.id }}
                              className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                            >
                              Review & Vote <ChevronRight className="size-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Vote Progress Bar */}
                      <div className="space-y-1 pt-1 border-t border-border/40">
                        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-600 font-semibold">Approve {approveCount}</span>
                            <span>·</span>
                            <span className="text-rose-600 font-semibold">Reject {rejectCount}</span>
                          </span>
                          <span className="font-semibold text-foreground">
                            {voteCount}/{BOARD_TOTAL} Votes Cast
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 transition-all duration-300"
                            style={{ width: `${approvePct}%` }}
                            title={`Approve: ${approveCount}`}
                          />
                          <div
                            className="bg-rose-500 transition-all duration-300"
                            style={{ width: `${rejectPct}%` }}
                            title={`Reject: ${rejectCount}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PageSection>

          {/* At-Risk Series Reviews */}
          <PageSection
            title="At-Risk Reviews"
            description="Ongoing series flagged for critical ranking drop, reader score decline, or missed deadlines."
            contentClassName="p-4 space-y-3"
            action={
              <Link to="/app/board/queue" className="text-xs font-semibold underline text-muted-foreground hover:text-foreground">
                View at-risk queue
              </Link>
            }
          >
            {atRiskItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">No series currently flagged as at-risk.</p>
            ) : (
              <div className="space-y-2">
                {atRiskItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded border border-rose-500/20 bg-rose-500/5 p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {item.seriesTitle || item.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Status: {item.seriesStatus || "ONGOING"} · Source Period: {item.riskSourceRankingPeriod || "#4"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill status="at_risk" />
                      <Link
                        to="/app/board/queue"
                        className="rounded border border-border bg-background px-2 py-1 text-[10px] font-semibold hover:bg-muted transition-colors"
                      >
                        Action
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageSection>
        </div>

        {/* Right Column: Sessions, Ledger & Quorum Info */}
        <div className="space-y-5">
          {/* Active Voting Sessions */}
          <PageSection
            title="Recent sessions"
            description="Latest board voting sessions and active quorum tracking."
            contentClassName="p-4"
            action={
              <Link to="/app/board/sessions/new" className="text-xs font-semibold underline text-muted-foreground hover:text-foreground">
                + New
              </Link>
            }
          >
            <div className="space-y-2 text-xs">
              {sessions.length === 0 ? (
                <p className="text-muted-foreground py-1">No voting sessions yet.</p>
              ) : (
                sessions.slice(0, 4).map((session) => (
                  <Link
                    key={session.id}
                    to="/app/board/sessions/$sid"
                    params={{ sid: session.id }}
                    className="flex items-center justify-between gap-2 rounded border border-border bg-background px-3 py-2.5 hover:bg-muted transition-colors"
                  >
                    <span className="font-medium truncate">{session.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 flex items-center gap-1">
                      <Clock className="size-3" /> {session.status || "ACTIVE"}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </PageSection>

          {/* Governance Ledger */}
          <PageSection
            title="Governance ledger"
            description="Recent official board determinations and signed greenlights."
            contentClassName="p-4"
            action={
              <Link to="/app/board/decisions" className="text-xs font-semibold underline text-muted-foreground hover:text-foreground">
                Full ledger
              </Link>
            }
          >
            <div className="space-y-2 text-xs">
              {historyItems.length === 0 ? (
                <p className="text-muted-foreground py-1">No decision history recorded.</p>
              ) : (
                historyItems.slice(0, 4).map((history) => (
                  <div
                    key={history.id}
                    className="flex items-center justify-between gap-2 rounded border border-border bg-background px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{history.title}</p>
                      <p className="text-[10px] text-muted-foreground">{history.type || "Decision"}</p>
                    </div>
                    <StatusPill status={history.status?.toLowerCase() === "approved" ? "approved" : "rejected"} />
                  </div>
                ))
              )}
            </div>
          </PageSection>

          {/* Board Quorum Rules */}
          <PageSection
            title="Board Quorum & Policy"
            description="Governance rules for MangaFlow publishing board."
            contentClassName="p-4 space-y-2.5 text-xs"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5 text-muted-foreground" /> Total Seat Allocation
              </span>
              <span className="font-mono font-semibold text-foreground">{BOARD_TOTAL} Seats</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Crown className="size-3.5 text-muted-foreground" /> Minimum Quorum Required
              </span>
              <span className="font-mono font-semibold text-foreground">3 Affirmative Votes</span>
            </div>
          </PageSection>
        </div>
      </section>
    </PageShell>
  );
}
