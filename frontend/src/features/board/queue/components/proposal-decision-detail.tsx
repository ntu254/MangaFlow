import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, FileText, Vote, UserCheck, History } from "lucide-react";
import { CreativeMaterialsReadonly } from "./creative-materials-readonly";
import { EditorRecommendationCard } from "./editor-recommendation-card";
import { ProposalSummaryCard } from "./proposal-summary-card";
import { RiskAssessmentCard } from "./risk-assessment-card";
import { VotingPanel } from "../../sessions/components/voting-panel";
import { VoteProgress } from "../../sessions/components/vote-progress";
import { DecisionHistory } from "@/entities/proposal";
import { EmptyState } from "@/shared/ui/empty-state";
import { VoteTally, ProposalStatusPill } from "@/entities/proposal";
import { useAuth } from "@/shared/auth";
import { useProposalQuery } from "@/features/proposals";
import { useBoardVotesQuery } from "../../api/board-queries";
import { useActiveVotingSession } from "../../api/use-active-voting-session";
import { getReVoteBanner } from "../../vote/model/revote-banner";
import { Skeleton } from "@/components/ui/skeleton";
import type { SeriesProposal, BoardVote } from "@/entities/proposal/model/proposal-types";
import { AUDIENCE_LABEL } from "@/entities/proposal/model/proposal-types";
import { evaluateBoardTally } from "@/entities/proposal/model/board-tally";
import { ResolvedImage } from "@/shared/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MergedProposal extends Omit<SeriesProposal, "votes"> {
  votes: BoardVote[];
}

