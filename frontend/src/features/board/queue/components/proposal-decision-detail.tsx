import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CreativeMaterialsReadonly } from "./creative-materials-readonly";
import { EditorRecommendationCard } from "./editor-recommendation-card";
import { ProposalSummaryCard } from "./proposal-summary-card";
import { RiskAssessmentCard } from "./risk-assessment-card";
import { VotingPanel } from "../../sessions/components/voting-panel";
import { VoteProgress } from "../../sessions/components/vote-progress";
import { DecisionHistory } from "@/entities/proposal";
import { EmptyState } from "@/shared/ui/empty-state";
import { VoteTally } from "@/entities/proposal";
import { useAuth } from "@/shared/auth";
import { useProposalQuery } from "@/features/proposals";
import { useBoardVotesQuery } from "../../api/board-queries";
import { useActiveVotingSession } from "../../api/use-active-voting-session";
import { getReVoteBanner } from "../../vote/model/revote-banner";
import { Skeleton } from "@/components/ui/skeleton";
import type { SeriesProposal, BoardVote } from "@/entities/proposal/model/proposal-types";

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
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!proposalRaw) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/app/board/queue"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/app/board/queue"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Board queue
      </Link>
      {reVoteBanner ? (
        <section
          className={`rounded-lg border p-4 ${
            reVoteBanner.kind === "fresh"
              ? "border-emerald-300 bg-emerald-50 text-emerald-950"
            : "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                Board workflow
              </p>
              <h2 className="mt-1 font-serif text-xl">{reVoteBanner.title}</h2>
              <p className="mt-1 text-xs opacity-80">{reVoteBanner.description}</p>
            </div>
            {activeVotingSession.session ? (
              <Link
                to="/app/board/sessions/$sid"
                params={{ sid: activeVotingSession.session.id }}
                className="shrink-0 rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90"
              >
                Open re-vote session
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <main className="space-y-4">
          <ProposalSummaryCard proposal={mergedProposal} />
          <CreativeMaterialsReadonly proposal={mergedProposal} />
          <EditorRecommendationCard proposal={mergedProposal} />
          <section className="grid gap-4 md:grid-cols-2">
            <RiskAssessmentCard proposal={mergedProposal} />
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Market Fit
              </p>
              <p className="mt-2 text-sm text-foreground/80">
                Genres: {(proposalRaw.genres ?? []).join(" / ")}. Audience:{" "}
                {proposalRaw.targetAudience}. Board should validate serialization risk before
                finalization.
              </p>
            </div>
          </section>
          <section className="rounded-md border border-border bg-card p-4">
            <VoteProgress
              proposal={mergedProposal}
              tally={votesData?.tally}
              eligible={votesData?.eligibleVoterIds?.length}
            />
          </section>
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
        </main>
        <aside>
          <VotingPanel proposal={mergedProposal} />
        </aside>
      </div>
    </div>
  );
}
