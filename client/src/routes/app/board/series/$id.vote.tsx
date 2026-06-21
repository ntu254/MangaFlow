import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/layouts/AppShell";
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
      <div className="p-8 text-center text-sm text-foreground/55">Loading Board review...</div>
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
    <div className="max-w-5xl mx-auto grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <PageHeader
          title={series.title}
          jp="Board vote"
          description={
            <Link to="/app/board/series-review" className="underline-offset-2 hover:underline">
              ← Board queue
            </Link>
          }
        />

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          {!perm.allowed && (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              {perm.reason}
            </div>
          )}
          <div className="mb-3 text-[10px] uppercase tracking-wider text-foreground/55">
            Your vote
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {voteOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setVote(option.value)}
                className={`h-8 rounded-md px-3 text-xs font-bold ${
                  vote === option.value
                    ? "bg-foreground text-background"
                    : "border border-foreground/15 hover:bg-foreground/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {vote === "APPROVE" && (
            <div className="mb-3">
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-foreground/55">
                Publication type (required for approval)
              </label>
              <div className="flex gap-2">
                {(["WEEKLY", "MONTHLY"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setPubType(value)}
                    className={`h-8 rounded-md px-3 text-xs font-bold ${
                      pubType === value
                        ? "bg-emerald-600 text-white"
                        : "border border-foreground/15 hover:bg-foreground/5"
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
            placeholder="Comment..."
            rows={3}
            className="w-full rounded-md border border-foreground/15 bg-background p-3 text-sm"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={isChair}
                onChange={(event) => setIsChair(event.target.checked)}
              />
              I am acting as Board Chair (finalize decision)
            </label>
            <div className="flex gap-2">
              <button
                onClick={castVote}
                disabled={!perm.allowed || isSubmitting}
                className="h-9 rounded-md border border-foreground/20 px-3 text-xs font-bold disabled:opacity-50"
              >
                Cast vote
              </button>
              <button
                onClick={finalize}
                disabled={
                  !perm.allowed ||
                  !isChair ||
                  isSubmitting ||
                  (!queueItem?.canFinalize && !isTieBreak)
                }
                className="h-9 rounded-md bg-foreground px-4 text-xs font-bold text-background disabled:opacity-50"
              >
                {isTieBreak ? "Tie-break as Chair" : "Finalize as Chair"}
              </button>
            </div>
          </div>
          {queueItem && (
            <div className="mt-3 text-xs text-foreground/55">
              Quorum: {queueItem.voteCount}/{queueItem.quorum}. Decision: {queueItem.decisionStatus}
              .
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-md border border-foreground/10 bg-card p-4">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-foreground/55">
            Vote summary
          </div>
          {queueItem ? (
            <div className="space-y-2 text-xs">
              <div>Approve: {queueItem.voteSummary.APPROVE}</div>
              <div>Reject: {queueItem.voteSummary.REJECT}</div>
              <div>Needs revision: {queueItem.voteSummary.NEEDS_REVISION}</div>
              <div className="pt-2 text-foreground/55">
                Eligible Board members: {queueItem.eligibleBoardCount}
              </div>
            </div>
          ) : (
            <div className="text-xs text-foreground/55">No active Board session summary.</div>
          )}
        </div>
        <AuditTimeline entity="series" entityId={series.id} limit={10} />
      </div>
    </div>
  );
}