export function ProposalDecisionDetail({ proposalId }: { proposalId: string }) {
  const user = useAuth((s) => s.user);
  const { data: proposalRaw, isLoading: proposalLoading } = useProposalQuery(proposalId);
  const { data: votesData, isLoading: votesLoading } = useBoardVotesQuery(proposalId);
  const activeVotingSession = useActiveVotingSession(proposalId);

  if (!user) return null;

  if (proposalLoading || votesLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!proposalRaw) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Link
          to="/app/board/queue"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Board queue
        </Link>
        <EmptyState
          title="Proposal not found"
          description="An error occurred while loading the proposal from the server."
        />
      </div>
    );
  }

  const votes: BoardVote[] = votesData?.votes ?? [];
  const mergedProposal: MergedProposal = {
    ...proposalRaw,
    votes,
  };
  const reVoteBanner = getReVoteBanner(activeVotingSession.session);
  const latestMs = proposalRaw.manuscripts?.[proposalRaw.manuscripts.length - 1];
  const materialsCount = (proposalRaw.manuscripts?.length ?? 0) + (proposalRaw.materials?.length ?? 0) + (proposalRaw.sampleChapterUrl ? 1 : 0);

  const quorum = votesData?.quorum ?? 3;
  const eligible = votesData?.eligibleVoterIds?.length ?? 5;
  const tally = votesData?.tally ?? evaluateBoardTally(votes, quorum, eligible);
  const approveCount = tally.approve;
  const rejectCount = tally.reject;
  const totalVotesCast = votes.length;
  const approvePct = Math.min(100, Math.round((approveCount / (eligible || 1)) * 100));
  const rejectPct = Math.min(100, Math.round((rejectCount / (eligible || 1)) * 100));

  return (
    <div className="mx-auto max-w-6xl space-y-6 overflow-x-hidden p-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/app/board/queue"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Board Queue</span>
        </Link>
      </div>

      {/* Re-vote workflow banner */}
      {reVoteBanner ? (
        <section
          className={`rounded-2xl border p-5 shadow-xs backdrop-blur-md ${
            reVoteBanner.kind === "fresh"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
              : "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-950 dark:text-fuchsia-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                Board Workflow Event
              </p>
              <h2 className="mt-0.5 font-serif text-lg font-bold">{reVoteBanner.title}</h2>
              <p className="mt-1 text-xs opacity-90 leading-relaxed">{reVoteBanner.description}</p>
            </div>
            {activeVotingSession.session ? (
              <Link
                to="/app/board/sessions/$sid"
                params={{ sid: activeVotingSession.session.id }}
                className="shrink-0 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90 shadow-xs"
              >
                Open Re-vote Session
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Executive Board Pitch Header Banner */}
      <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 shadow-xs backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
            {/* Proposal Cover Image */}
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted shadow-xs ring-1 ring-border/40 sm:h-32 sm:w-22">
              <ResolvedImage
                fileKey={proposalRaw.coverFileKey}
                fallbackUrl={proposalRaw.coverUrl}
                alt={proposalRaw.title}
                className="size-full object-cover transition-transform duration-300 hover:scale-105"
                fallback={
                  <div className="grid size-full place-items-center bg-primary/10 font-serif text-2xl font-bold text-primary">
                    {(proposalRaw.title || "?").slice(0, 1).toUpperCase()}
                  </div>
                }
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Executive Board Dossier
                </span>
                <span className="rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  v{latestMs?.version ?? "1.0"}
                </span>
                {proposalRaw.chaptersPlanned ? (
                  <span className="rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {proposalRaw.chaptersPlanned} chapters planned
                  </span>
                ) : null}
              </div>

              <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {proposalRaw.title}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{proposalRaw.authorName}</span>
                <span>•</span>
                <span className="rounded-lg border border-border/60 bg-background/50 px-2 py-0.5 font-medium text-foreground">
                  {AUDIENCE_LABEL[proposalRaw.targetAudience]}
                </span>
                <span>•</span>
                <div className="flex flex-wrap gap-1">
                  {proposalRaw.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <ProposalStatusPill status={proposalRaw.status} />
          </div>
        </div>

        {/* Voting Progress Strip inside Header */}
        <div className="mt-4 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">Board Voting Progress</span>
            <span className="text-muted-foreground text-[11px] truncate">
              • {tally.reason}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {totalVotesCast}/{eligible}
            </span>
            <div className="flex h-2.5 w-36 overflow-hidden rounded-full bg-muted/80">
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${approvePct}%` }}
                title={`Approve: ${approveCount} (${approvePct}%)`}
              />
              <div
                className="bg-rose-500 transition-all duration-300"
                style={{ width: `${rejectPct}%` }}
                title={`Reject: ${rejectCount} (${rejectPct}%)`}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Workbench Grid (7:5 Split) */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        {/* Left Column: Tabbed Board Workspace + Editor Recommendation */}
        <section className="min-w-0 space-y-4">
          <Tabs defaultValue="dossier" className="w-full">
            <div className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs backdrop-blur-md space-y-5">
              <TabsList className="grid w-full grid-cols-3 h-10 rounded-xl bg-muted/60 p-1">
                <TabsTrigger value="dossier" className="flex items-center gap-1.5 text-xs font-semibold rounded-lg">
                  <BookOpen className="size-3.5 shrink-0" />
                  <span>Dossier</span>
                </TabsTrigger>
                <TabsTrigger value="materials" className="flex items-center gap-1.5 text-xs font-semibold rounded-lg">
                  <FileText className="size-3.5 shrink-0" />
                  <span>Materials ({materialsCount})</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs font-semibold rounded-lg">
                  <History className="size-3.5 shrink-0" />
                  <span>Decision Milestones</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Story Dossier */}
              <TabsContent value="dossier" className="mt-0 focus-visible:outline-none">
                <ProposalSummaryCard proposal={mergedProposal} />
              </TabsContent>

              {/* Tab 2: Creative Materials & Manuscripts */}
              <TabsContent value="materials" className="mt-0 focus-visible:outline-none">
                <CreativeMaterialsReadonly proposal={mergedProposal} />
              </TabsContent>

              {/* Tab 3: Vote Audit & History */}
              <TabsContent value="audit" className="mt-0 space-y-4 focus-visible:outline-none">
                <VoteTally
                  votes={votes}
                  status={proposalRaw.status}
                  tally={votesData?.tally}
                  quorum={votesData?.quorum}
                  eligible={votesData?.eligibleVoterIds?.length}
                />
                <DecisionHistory
                  proposal={mergedProposal}
                  tally={votesData?.tally}
                  quorum={votesData?.quorum}
                  eligible={votesData?.eligibleVoterIds?.length}
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Editor Recommendation Note (Placed below Tabs) */}
          <EditorRecommendationCard proposal={mergedProposal} />
        </section>

        {/* Right Column: Sticky Executive Voting Sidebar */}
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <VotingPanel proposal={mergedProposal} />
        </aside>
      </div>
    </div>
  );
}

