import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Gavel,
  Users,
  Plus,
  Clock,
  Check,
  Crown,
  History,
  ChevronRight,
  Sparkles,
  BarChart3,
  TrendingUp,
} from "lucide-react";

import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import {
  useBoardQueueQuery,
  useVotingSessionsQuery,
  useFinalizeDecisionMutation,
} from "../../api/board-queries";
import { useBoardDecisionHistoryQuery } from "../../decisions/api/decisions.queries";
import { useRankingsListQuery } from "@/entities/series";
import type { BoardQueueItem } from "../../model/board-adapters";
import { PageHeader, PageSection, PageShell, SummaryGrid } from "@/shared/layout/page-layout";
import { StatCard } from "@/shared/ui/stat-card";
import { StatusPill } from "@/shared/ui/status-pill";
import { EmptyState } from "@/shared/ui/empty-state";

export function BoardDashboard() {
  const { data: queueItems = [], isLoading } = useBoardQueueQuery();
  const { data: sessions = [] } = useVotingSessionsQuery();
  const { data: historyItems = [] } = useBoardDecisionHistoryQuery();
  const { data: rankings = [] } = useRankingsListQuery();

  const finalizeMutation = useFinalizeDecisionMutation();

  // Split queue items into proposal items
  const proposalItems = useMemo(
    () => queueItems.filter((item): item is BoardQueueItem => item.riskStatus !== "AT_RISK"),
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

  // Top ranked series list sorted by final score
  const topRankedSeries = useMemo(() => {
    return [...rankings]
      .sort((a, b) => (b.finalScore ?? b.readerScore ?? 0) - (a.finalScore ?? a.readerScore ?? 0))
      .slice(0, 4);
  }, [rankings]);

  // Genre distribution map from proposal items
  const genreStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    proposalItems.forEach((item) => {
      (item.genres || ["Uncategorized"]).forEach((g) => {
        counts[g] = (counts[g] || 0) + 1;
        total += 1;
      });
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    return { sorted, total: total || 1 };
  }, [proposalItems]);

  const handleFinalize = async (item: BoardQueueItem) => {
    if (!item.votingSessionId) return;
    try {
      await finalizeMutation.mutateAsync({
        seriesId: item.seriesId,
        sessionId: item.votingSessionId,
        body: {
          decision: "APPROVED",
          note: "Finalized by Board Chair via Executive Dashboard Desk.",
        },
      });
    } catch (err) {
      console.error("Failed to finalize session:", err);
    }
  };

  return (
    <PageShell maxWidth="6xl" dashboardRole="board">
      <PageHeader
        title="Board Governance & Greenlights"
        description="Executive proposal determinations, serialization performance analytics, and publishing quorum monitoring."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/app/board/sessions/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-xs font-bold text-background hover:opacity-90 transition-all shadow-xs"
            >
              <Plus className="size-3.5" /> New Session
            </Link>
            <Link
              to="/app/board/queue"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              Open Queue <ArrowRight className="size-3.5" />
            </Link>
            <Link
              to="/app/board/rankings"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              <BarChart3 className="size-3.5" /> Rankings
            </Link>
            <Link
              to="/app/board/decisions"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              <History className="size-3.5" /> Ledger
            </Link>
          </div>
        }
      />

      {/* Summary KPI Grid */}
      <SummaryGrid className="grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatCard
          icon={<FileText className="size-4" />}
          tone="warning"
          label="Pending Proposals"
          value={pending.length}
          hint={`${needsFinalize.length} ready to finalize`}
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
          label="Quorum Met & Ready"
          value={needsFinalize.length}
          hint="Ready for final signoff"
        />
        <StatCard
          icon={<Gavel className="size-4" />}
          tone="neutral"
          label="Active Sessions"
          value={sessions.length}
          hint="Live quorum tracking"
        />
        <StatCard
          icon={<History className="size-4" />}
          tone="neutral"
          label="Signed Determinations"
          value={historyItems.length}
          hint="Archived in ledger"
        />
      </SummaryGrid>

      {/* Perfectly Balanced 50-50 2-Column Operational Grid */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Left Column (50%) */}
        <div className="space-y-6">
          {/* Decision Focus */}
          <PageSection
            title="Decision Focus"
            description="Proposals awaiting board review, vote allocation, and greenlight finalization."
            contentClassName="p-4 space-y-3"
            action={
              <Link
                to="/app/board/queue"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                View full queue ({pending.length}) <ChevronRight className="size-3" />
              </Link>
            }
          >
            {isLoading ? (
              <div className="py-8 text-center text-xs font-medium text-muted-foreground animate-pulse">
                Loading governance queue...
              </div>
            ) : pending.length === 0 ? (
              <EmptyState
                title="No proposals awaiting vote"
                description="The publishing governance queue is clear. All submitted proposals have been processed."
              />
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 4).map((item) => {
                  const summary = item.voteSummary || { approve: 0, reject: 0 };
                  const approveCount = summary.approve ?? 0;
                  const rejectCount = summary.reject ?? 0;
                  const voteCount = item.voteCount ?? approveCount + rejectCount;
                  const approvePct = voteCount > 0 ? Math.round((approveCount / BOARD_TOTAL) * 100) : 0;
                  const rejectPct = voteCount > 0 ? Math.round((rejectCount / BOARD_TOTAL) * 100) : 0;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition-all space-y-3 ${
                        item.canFinalize
                          ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-xs hover:border-emerald-500/60"
                          : "border-border/80 bg-card hover:border-primary/40 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.canFinalize ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-500/20">
                                <Sparkles className="size-3" /> Quorum Met · Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                Awaiting Votes
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-muted-foreground uppercase truncate">
                              {item.genres?.slice(0, 2).join(" / ") || "Manga Proposal"}
                            </span>
                          </div>

                          <Link
                            to="/app/board/proposals/$proposalId"
                            params={{ proposalId: item.id }}
                            className="font-serif font-bold text-base text-foreground hover:text-primary transition-colors block truncate"
                          >
                            {item.seriesTitle || item.title}
                          </Link>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.canFinalize ? (
                            <button
                              type="button"
                              onClick={() => handleFinalize(item)}
                              disabled={finalizeMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Check className="size-3.5" /> Finalize
                            </button>
                          ) : (
                            <Link
                              to="/app/board/proposals/$proposalId"
                              params={{ proposalId: item.id }}
                              className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
                            >
                              Review & Vote <ChevronRight className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Vote Progress Bar */}
                      <div className="space-y-1.5 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-2 font-medium">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Approve: {approveCount}
                            </span>
                            <span className="text-muted-foreground/60">·</span>
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              Reject: {rejectCount}
                            </span>
                          </span>
                          <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider">
                            {voteCount}/{BOARD_TOTAL} Seats Cast
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden flex">
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

          {/* Governance Ledger */}
          <PageSection
            title="Governance Ledger"
            description="Recent official determinations and signed greenlights."
            contentClassName="p-4"
            action={
              <Link
                to="/app/board/decisions"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                Full ledger <ChevronRight className="size-3" />
              </Link>
            }
          >
            <div className="space-y-2 text-xs">
              {historyItems.length === 0 ? (
                <p className="text-muted-foreground py-2 text-center">No decision history recorded.</p>
              ) : (
                historyItems.slice(0, 4).map((history) => (
                  <div
                    key={history.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{history.title}</p>
                      <p className="text-[10px] text-muted-foreground">{history.type || "Board Decision"}</p>
                    </div>
                    <StatusPill status={history.status?.toLowerCase() === "approved" ? "approved" : "rejected"} />
                  </div>
                ))
              )}
            </div>
          </PageSection>
        </div>

        {/* Right Column (50%) */}
        <div className="space-y-6">
          {/* Genre Portfolio Balance Widget */}
          <PageSection
            title="Genre Portfolio Balance"
            description="Distribution of serialized works across target genres."
            contentClassName="p-4 space-y-3"
          >
            {genreStats.sorted.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-1">No genre data available.</p>
            ) : (
              <div className="space-y-2.5">
                {genreStats.sorted.map(([genre, count]) => {
                  const pct = Math.round((count / genreStats.total) * 100);
                  return (
                    <div key={genre} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{genre}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PageSection>

          {/* Serialization Performance Leaderboard */}
          <PageSection
            title="Serialization Performance Leaderboard"
            description="Reader reception, score tracking, and magazine placement rankings across published series."
            contentClassName="p-4 space-y-3"
            action={
              <Link
                to="/app/board/rankings"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                View full rankings ({rankings.length}) <ChevronRight className="size-3" />
              </Link>
            }
          >
            {topRankedSeries.length === 0 ? (
              <div className="py-4 text-center text-xs font-medium text-muted-foreground rounded-xl border border-dashed border-border/70 p-4">
                No ranking data available yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {topRankedSeries.map((series, idx) => (
                  <div
                    key={series.id || idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-2xs hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`grid size-7 place-items-center rounded-lg text-xs font-black shrink-0 ${
                          idx === 0
                            ? "bg-amber-500 text-white shadow-2xs"
                            : idx === 1
                              ? "bg-slate-300 text-slate-900"
                              : idx === 2
                                ? "bg-amber-700 text-white"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        #{idx + 1}
                      </span>

                      <div className="min-w-0 space-y-0.5">
                        <p className="font-serif font-bold text-sm text-foreground truncate">
                          {series.seriesTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Period: <span className="font-semibold text-foreground">{series.period}</span> · Score:{" "}
                          <span className="font-semibold text-primary">{series.finalScore ?? series.readerScore ?? "—"} pts</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                        <TrendingUp className="size-3" /> {(series.voteCount ?? 0).toLocaleString()} votes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageSection>

          {/* Active Voting Sessions */}
          <PageSection
            title="Recent Sessions"
            description="Latest board voting sessions and active quorum tracking."
            contentClassName="p-4"
            action={
              <Link
                to="/app/board/sessions/new"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                + New <ChevronRight className="size-3" />
              </Link>
            }
          >
            <div className="space-y-2 text-xs">
              {sessions.length === 0 ? (
                <p className="text-muted-foreground py-2 text-center">No voting sessions created yet.</p>
              ) : (
                sessions.slice(0, 4).map((session) => (
                  <Link
                    key={session.id}
                    to="/app/board/sessions/$sid"
                    params={{ sid: session.id }}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card p-3 hover:border-primary/40 transition-all shadow-2xs"
                  >
                    <span className="font-bold text-foreground truncate">{session.title}</span>
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0 flex items-center gap-1 rounded bg-muted px-2 py-0.5 uppercase">
                      <Clock className="size-3" /> {session.status || "ACTIVE"}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </PageSection>

          {/* Board Quorum Rules */}
          <PageSection
            title="Board Quorum & Policy"
            description="Official governance rules for MangaFlow publishing determinations."
            contentClassName="p-4 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between text-muted-foreground rounded-lg border border-border/60 bg-muted/20 p-2.5">
              <span className="flex items-center gap-2 font-medium">
                <Users className="size-4 text-primary" /> Total Seat Allocation
              </span>
              <span className="font-mono font-bold text-foreground">{BOARD_TOTAL} Seats</span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground rounded-lg border border-border/60 bg-muted/20 p-2.5">
              <span className="flex items-center gap-2 font-medium">
                <Crown className="size-4 text-amber-500" /> Minimum Quorum Required
              </span>
              <span className="font-mono font-bold text-foreground">3 Affirmative Votes</span>
            </div>
          </PageSection>
        </div>
      </section>
    </PageShell>
  );
}
