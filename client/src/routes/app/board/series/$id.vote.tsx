import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ClipboardList, Vote } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AuditTimeline } from "@/shared/ui/site/AuditTimeline";
import { useRole } from "@/shared/lib/role";
import { canBoardVote } from "@/shared/lib/permissions";
import { seriesApi, type PublicationType } from "@/shared/api/series";
import {
  useBoardReviewQueue,
  useCastBoardVote,
  useFinalizeBoardDecision,
  useTieBreakBoardDecision,
} from "@/shared/queries/useBoardReview";
import type { BoardVoteSummary, BoardVoteValue } from "@/shared/api/board";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalCard,
  PortalMetric,
  PortalNotice,
  PortalPill,
} from "@/features/board/components/DecisionPortal";

export const Route = createFileRoute("/app/board/series/$id/vote")({
  component: BoardVotePage,
});

const voteOptions: Array<{ label: string; value: BoardVoteValue }> = [
  { label: "Approve", value: "APPROVE" },
  { label: "Reject", value: "REJECT" },
  { label: "Needs revision", value: "NEEDS_REVISION" },
];

function pluralityVote(summary?: BoardVoteSummary): BoardVoteValue | "TIE_BREAK_REQUIRED" | null {
  if (!summary) return null;
  const entries = Object.entries(summary) as Array<[BoardVoteValue, number]>;
  const max = Math.max(...entries.map(([, count]) => count));
  if (max <= 0) return null;
  const winners = entries.filter(([, count]) => count === max);
  return winners.length === 1 ? winners[0][0] : "TIE_BREAK_REQUIRED";
}

function BoardVotePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { role } = useRole();
  const { data: series, isLoading: isSeriesLoading } = useQuery({
    queryKey: ["series", id],
    queryFn: () => seriesApi.get(id),
  });
  const { data: queue = [] } = useBoardReviewQueue();
  const queueItem = useMemo(() => queue.find((item) => item.id === id), [queue, id]);

  const castVoteMutation = useCastBoardVote(id);
  const finalizeMutation = useFinalizeBoardDecision(id);
  const tieBreakMutation = useTieBreakBoardDecision(id);

  const [vote, setVote] = useState<BoardVoteValue>("APPROVE");
  const [pubType, setPubType] = useState<PublicationType>("WEEKLY");
  const [comment, setComment] = useState("");
  const [isChair, setIsChair] = useState(false);

  if (isSeriesLoading || !series) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">Loading Board review...</div>
    );
  }

  const perm = canBoardVote(role, series);
  const isTieBreak = queueItem?.decisionStatus === "TIE_BREAK_REQUIRED";
  const boardResult = isTieBreak ? vote : pluralityVote(queueItem?.voteSummary);
  const isSubmitting =
    castVoteMutation.isPending || finalizeMutation.isPending || tieBreakMutation.isPending;

  async function castVote() {
    if (!perm.allowed) return toast.error(perm.reason);
    const note = comment.trim();
    if (!note) return toast.error("Add a comment.");
    await castVoteMutation.mutateAsync({ value: vote, note });
    setComment("");
  }

  async function finalize() {
    if (!perm.allowed) return toast.error(perm.reason);
    if (!isTieBreak && !queueItem?.canFinalize)
      return toast.error("Not enough Board votes to finalize.");
    if (boardResult === "APPROVE" && !pubType)
      return toast.error("Approve requires publicationType.");

    const payload = {
      publicationType: boardResult === "APPROVE" ? pubType : undefined,
      note: comment.trim() || undefined,
    };

    if (isTieBreak) {
      await tieBreakMutation.mutateAsync({ value: vote, ...payload });
    } else {
      await finalizeMutation.mutateAsync(payload);
    }

    router.navigate({ to: "/app/board/series-review" });
  }

  return (
    <DecisionPortalShell
      active="/app/board/voting-sessions"
      title={series.title}
      eyebrow="Voting panel"
      description={
        <Link
          to="/app/board/series-review"
          className="inline-flex items-center gap-2 text-primary underline-offset-2 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to review workspace
        </Link>
      }
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={2} />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.42fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <PortalMetric
              icon={Vote}
              label="Quorum"
              value={queueItem ? `${queueItem.voteCount}/${queueItem.quorum}` : "0/0"}
              hint="Submitted Board votes"
            />
            <PortalMetric
              icon={ClipboardList}
              label="Current result"
              value={boardResult ?? "Pending"}
              hint={queueItem?.decisionStatus ?? "No active session"}
            />
            <PortalMetric
              icon={CheckCircle2}
              label="Eligible"
              value={String(queueItem?.eligibleBoardCount ?? 0)}
              hint="Board members"
            />
          </div>

          <PortalCard
            title="Proposal evidence"
            description="Read the proposal context before casting a vote."
          >
            <div className="space-y-4 p-5">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Synopsis
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {series.synopsis || "No synopsis provided for this proposal."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PortalPill tone="primary">{series.status}</PortalPill>
                {queueItem ? (
                  <PortalPill tone={queueItem.canFinalize ? "success" : "neutral"}>
                    {queueItem.decisionStatus}
                  </PortalPill>
                ) : null}
              </div>
            </div>
          </PortalCard>

          <PortalCard title="Cast vote" description="Submit your Board vote with a decision note.">
            {!perm.allowed && (
              <div className="p-5 pb-0">
                <PortalNotice>{perm.reason}</PortalNotice>
              </div>
            )}
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                {voteOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVote(option.value)}
                    className={`h-9 rounded-md px-3 text-xs font-semibold transition active:translate-y-px ${
                      vote === option.value
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-foreground/5"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {vote === "APPROVE" && (
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Publication type
                  </label>
                  <div className="flex gap-2">
                    {(["WEEKLY", "MONTHLY"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPubType(value)}
                        className={`h-8 rounded-md px-3 text-xs font-semibold transition active:translate-y-px ${
                          pubType === value
                            ? "bg-primary text-primary-foreground"
                            : "border border-border hover:bg-foreground/5"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Decision note, evidence, or revision reason..."
                rows={4}
                className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary/60"
              />

              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={isChair}
                    onChange={(event) => setIsChair(event.target.checked)}
                  />
                  Acting as Board Chair
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={castVote}
                    disabled={!perm.allowed || isSubmitting}
                    className="h-9 rounded-md border border-border px-3 text-xs font-semibold transition hover:bg-foreground/5 disabled:opacity-50"
                  >
                    Cast vote
                  </button>
                  <button
                    type="button"
                    onClick={finalize}
                    disabled={
                      !perm.allowed ||
                      !isChair ||
                      isSubmitting ||
                      (!queueItem?.canFinalize && !isTieBreak)
                    }
                    className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {isTieBreak ? "Tie-break as Chair" : "Finalize as Chair"}
                  </button>
                </div>
              </div>
            </div>
          </PortalCard>
        </div>

        <div className="space-y-5">
          <PortalCard title="Vote ledger" description="Live Board decision count.">
            {queueItem ? (
              <div className="space-y-3 p-4 text-sm">
                <VoteLine label="Approve" value={queueItem.voteSummary.APPROVE} />
                <VoteLine label="Reject" value={queueItem.voteSummary.REJECT} />
                <VoteLine label="Needs revision" value={queueItem.voteSummary.NEEDS_REVISION} />
                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                  Eligible Board members: {queueItem.eligibleBoardCount}
                </div>
              </div>
            ) : (
              <div className="p-4 text-xs text-muted-foreground">
                No active Board session summary.
              </div>
            )}
          </PortalCard>
          <AuditTimeline entity="series" entityId={series.id} limit={10} />
        </div>
      </section>
    </DecisionPortalShell>
  );
}

function VoteLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-foreground/5 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}
